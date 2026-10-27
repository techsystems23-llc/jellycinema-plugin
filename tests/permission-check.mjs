// Jelly Cinema automatic permission check.
// Sets up a fresh Jellyfin (test media from make-media.sh, with the plugin installed), creates accounts with
// different limits, then checks two things for every account:
//   1. /JellyCinema/visible gives exactly the same answer as Jellyfin's own item lookup for every title.
//   2. In a real browser, every title Jelly Cinema shows on Home (banner, Top 10, discover rows, seasonal and
//      library rows, with the Christmas season previewed) is one that account may open.
// Any leak fails the run. Usage: node tests/permission-check.mjs [http://localhost:8096]
import { chromium } from 'playwright';

const BASE = (process.argv[2] || process.env.JF_URL || 'http://localhost:8096').replace(/\/$/, '');
const AUTH = (token) => `MediaBrowser Client="jc-test", Device="ci", DeviceId="jc-ci", Version="1.0"${token ? `, Token="${token}"` : ''}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  OK    ${msg}`);

async function api(path, { method = 'GET', token, body, ok = true } = {}) {
  let r;
  for (let i = 0; i < 120; i++) {   // 503 = Jellyfin is still starting up: wait and try again
    try {
      r = await fetch(BASE + path, {
        method,
        headers: { Authorization: AUTH(token), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) { r = null; }           // the start-up page hands over to the real server: connection reset
    if (r && r.status !== 503) break;
    await sleep(1000);
  }
  if (!r) throw new Error(`${method} ${path}: no answer from Jellyfin`);
  if (ok && !r.ok) throw new Error(`${method} ${path} -> ${r.status} ${(await r.text()).slice(0, 300)}`);
  const t = await r.text();
  try { return { status: r.status, data: t ? JSON.parse(t) : null }; } catch { return { status: r.status, data: t }; }
}

async function waitForServer() {
  for (let i = 0; i < 300; i++) {
    // while Jellyfin is still starting up it answers with a 'starting' web page instead of JSON
    try { const r = await fetch(BASE + '/System/Info/Public'); if (r.ok && /json/.test(r.headers.get('content-type') || '')) return; } catch {}
    await sleep(1000);
  }
  throw new Error('Jellyfin did not start');
}

async function setup() {
  const info = (await api('/System/Info/Public')).data;
  if (!info.StartupWizardCompleted) {
    await api('/Startup/Configuration', { method: 'POST', body: { UICulture: 'en-US', MetadataCountryCode: 'US', PreferredMetadataLanguage: 'en' } });
    await api('/Startup/User');
    await api('/Startup/User', { method: 'POST', body: { Name: 'admin', Password: 'admin-pass' } });
    await api('/Startup/RemoteAccess', { method: 'POST', body: { EnableRemoteAccess: true, EnableAutomaticPortMapping: false } });
    await api('/Startup/Complete', { method: 'POST' });
  }
  return login('admin', 'admin-pass');
}

async function login(name, pw) {
  const r = await api('/Users/AuthenticateByName', { method: 'POST', body: { Username: name, Pw: pw } });
  return { token: r.data.AccessToken, id: r.data.User.Id, serverId: r.data.ServerId, name };
}

async function addLibraries(admin) {
  const have = (await api('/Library/VirtualFolders', { token: admin.token })).data.map((f) => f.Name);
  for (const [name, type] of [['Kids', 'movies'], ['Grownup', 'movies'], ['Holiday', 'movies'], ['Shows', 'tvshows']]) {
    if (have.includes(name)) continue;
    await api(`/Library/VirtualFolders?name=${name}&collectionType=${type}&refreshLibrary=false`, {
      method: 'POST', token: admin.token,
      body: { LibraryOptions: { PathInfos: [{ Path: `/media/${name}` }], EnableRealtimeMonitor: false, EnableInternetProviders: false } },
    });
  }
  await api('/Library/Refresh', { method: 'POST', token: admin.token });
  let last = -1;
  for (let i = 0; i < 180; i++) {
    await sleep(2000);
    const n = (await api(`/Items?userId=${admin.id}&Recursive=true&IncludeItemTypes=Movie,Episode&Limit=0`, { token: admin.token })).data.TotalRecordCount;
    if (n >= 24) return n;   // 22 movies + 2 episodes from make-media.sh
    last = n;
  }
  throw new Error(`library scan didn't finish (found ${last} titles)`);
}

async function makeUser(admin, name, change) {
  const users = (await api('/Users', { token: admin.token })).data;
  let u = users.find((x) => x.Name === name);
  if (!u) u = (await api('/Users/New', { method: 'POST', token: admin.token, body: { Name: name, Password: name + '-pass' } })).data;
  const policy = (await api(`/Users/${u.Id}`, { token: admin.token })).data.Policy;
  change(policy);
  await api(`/Users/${u.Id}/Policy`, { method: 'POST', token: admin.token, body: policy });
  return login(name, name + '-pass');
}

async function allIds(admin) {
  const r = await api(`/Items?userId=${admin.id}&Recursive=true&IncludeItemTypes=Movie,Series,Episode,BoxSet&Fields=Tags`, { token: admin.token });
  return r.data.Items.map((i) => ({ id: i.Id, name: i.Name, type: i.Type }));
}

async function truthFor(user, items) {
  const ok = new Set();
  for (const it of items) {
    const r = await api(`/Users/${user.id}/Items/${it.id}`, { token: user.token, ok: false });
    if (r.status === 200) ok.add(it.id.replace(/-/g, '').toLowerCase());
  }
  return ok;
}

const norm = (id) => String(id).replace(/-/g, '').toLowerCase();

async function checkVisibleEndpoint(user, admin, items, truth) {
  const ids = items.map((i) => i.id);
  const mine = new Set(((await api('/JellyCinema/visible', { method: 'POST', token: user.token, body: { Ids: ids } })).data.visible || []).map(norm));
  const forThem = new Set(((await api(`/JellyCinema/visible?userId=${user.id}`, { method: 'POST', token: admin.token, body: { Ids: ids } })).data.visible || []).map(norm));
  let bad = 0;
  for (const it of items) {
    const want = truth.has(norm(it.id));
    if (mine.has(norm(it.id)) !== want || forThem.has(norm(it.id)) !== want) { bad++; fail(`${user.name}: /JellyCinema/visible is wrong for "${it.name}" (Jellyfin says ${want ? 'visible' : 'hidden'})`); }
  }
  if (!bad) pass(`${user.name}: /JellyCinema/visible matches Jellyfin for all ${items.length} titles (${truth.size} visible)`);
}

async function homeShows(browser, user) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  await ctx.addInitScript(({ base, user }) => {
    try {
      localStorage.setItem('jellyfin_credentials', JSON.stringify({ Servers: [{
        ManualAddress: base, LocalAddress: base, LastConnectionMode: 2, Name: 'test', Id: user.serverId,
        DateLastAccessed: Date.now(), UserId: user.id, AccessToken: user.token }] }));
      localStorage.setItem('jc-seasonal-preview', 'christmas');
      sessionStorage.setItem('jc.intro', '1');
    } catch (e) {}
  }, { base: BASE, user });
  const page = await ctx.newPage();
  await page.goto(BASE + '/web/#/home');
  await page.waitForSelector('.homeSectionsContainer .verticalSection', { timeout: 60000 });
  await page.waitForTimeout(20000);   // Jelly Cinema rows arrive over a few seconds
  const shown = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.jc-top10 [data-id], .jc-seasonal-row [data-id], .jc-hmx [data-id]').forEach((e) => {
      const sec = e.closest('.verticalSection'); out.push({ id: e.getAttribute('data-id'), row: (sec && sec.querySelector('h2') ? sec.querySelector('h2').textContent : '').trim() });
    });
    const H = window.JellyCinemaHero;
    ((H && H.ids && H.ids()) || []).forEach((id) => out.push({ id, row: 'banner' }));
    const rows = [...document.querySelectorAll('.jc-top10, .jc-seasonal-row, .jc-hmx')].map((s) => (s.querySelector('h2') || {}).textContent || '');
    return { out, rows };
  });
  await ctx.close();
  return shown;
}

async function main() {
  console.log(`Jelly Cinema permission check against ${BASE}`);
  await waitForServer();
  const admin = await setup();
  const n = await addLibraries(admin);
  pass(`library ready (${n} movies/episodes)`);
  const plugins = (await api('/Plugins', { token: admin.token })).data.filter((p) => /Jelly Cinema/.test(p.Name));
  if (plugins.length !== 1 || plugins[0].Status !== 'Active') fail(`Jelly Cinema plugin not loaded once and Active: ${JSON.stringify(plugins.map((p) => p.Version + ' ' + p.Status))}`);
  else pass(`Jelly Cinema ${plugins[0].Version} Active`);

  const folders = Object.fromEntries((await api('/Library/VirtualFolders', { token: admin.token })).data.map((f) => [f.Name, f.ItemId]));
  const ratings = (await api('/Localization/ParentalRatings', { token: admin.token })).data;
  const pg = ratings.find((r) => r.Name === 'PG');
  const users = [
    await makeUser(admin, 'kid', (p) => { p.EnableAllFolders = false; p.EnabledFolders = [folders.Kids, folders.Holiday]; p.MaxParentalRating = pg ? pg.Value : 10; }),
    await makeUser(admin, 'grownonly', (p) => { p.EnableAllFolders = false; p.EnabledFolders = [folders.Grownup]; }),
    await makeUser(admin, 'nochristmas', (p) => { p.EnableAllFolders = true; p.BlockedTags = ['christmas', 'christmas tree']; }),
    await makeUser(admin, 'newuser', () => {}),
  ];
  // some watch history, so Because You Watched / Watch Again / genre rows have something to work from
  const items = await allIds(admin);
  for (const u of [admin, ...users]) {
    const mine = await truthFor(u, items);
    const some = items.filter((i) => mine.has(norm(i.id)) && i.type === 'Movie').slice(0, 3);
    for (const it of some) await api(`/UserPlayedItems/${it.id}?userId=${u.id}`, { method: 'POST', token: u.token, ok: false });
  }

  // someone else's check is refused for non-admins
  const refused = await api(`/JellyCinema/visible?userId=${admin.id}`, { method: 'POST', token: users[0].token, body: { Ids: [items[0].id] }, ok: false });
  if (refused.status === 403) pass('a non-admin cannot check another account'); else fail(`a non-admin checking another account got ${refused.status}, expected 403`);

  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  for (const u of [admin, ...users]) {
    const truth = await truthFor(u, items);
    await checkVisibleEndpoint(u, admin, items, truth);
    const { out, rows } = await homeShows(browser, u);
    const leaks = out.filter((x) => !truth.has(norm(x.id)));
    leaks.forEach((x) => fail(`${u.name}: Home shows a title this account can't open (row "${x.row}", id ${x.id})`));
    const inBanner = out.filter((x) => x.row === 'banner').length;
    if (!leaks.length) pass(`${u.name}: Home shows ${out.length} titles (${inBanner} in the banner) in ${rows.length} Jelly Cinema rows, none they can't open`);
    const holiday = rows.some((r) => /Holiday/.test(r));
    const wantHoliday = u.name === 'admin' || u.name === 'newuser' || u.name === 'kid';
    if (holiday !== wantHoliday) fail(`${u.name}: "Holiday Christmas" row ${holiday ? 'shown' : 'missing'} (expected ${wantHoliday ? 'shown' : 'not shown'}); rows: ${rows.join(' | ')}`);
    else pass(`${u.name}: library Christmas row ${holiday ? 'shown' : 'not shown'}, as expected`);
  }
  await browser.close();
  console.log(failures ? `\n${failures} problem(s) found` : '\nNo leaks found');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
