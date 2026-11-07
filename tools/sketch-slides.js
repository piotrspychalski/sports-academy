// Sports Academy — sekwencje slajdów szkicu wzorcowego (reference/energy-map.html) dla studia nagrań.
// data/slides/<id>.json — jedna sekwencja na plik; slajd = stan szkicu (temat, narząd, suwaki, otwarte sekcje, pełny ekran, odtwarzanie).
// Slajdy są narastające (jak w prezentacji): każdy dziedziczy wartości suwaków po poprzednim; narząd dziedziczy tylko przy tym samym temacie;
// open / zoom / play / pane / sources dotyczą tylko swojego slajdu.
// Użycie: node tools/sketch-slides.js [plik.json …]   — sprawdza sekwencje i wypisuje rozwinięte slajdy (bez budowania)
//         require('./tools/sketch-slides.js').build(R)  — z build.js: studio/sketch/index.html + kopia szkicu obok
const fs = require('fs'), path = require('path');

const DEFAULTS = { intensity: 65, time: 0, gph: 60, comp: 'gf', glycogen: 'normal', altitude: 0, days: 0, acetazolamide: false, vo2max: 55, mass: 70, ftp: 0 };
const RANGES = { intensity: [5, 150], time: [0, 300], gph: [0, 120], altitude: [0, 5000], days: [0, 70], vo2max: [25, 90], mass: [40, 130], ftp: [0, 600] };
const ENUMS = { comp: ['glc', 'mal', 'suc', 'gf'], glycogen: ['low', 'normal', 'loaded'], pane: ['topic', 'organ', 'settings'] };
const PER_SLIDE = ['open', 'zoom', 'play', 'pane', 'sources'];
const META = ['label', 'note', 'tween'];
const KEYS = new Set(['topic', 'organ', ...Object.keys(DEFAULTS), ...PER_SLIDE, ...META]);
const ASPECTS = { '16:9': [1440, 810], '9:16': [540, 960] };

// Tematy i narządy czytamy ze szkicu, żeby walidacja nie rozjechała się z ryciną
function sketchVocab(html) {
  const g = html.match(/const GROUPS = \[([\s\S]*?)\];\n/);
  if (!g) throw new Error('energy-map.html: nie znaleziono GROUPS');
  const groups = [...g[1].matchAll(/\['(\w+)', '([^']+)', \[([^\]]+)\]\]/g)].map(m => ({ id: m[1], name: m[2], topics: m[3].match(/'(\w+)'/g).map(x => x.slice(1, -1)) }));
  const names = Object.fromEntries([...html.matchAll(/\{ id: '(\w+)', name: '([^']+)', organ: '(\w+)'/g)].map(m => [m[1], { name: m[2], organ: m[3] }]));
  const topics = groups.flatMap((gr, gi) => gr.topics.map((id, ti) => ({ num: `${gi + 1}.${ti + 1}`, id, group: gr.name, ...names[id] })));
  const ob = html.match(/const ORGANS = \{([\s\S]*?)\n\};/);
  const organs = ob ? [...ob[1].matchAll(/^\s+(\w+): \{ name: '([^']+)'/gm)].map(m => ({ id: m[1], name: m[2] })) : [];
  return { topics, organs };
}
const findTopic = (V, v) => { const s = String(v).trim(), lc = s.toLowerCase(); return V.topics.find(t => t.num === s) || V.topics.find(t => t.id === lc) || V.topics.find(t => (t.name || '').toLowerCase() === lc) || null; };

function load(R) {
  const d = path.join(R, 'data/slides');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith('.json')).sort().map(f => ({ ...JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')), _file: f }));
}

function validate(seqs, V, R) {
  const E = [], ids = new Set();
  let dose = null, brands = [];
  try { const z = JSON.parse(fs.readFileSync(path.join(R, 'tests/zakazane.json'), 'utf8')); dose = new RegExp(z.dosePattern, 'i'); brands = z.brands.map(b => new RegExp(`\\b${b}\\b`, 'i')); } catch { /* bez listy */ }
  for (const q of seqs) {
    const at = `sekwencja ${q.id || q._file}`;
    if (!q.id || q._file !== q.id + '.json') E.push(`${at}: id musi zgadzać się z nazwą pliku`);
    if (ids.has(q.id)) E.push(`${at}: powtórzone id`); ids.add(q.id);
    if (!q.title) E.push(`${at}: brak tytułu`);
    if (!['draft', 'published'].includes(q.status)) E.push(`${at}: status musi być draft albo published`);
    if (q.aspect && !ASPECTS[q.aspect]) E.push(`${at}: aspect 16:9 albo 9:16`);
    if (!Array.isArray(q.slides) || !q.slides.length) { E.push(`${at}: brak slajdów`); continue; }
    q.slides.forEach((s, i) => {
      const sat = `${at}, slajd ${i + 1}`;
      for (const k of Object.keys(s)) if (!KEYS.has(k)) E.push(`${sat}: nieznane pole "${k}"`);
      if (s.topic != null && !findTopic(V, s.topic)) E.push(`${sat}: nieznany temat "${s.topic}"`);
      if (s.organ != null && !V.organs.some(o => o.id === s.organ)) E.push(`${sat}: nieznany narząd "${s.organ}" (${V.organs.map(o => o.id).join(', ')})`);
      for (const [k, [lo, hi]] of Object.entries(RANGES)) if (s[k] != null && !(typeof s[k] === 'number' && s[k] >= lo && s[k] <= hi)) E.push(`${sat}: ${k} poza zakresem ${lo}–${hi}`);
      for (const [k, list] of Object.entries(ENUMS)) if (s[k] != null && !list.includes(s[k])) E.push(`${sat}: ${k} jedno z ${list.join(', ')}`);
      if (s.acetazolamide != null && typeof s.acetazolamide !== 'boolean') E.push(`${sat}: acetazolamide true/false`);
      if (s.play != null && !(s.play === true || s.play === 'wall' || (typeof s.play === 'number' && s.play >= 0 && s.play <= 300))) E.push(`${sat}: play = true, "wall" albo minuty 0–300`);
      for (const t of [s.label, s.note].filter(x => typeof x === 'string')) {
        if (dose && dose.test(t)) E.push(`${sat}: dawka w „${t}”`);
        for (const b of brands) if (b.test(t)) E.push(`${sat}: nazwa handlowa ${b.source} w „${t}”`);
      }
    });
  }
  return E;
}

// Slajdy narastające → pełny stan każdego slajdu (krok wstecz i R zawsze dają ten sam obraz)
function resolve(q, V) {
  let acc = { topic: V.topics[0].num, ...DEFAULTS }, organ = null;
  return q.slides.map(s => {
    const t = s.topic != null ? findTopic(V, s.topic) : findTopic(V, acc.topic);
    if (s.topic != null && t.num !== acc.topic) organ = null;   // nowy temat: narząd domyślny tematu
    acc = { ...acc, topic: t.num };
    for (const k of Object.keys(DEFAULTS)) if (s[k] != null) acc[k] = s[k];
    if (s.organ != null) organ = s.organ;
    const st = { ...acc, organ: organ || t.organ };
    for (const k of PER_SLIDE) if (s[k] != null) st[k] = s[k];
    return { label: s.label || `${t.num} ${t.name}`, note: s.note || '', tween: s.tween, state: st };
  });
}

function compile(R) {
  const html = fs.readFileSync(path.join(R, 'reference/energy-map.html'), 'utf8');
  const V = sketchVocab(html), seqs = load(R), errors = validate(seqs, V, R);
  const out = errors.length ? [] : seqs.map(q => ({ id: q.id, title: q.title, status: q.status, aspect: q.aspect || '16:9', frame: ASPECTS[q.aspect || '16:9'], tween: q.tween ?? 900, slides: resolve(q, V) }));
  return { html, V, seqs: out, errors };
}

function build(R, nav = '', favicon = '') {
  const { html, seqs, errors } = compile(R);
  if (errors.length) { console.error('Slajdy szkicu — błędy:\n- ' + errors.join('\n- ')); process.exit(1); }
  const dir = path.join(R, 'studio/sketch');
  fs.mkdirSync(dir, { recursive: true });
  const withNav = h => nav ? h.replace(/<\/body>(?![\s\S]*<\/body>)/, () => `<script>\n${nav}</script>\n</body>`) : h;
  // kopia szkicu dla studia: noindex i bez referrera (publiczna treść, ale prywatny kontekst)
  fs.writeFileSync(path.join(dir, 'energy-map.html'), withNav(html).replace('<head>', '<head>\n<meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer">'));
  const player = fs.readFileSync(path.join(R, 'src/studio-sketch.html'), 'utf8').replace('/*SEQS*/', () => 'const SEQS = ' + JSON.stringify(seqs) + ';');
  fs.writeFileSync(path.join(dir, 'index.html'), withNav(favicon ? player.replace('</title>', () => `</title>\n<link rel="icon" type="image/svg+xml" href="${favicon}">`) : player));
  console.log(`studio/sketch/index.html (lokalnie) · sekwencji slajdów: ${seqs.length} (szkice: ?preview)`);
}

module.exports = { build, compile, sketchVocab, DEFAULTS };

if (require.main === module) {
  const R = path.join(__dirname, '..');
  const { V, seqs, errors } = compile(R);
  if (process.argv.includes('--vocab')) { console.log(JSON.stringify(V, null, 1)); process.exit(0); }
  if (errors.length) { console.log('errors', JSON.stringify(errors, null, 1)); process.exit(1); }
  const only = process.argv.slice(2).map(f => path.basename(f, '.json'));
  for (const q of seqs.filter(q => !only.length || only.includes(q.id))) {
    console.log(`\n${q.id} · ${q.title} · ${q.status} · ${q.aspect} · slajdów: ${q.slides.length}`);
    q.slides.forEach((s, i) => { const st = s.state; console.log(`  ${i + 1}. ${s.label} — ${st.topic}/${st.organ} · ${st.intensity}% · t ${st.time} min · ${st.gph} g/h ${st.comp} · glikogen ${st.glycogen} · ${st.altitude} m${st.days ? ` · dni ${st.days}` : ''}${st.acetazolamide ? ' · acetazolamid' : ''}${st.open ? ` · open ${JSON.stringify(st.open)}` : ''}${st.zoom ? ' · zoom' : ''}${st.play ? ` · play ${st.play}` : ''}`); });
  }
  console.log('errors []');
}
