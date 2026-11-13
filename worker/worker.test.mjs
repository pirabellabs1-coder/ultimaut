// Tests de la logique du Worker (node --test worker/). Les bindings Cloudflare sont simulés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';
import { findRedirect } from './redirects.js';
import rules from './redirects.json' with { type: 'json' };
import { match, compile } from 'path-to-regexp';

const SECRET = 'secret-de-test';

function makeEnv({ maintenance = false, secret = SECRET, kv = true } = {}) {
  const store = new Map(maintenance ? [['maintenance', 'true']] : []);
  return {
    MAINTENANCE_SECRET: secret,
    ASSETS: { fetch: async (req) => new Response('asset:' + new URL(req.url).pathname, { status: 200 }) },
    FLAGS: kv ? { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) } : undefined,
    store,
  };
}

function req(path, { country = 'FR', ua = 'Mozilla/5.0', cookie, method = 'GET', body } = {}) {
  const headers = { 'user-agent': ua };
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const r = new Request('https://ultimauto.fr' + path, { method, headers, body });
  Object.defineProperty(r, 'cf', { value: { country } });
  return r;
}

const run = (path, opts, env = makeEnv()) => worker.fetch(req(path, opts), env);

test('redirection exacte, slash final et casse', async () => {
  for (const p of ['/suppression-adblue', '/suppression-adblue/', '/Suppression-AdBlue']) {
    const r = await run(p);
    assert.equal(r.status, 301, p);
    assert.equal(r.headers.get('location'), 'https://ultimauto.fr/gestion-probleme-adblue');
  }
});

test('la query string est conservée sur une redirection', async () => {
  const r = await run('/suppression-adblue?utm_source=x');
  assert.equal(r.headers.get('location'), 'https://ultimauto.fr/gestion-probleme-adblue?utm_source=x');
});

test('redirections à motif (paramètres reportés)', () => {
  assert.equal(findRedirect('/suppression-adblue/cholet'), '/gestion-probleme-adblue/cholet');
  assert.equal(findRedirect('/suppression-adblue/cholet/'), '/gestion-probleme-adblue/cholet');
  assert.equal(findRedirect('/2025/05/un-article'), '/blog');
  assert.equal(findRedirect('/tag/fap'), '/blog');
  assert.equal(findRedirect('/post-sitemap.xml'), '/sitemap-index.xml');
  assert.equal(findRedirect('/location-shampouineuse-cholet'), '/');
  assert.equal(findRedirect('/contre-visite-ct'), '/blog/decalaminage-avant-controle-technique');
  assert.equal(findRedirect('/contact'), null);
  assert.equal(findRedirect('/'), null);
  assert.equal(findRedirect('/sitemap-index.xml'), null);
});

// Oracle indépendant : path-to-regexp (moteur historique des redirections Vercel), slash final optionnel,
// insensible à la casse, première règle gagnante — la sémantique retenue pour le Worker.
function oracle(pathname) {
  for (const r of rules) {
    const m = match(r.source, { strict: false, sensitive: false, decode: decodeURIComponent })(pathname);
    if (m) return compile(r.destination)(m.params);
  }
  return null;
}

test('toutes les redirections de redirects.json = oracle path-to-regexp', () => {
  const samples = new Set();
  for (const r of rules) {
    const base = r.source.replace(/:(\w+)\(\.\*\)/g, 'a/b-c').replace(/:(\w+)/g, 'valeur');
    for (const p of [base, base.replace(/\/$/, ''), base.replace(/\/?$/, '/'), base.toUpperCase()]) if (p) samples.add(p);
  }
  for (const p of ['/', '/contact', '/blog', '/2024', '/2024/', '/tag', '/tag/', '/sitemap-index.xml']) samples.add(p);
  assert.ok(samples.size > 700);
  for (const p of samples) assert.equal(findRedirect(p), oracle(p), p);
});

test('slash final retiré en 308 (query conservée)', async () => {
  const r = await run('/contact/?a=1');
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('location'), 'https://ultimauto.fr/contact?a=1');
});

test('page normale servie avec les en-têtes de sécurité', async () => {
  const r = await run('/contact');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'asset:/contact');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
});

test('maintenance : 503 pour les visiteurs (et les robots), propriétaire et /pilote passent', async () => {
  const env = makeEnv({ maintenance: true });
  const v = await run('/', {}, env);
  assert.equal(v.status, 503);
  assert.equal(v.headers.get('retry-after'), '3600');
  assert.match(await v.text(), /Site en maintenance/);
  assert.equal((await run('/', { ua: 'Googlebot/2.1' }, env)).status, 503);
  assert.equal((await run('/', { cookie: 'ua_ok=acces-prive-ultimauto' }, env)).status, 200);
  assert.equal((await run('/pilote', {}, env)).status, 200);
  assert.equal((await run('/favicon.svg', {}, env)).status, 200, 'les fichiers ne sont pas concernés');
});

test('maintenance OFF si le KV est absent (fail-safe)', async () => {
  assert.equal((await run('/', {}, makeEnv({ kv: false }))).status, 200);
});

test('accès privé : ?acces= pose le cookie', async () => {
  const r = await run('/?acces=acces-prive-ultimauto');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('set-cookie'), /^ua_ok=acces-prive-ultimauto;.*Max-Age=31536000/);
});

test('géo-blocage : humains bloqués, robots et propriétaire autorisés', async () => {
  const b = await run('/', { country: 'US' });
  assert.equal(b.status, 403);
  assert.match(await b.text(), /pas accessible depuis votre pays/);
  assert.equal((await run('/', { country: 'US', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).status, 200);
  assert.equal((await run('/', { country: 'US', cookie: 'ua_ok=acces-prive-ultimauto' })).status, 200);
  assert.equal((await run('/', { country: 'FR' })).status, 200);
  assert.equal((await run('/', { country: '' })).status, 200);
  assert.equal((await run('/robots.txt', { country: 'US' })).status, 200, 'fichiers non bloqués par le géo-blocage');
});

test('API maintenance : secret, lecture, écriture', async () => {
  const env = makeEnv();
  const call = (path, o) => worker.fetch(req(path, o), env);
  assert.equal((await call('/api/maintenance?cle=faux')).status, 401);
  assert.equal((await call('/api/maintenance')).status, 401);
  let r = await call('/api/maintenance?cle=' + SECRET);
  assert.deepEqual(await r.json(), { on: false });
  r = await call('/api/maintenance', { method: 'POST', body: JSON.stringify({ cle: SECRET, on: true }) });
  assert.deepEqual(await r.json(), { on: true });
  assert.equal(env.store.get('maintenance'), 'true');
  assert.equal((await call('/', {})).status, 503);
  r = await call('/api/maintenance', { method: 'POST', body: JSON.stringify({ cle: 'faux', on: false }) });
  assert.equal(r.status, 401);
  assert.equal((await call('/api/maintenance', { method: 'POST', body: '{oops' })).status, 400);
  assert.equal((await call('/api/maintenance', { method: 'PUT' })).status, 405);
  assert.equal((await worker.fetch(req('/api/maintenance?cle=x'), makeEnv({ secret: '' }))).status, 500);
});

test('API contact : méthode, validation, honeypot, JSON invalide', async () => {
  assert.equal((await run('/api/contact')).status, 405);
  const post = (body) => run('/api/contact', { method: 'POST', body });
  let r = await post(JSON.stringify({ nom: 'A' }));
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: 'champs_requis' });
  assert.equal((await post(JSON.stringify({ botcheck: 'spam' }))).status, 200);
  assert.equal((await post('{oops')).status, 500);
  r = await post(JSON.stringify({ nom: 'A', telephone: '0600000000', message: 'x' }));
  assert.deepEqual(await r.json(), { error: 'config_manquante' }, 'sans RESEND_API_KEY');
});

test('les API ne sont ni redirigées ni géo-bloquées', async () => {
  assert.equal((await run('/api/contact', { country: 'US' })).status, 405);
});

test('/pilote/ -> 308 puis /pilote joignable en maintenance', async () => {
  const env = makeEnv({ maintenance: true });
  const r = await run('/pilote/', {}, env);
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('location'), 'https://ultimauto.fr/pilote');
});

test('?acces= pendant la maintenance : site visible et cookie posé', async () => {
  const r = await run('/?acces=acces-prive-ultimauto', {}, makeEnv({ maintenance: true }));
  assert.equal(r.status, 200);
  assert.ok(r.headers.get('set-cookie'));
});

test('les redirections passent avant maintenance et géo-blocage', async () => {
  const r = await run('/suppression-adblue', { country: 'US' }, makeEnv({ maintenance: true }));
  assert.equal(r.status, 301);
});

test('API maintenance : clé par en-tête X-Cle, clé vide refusée, corps vide = 401', async () => {
  const env = makeEnv();
  const ok = await worker.fetch(new Request('https://ultimauto.fr/api/maintenance', { headers: { 'x-cle': SECRET } }), env);
  assert.deepEqual(await ok.json(), { on: false });
  assert.equal((await run('/api/maintenance?cle=', {}, env)).status, 401);
  assert.equal((await run('/api/maintenance', { method: 'POST', body: '' }, env)).status, 401);
});

test('API contact : corps vide = 400, champs trop longs, e-mail invalide', async () => {
  const post = (b) => run('/api/contact', { method: 'POST', body: b });
  assert.equal((await post('')).status, 400);
  const base = { nom: 'A', telephone: '0600000000', message: 'x' };
  let r = await post(JSON.stringify({ ...base, message: 'x'.repeat(5001) }));
  assert.deepEqual(await r.json(), { error: 'champs_trop_longs' });
  for (const email of ['a@b.fr,c@d.fr', 'pas-une-adresse', 'a b@c.fr']) {
    r = await post(JSON.stringify({ ...base, email }));
    assert.deepEqual(await r.json(), { error: 'email_invalide' }, email);
  }
});

test('API contact : envoi Resend (notification + accusé), erreurs masquées', async () => {
  const calls = [];
  const realFetch = globalThis.fetch;
  const realErr = console.error;
  console.error = () => {};
  try {
    globalThis.fetch = async (u, o) => { calls.push(JSON.parse(o.body)); return new Response('{}', { status: 200 }); };
    const env = { ...makeEnv(), RESEND_API_KEY: 're_test', CONTACT_FROM: 'Ultimauto <contact@ultimauto.fr>', CONTACT_TO: 'atelier@example.com' };
    const body = JSON.stringify({ nom: 'Léa <b>', telephone: '06"x', email: 'lea@example.com', message: 'Bonjour', departement: '49' });
    let r = await worker.fetch(req('/api/contact', { method: 'POST', body }), env);
    assert.deepEqual(await r.json(), { ok: true });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].to, ['atelier@example.com']);
    assert.equal(calls[0].reply_to, 'lea@example.com');
    assert.match(calls[0].subject, /\(49\)$/);
    assert.ok(!calls[0].html.includes('<b>') && calls[0].html.includes('06&quot;x'), 'HTML échappé, guillemets compris');
    assert.deepEqual(calls[1].to, ['lea@example.com']);

    globalThis.fetch = async () => new Response('domaine non vérifié : détail interne', { status: 403 });
    r = await worker.fetch(req('/api/contact', { method: 'POST', body }), env);
    assert.equal(r.status, 502);
    assert.deepEqual(await r.json(), { error: 'envoi_echoue' }, 'pas de détail Resend renvoyé');

    globalThis.fetch = async () => { throw new Error('réseau'); };
    r = await worker.fetch(req('/api/contact', { method: 'POST', body }), env);
    assert.equal(r.status, 500);
  } finally {
    globalThis.fetch = realFetch;
    console.error = realErr;
  }
});

test('limite de débit : 429 au-delà du quota, par API', async () => {
  const limiter = (max) => { let n = 0; return { limit: async () => ({ success: ++n <= max }) }; };
  const env = { ...makeEnv(), CONTACT_LIMITER: limiter(1), MAINTENANCE_LIMITER: limiter(1) };
  const post = () => worker.fetch(req('/api/contact', { method: 'POST', body: '{}' }), env);
  assert.equal((await post()).status, 400);
  const r = await post();
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '60');
  assert.equal((await worker.fetch(req('/api/maintenance'), env)).status, 401);
  assert.equal((await worker.fetch(req('/api/maintenance'), env)).status, 429);
  const broken = { ...makeEnv(), CONTACT_LIMITER: { limit: async () => { throw new Error('x'); } } };
  assert.equal((await worker.fetch(req('/api/contact', { method: 'POST', body: '{}' }), broken)).status, 400, 'limiteur en panne = pas de blocage');
});

test('adresse *.workers.dev : noindex ; ultimauto.fr : indexable', async () => {
  const r = await worker.fetch(new Request('https://ultimauto.compte.workers.dev/contact'), makeEnv());
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal((await run('/contact')).headers.get('x-robots-tag'), null);
});

test('www.ultimauto.fr redirige en 301 vers ultimauto.fr (chemin + query conservés)', async () => {
  const r = await worker.fetch(new Request('https://www.ultimauto.fr/contact?x=1'), makeEnv());
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), 'https://ultimauto.fr/contact?x=1');
});
