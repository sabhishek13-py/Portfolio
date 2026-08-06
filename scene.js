/* ═══════════════════════════════════════════════════════════════════════
   yogabhishek.dev — a scroll-driven coastline
   Nine camera stops strung along a path over the water. Scroll moves the
   camera; the overlay cards fade in at each stop. Everything below is
   built from primitives — no external models.
   ═══════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* ── bail out to the flat page if WebGL or motion isn't available ─────── */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
if (!hasWebGL() || reduced) {
  document.body.classList.add('flat');
  throw new Error('flat mode');
}

/* ═══════════════════════ 1. content: the nine stops ═══════════════════ */

const STOPS = [
  {
    chapter: 'ch-hero',
    pos: [  6, 16,  80 ], look: [  0,  9,  10 ],
  },
  {
    chapter: 'ch-about',
    pos: [-28, 11,  48 ], look: [ -6,  5,  10 ],
  },
  {
    chapter: 'ch-skills',
    pos: [ 15,  7.5, 39 ], look: [  3,  2.5, 22 ],
  },
  {
    chapter: 'ch-work',
    pos: [ 25, 13,   9 ], look: [  6,  4, -13 ],
    card: `
      <p class="role">Work · May 2026 – Aug 2026</p>
      <h2>FlyRank AI — Frontend Engineering Intern</h2>
      <p>Built a React + TypeScript component library of 25+ primitives adopted across 6 product modules, cutting new-feature build time ~30%. Shipped alongside 4 engineers through Agile sprints, code review and CI/CD.</p>
      <p>Wired 15+ REST endpoints into typed clients with retry logic and centralized error handling — API bug reports down ~40%.</p>
      <div class="stat">
        <div><b>3.2s → 1.8s</b><i>page load</i></div>
        <div><b>68 → 92</b><i>Lighthouse</i></div>
        <div><b>−25%</b><i>bundle size</i></div>
      </div>`,
    kicker: `Request caching, debouncing, parallel loading, code splitting — the boring wins that actually move the number.`,
  },
  {
    chapter: 'ch-work',
    pos: [-31, 13,   3 ], look: [-15,  9, -13 ],
    card: `
      <p class="role">Open source · 2025 – Present</p>
      <h2>Zulip — Contributor</h2>
      <p>Python, Django, Docker. I run the server locally in Docker to reproduce issues and validate backend changes before a PR ever goes up — it shortens the maintainer review cycle, which is the scarcest resource an open-source project has.</p>
      <p>Contributed Django changes improving webhook permission handling, updated the API docs for integration endpoints, and submitted a Google Summer of Code proposal.</p>`,
    kicker: `The lighthouse keeper's job: fix the thing everyone else has to sail past.`,
  },
  {
    chapter: 'ch-projects',
    pos: [-15, 11, -35 ], look: [-11,  3.5, -56 ],
    card: `
      <p class="role">Project · Python · OpenAI · Vector DB · Flask · React</p>
      <h2>AI Product Intelligence Platform</h2>
      <p>An LLM pipeline that turns unstructured product data — websites, PDFs, catalogs — into structured, commerce-ready JSON. Manual cataloging effort down ~80%, with scraping-to-validation handoffs automated through n8n and Apify.</p>
      <p>Document parsing and image understanding process 500+ product pages a run at ~95% field-extraction accuracy using schema-constrained prompting. RAG over a vector index of 10,000+ chunks returns enrichment context in under a second.</p>
      <div class="pips"><i class="on"></i><i></i></div>`,
  },
  {
    chapter: 'ch-projects',
    pos: [  8, 11, -35 ], look: [ 12,  3.5, -56 ],
    card: `
      <p class="role">Project · React · Supabase · PostgreSQL</p>
      <h2>Workday Hub</h2>
      <p>A knowledge-management platform with Supabase auth and role-based access control — full CRUD across notes, resources and dashboard modules behind a responsive React frontend.</p>
      <p>The interesting half is the schema: normalized PostgreSQL with row-level security policies, so user data is isolated at the database layer and cross-account reads are impossible by default rather than by convention.</p>
      <div class="pips"><i></i><i class="on"></i></div>`,
  },
  {
    chapter: 'ch-contact',
    pos: [  2, 27, -80 ], look: [  2, 46, -114 ],
  },
];

const DOT_LABELS = ['Hero', 'About', 'Workshop', 'Work', 'Open source', 'Projects', 'Projects', 'Say hi'];

/* ═══════════════════════ 2. palette per stop ═════════════════════════ */

const C = (h) => new THREE.Color(h);
const TOD = [
  /* 0 hero      */ { top:'#93D3EC', bot:'#FFEFD2', sun:'#FFF6DE', fog:'#FFE8C9', deep:'#2C7FA6', shal:'#79C8D8', amb:'#FFE8C9', dir:'#FFF2D8', dirI:1.55, ambI:0.85, night:0 },
  /* 1 about     */ { top:'#8FCFEA', bot:'#FFE9C6', sun:'#FFF3D2', fog:'#FFE3BC', deep:'#2A7BA4', shal:'#74C4D6', amb:'#FFE3BC', dir:'#FFEFCE', dirI:1.5,  ambI:0.85, night:0 },
  /* 2 workshop  */ { top:'#89C4E4', bot:'#FFDFB4', sun:'#FFEEC6', fog:'#FFDCAE', deep:'#2A7099', shal:'#72BCCE', amb:'#FFDCAE', dir:'#FFE8BE', dirI:1.5,  ambI:0.82, night:0 },
  /* 3 work      */ { top:'#7FB6D9', bot:'#FFE2C0', sun:'#FFEDC8', fog:'#FFE2C0', deep:'#2A6A93', shal:'#6EB2C6', amb:'#FFCF9C', dir:'#FFDCA8', dirI:1.5,  ambI:0.80, night:0 },
  /* 4 open src  */ { top:'#74A6D0', bot:'#FFD5AA', sun:'#FFE4B4', fog:'#FFD5AA', deep:'#2B628B', shal:'#69A8BE', amb:'#FFC08A', dir:'#FFD199', dirI:1.45, ambI:0.78, night:0 },
  /* 5 proj 1    */ { top:'#6C86BC', bot:'#FFBB8C', sun:'#FFD49C', fog:'#FFBB8C', deep:'#345F7C', shal:'#6C93A8', amb:'#FFAE80', dir:'#FFBE88', dirI:1.30, ambI:0.73, night:0.20 },
  /* 6 proj 2    */ { top:'#41508C', bot:'#D8805F', sun:'#F09A6E', fog:'#D8805F', deep:'#3A4C63', shal:'#586A80', amb:'#E07E5C', dir:'#FF9160', dirI:0.95, ambI:0.62, night:0.55 },
  /* 7 contact   */ { top:'#050914', bot:'#1D2447', sun:'#3A4470', fog:'#101733', deep:'#101B33', shal:'#1B2A50', amb:'#2A3560', dir:'#8FA0D8', dirI:0.30, ambI:0.42, night:1 },
];

/* ═══════════════════════ 3. renderer, scene, camera ══════════════════ */

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xFFE8C9, 70, 260);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.5, 900);
camera.position.set(...STOPS[0].pos);

/* ── lights ── */
const hemi = new THREE.HemisphereLight(0xFFE8C9, 0x6B8FA0, 0.85);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xFFF2D8, 1.55);
sun.position.set(60, 48, 90);
scene.add(sun);
const rim = new THREE.DirectionalLight(0xFFB597, 0.35);
rim.position.set(-70, 24, -60);
scene.add(rim);

/* ═══════════════════════ 4. sky dome ═════════════════════════════════ */

const skyU = {
  top:  { value: C(TOD[0].top) },
  bot:  { value: C(TOD[0].bot) },
  sunC: { value: C(TOD[0].sun) },
  sunP: { value: new THREE.Vector3(0.42, 0.20, 0.88).normalize() },
  glow: { value: 1.0 },
};
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(420, 40, 28),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 top, bot, sunC, sunP; uniform float glow;
      varying vec3 vDir;
      void main(){
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(bot, top, smoothstep(0.46, 0.86, h));
        // low warm band hugging the horizon
        col = mix(col, bot, pow(1.0 - abs(vDir.y), 8.0) * 0.38);
        // the sun and its bloom
        float d = max(dot(normalize(vDir), normalize(sunP)), 0.0);
        col += sunC * pow(d, 220.0) * 1.5 * glow;
        col += sunC * pow(d, 8.0) * 0.30 * glow;
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
));

/* ═══════════════════════ 5. ocean ════════════════════════════════════ */

/* shoreline foam is driven by the four island centres, passed as xz + radius */
const ISLES = [
  new THREE.Vector3(  0, 22,  -5 ),   // main island   (x, radius, z)
  new THREE.Vector3(-11,  7, -56 ),
  new THREE.Vector3( 12,  7.5, -56 ),
];

const oceanU = {
  time: { value: 0 },
  deep: { value: C(TOD[0].deep) },
  shal: { value: C(TOD[0].shal) },
  fogC: { value: C(TOD[0].fog) },
  sunP: { value: new THREE.Vector3(60, 48, 90).normalize() },
  spec: { value: 1.0 },
  isles:{ value: ISLES },
};

const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(700, 700, 200, 200),
  new THREE.ShaderMaterial({
    uniforms: oceanU,
    vertexShader: `
      uniform float time; varying vec3 vW; varying float vH;
      float wave(vec2 p, vec2 d, float f, float s, float a){ return a * sin(dot(p, d) * f + time * s); }
      void main(){
        vec3 p = position;
        vec2 xz = vec2(p.x, p.y);            // plane is XY before the -PI/2 rotation
        float h  = wave(xz, normalize(vec2( 1.0, 0.35)), 0.115, 1.05, 0.62);
              h += wave(xz, normalize(vec2(-0.4, 1.0 )), 0.170, 1.42, 0.38);
              h += wave(xz, normalize(vec2( 0.8,-0.7 )), 0.330, 2.10, 0.15);
              h += wave(xz, normalize(vec2(-0.9,-0.2 )), 0.620, 3.05, 0.06);
        p.z += h;
        vH = h;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vW = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `
      uniform vec3 deep, shal, fogC, sunP; uniform float time, spec;
      uniform vec3 isles[3];
      varying vec3 vW; varying float vH;
      void main(){
        // rough normal reconstructed from screen-space derivatives of height
        vec3 n = normalize(vec3(-dFdx(vH) * 6.0, 1.0, -dFdy(vH) * 6.0));
        vec3 view = normalize(cameraPosition - vW);

        float fres = pow(1.0 - max(dot(n, view), 0.0), 3.0);
        vec3 col = mix(deep, shal, clamp(vH * 0.45 + 0.5, 0.0, 1.0));
        col = mix(col, shal * 1.18, fres * 0.55);

        // specular glitter off the sun
        vec3 h = normalize(normalize(sunP) + view);
        col += vec3(1.0, 0.94, 0.82) * pow(max(dot(n, h), 0.0), 90.0) * 1.6 * spec;

        // foam rings around each island, wobbled so they aren't perfect circles
        float foam = 0.0;
        for (int i = 0; i < 3; i++) {
          vec2 c = vec2(isles[i].x, isles[i].z);
          float r = isles[i].y;
          float d = distance(vW.xz, c);
          float wob = sin(atan(vW.z - c.y, vW.x - c.x) * 7.0 + time * 0.6) * 0.7;
          foam += smoothstep(r + 3.2 + wob, r + 0.2 + wob, d) * smoothstep(r - 2.6, r + 0.6, d);
        }
        foam = clamp(foam, 0.0, 1.0) * (0.55 + 0.45 * sin(time * 1.7 + vW.x * 0.3));
        col = mix(col, vec3(1.0, 0.99, 0.95), clamp(foam, 0.0, 1.0) * 0.75);

        // distance fog, matched to the sky's horizon colour
        float f = smoothstep(70.0, 300.0, length(cameraPosition - vW));
        gl_FragColor = vec4(mix(col, fogC, f), 1.0);
      }`,
  })
);
ocean.rotation.x = -Math.PI / 2;
scene.add(ocean);

/* ═══════════════════════ 6. world building blocks ════════════════════ */

const mat = (hex, rough = 0.85, flat = true) =>
  new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.02, flatShading: flat });

const M = {
  sand:  mat(0xF0D2A0),
  sand2: mat(0xE3BE86),
  grass: mat(0x8FBE68),
  grass2:mat(0x7BA855),
  rock:  mat(0xB08968),
  wood:  mat(0xA9744F),
  wood2: mat(0x8B5E3C),
  wall:  mat(0xFFF3E2),
  wall2: mat(0xFFE3B0),
  roofA: mat(0xE8593A),
  roofB: mat(0xC4593F),
  roofC: mat(0xE8925A),
  trunk: mat(0x9A6B45),
  leaf:  mat(0x6FA84E),
  leaf2: mat(0x86C062),
  white: mat(0xFFFBF4),
  glass: new THREE.MeshStandardMaterial({ color: 0xFFD98A, emissive: 0xFFC97E, emissiveIntensity: 0.9, roughness: 0.4 }),
  lamp:  new THREE.MeshBasicMaterial({ color: 0xFFF4D6 }),
  sail:  mat(0xFFFBF4, 0.9),
  cloth: mat(0xFFB597, 0.9),
};

/* windows that light up as night falls */
const windows = [];
function addWindow(parent, x, y, z, w = 0.42, h = 0.5, ry = 0) {
  const m = M.glass.clone();
  m.emissiveIntensity = 0;
  const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), m);
  q.position.set(x, y, z); q.rotation.y = ry;
  parent.add(q); windows.push(m);
}

/* ── palm ── */
function palm(x, z, scale = 1, tilt = 0) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.3, 3.6, 7), M.trunk);
  trunk.position.y = 1.8; g.add(trunk);
  const crown = new THREE.Group();
  crown.position.y = 3.5;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.5, 3), i % 2 ? M.leaf : M.leaf2);
    f.rotation.z = Math.PI / 2 - 0.42;
    f.rotation.y = (i / n) * Math.PI * 2;
    f.position.set(Math.cos(i / n * Math.PI * 2) * 1.05, 0.18, Math.sin(i / n * Math.PI * 2) * 1.05);
    f.scale.set(1, 1, 0.32);
    crown.add(f);
  }
  const coco = new THREE.Mesh(new THREE.SphereGeometry(0.19, 6, 5), M.wood2);
  coco.position.set(0.2, -0.15, 0.15); crown.add(coco);
  g.add(crown);
  g.position.set(x, 0, z);
  g.rotation.z = tilt;
  g.rotation.y = Math.random() * Math.PI;
  g.scale.setScalar(scale);
  return g;
}

/* ── cottage ── */
function cottage(x, z, ry, w = 2.6, d = 2.4, h = 2.1, roof = M.roofA, wall = M.wall) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall);
  body.position.y = h / 2; g.add(body);
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, 1.5, 4), roof);
  r.position.y = h + 0.72; r.rotation.y = Math.PI / 4; g.add(r);
  addWindow(g, 0, h * 0.55, d / 2 + 0.03);
  addWindow(g, w / 2 + 0.03, h * 0.55, 0, 0.42, 0.5, Math.PI / 2);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.08), M.wood2);
  door.position.set(-w * 0.28, 0.5, d / 2 + 0.03); g.add(door);
  g.position.set(x, 0, z); g.rotation.y = ry;
  return g;
}

/* ── crate ── */
function crate(x, y, z, s = 0.8, ry = 0) {
  const c = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), Math.random() > 0.5 ? M.wood : M.wood2);
  c.position.set(x, y + s / 2, z); c.rotation.y = ry;
  return c;
}

/* ── island: a stack of squashed cylinders, sand skirt up to grass cap ── */
function island(cx, cz, radius, height, seed = 1) {
  const g = new THREE.Group();
  const layers = [
    { r: radius,        y: -1.4, h: 2.6, m: M.sand2 },
    { r: radius * 0.94, y:  0.1, h: 1.1, m: M.sand  },
    { r: radius * 0.80, y:  0.7, h: 0.9, m: M.grass2 },
    { r: radius * 0.62, y:  1.2, h: height, m: M.grass },
  ];
  layers.forEach((L, i) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(L.r * 0.93, L.r, L.h, 13 + i, 1),
      L.m
    );
    m.position.y = L.y;
    m.rotation.y = seed * 0.7 + i * 0.4;
    g.add(m);
  });
  g.position.set(cx, 0, cz);
  return g;
}

/* ═══════════════════════ 7. the main island ══════════════════════════ */

const world = new THREE.Group();
scene.add(world);

world.add(island(0, -5, 22, 1.6, 1.3));

/* a rocky headland on the west, for the lighthouse to stand on */
{
  const head = new THREE.Group();
  [[0, 0, 5.2, 3.4], [3.4, 1.2, 3.2, 2.2], [-3, 0.6, 3.0, 2.0]].forEach(([dx, dz, r, h], i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, h, 9), i ? M.rock : M.sand2);
    m.position.set(dx, h / 2 - 0.6, dz); m.rotation.y = i * 0.8;
    head.add(m);
  });
  head.position.set(-14, 0.9, -14);
  world.add(head);
}

/* ── the lighthouse ── */
const beacon = new THREE.Group();
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.4, 1.0, 12), M.rock);
  base.position.y = 0.5; beacon.add(base);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.75, 9, 14), M.white);
  tower.position.y = 5.4; beacon.add(tower);
  /* coral bands */
  [3.0, 6.0].forEach((y) => {
    const t = 1.75 - (y / 9) * 0.7;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(t + 0.03, t + 0.09, 1.2, 14), M.roofA);
    b.position.y = y; beacon.add(b);
  });
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.22, 14), M.wood2);
  deck.position.y = 10.0; beacon.add(deck);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.06, 5, 16), M.wood2);
  rail.position.y = 10.5; rail.rotation.x = Math.PI / 2; beacon.add(rail);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.5, 12), M.glass);
  lamp.position.y = 10.9; beacon.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.2, 12), M.roofB);
  cap.position.y = 12.2; beacon.add(cap);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.lamp);
  knob.position.y = 12.95; beacon.add(knob);
  beacon.position.set(-14, 1.6, -14);
  world.add(beacon);
}
/* the rotating beam, only visible once dusk sets in */
const beamMat = new THREE.MeshBasicMaterial({
  color: 0xFFE3B0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
});
const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 46, 4, 1, true), beamMat);
beam.rotation.z = Math.PI / 2;
beam.position.set(23, 0, 0);
const beamPivot = new THREE.Group();
beamPivot.position.set(-14, 12.5, -14);
beamPivot.add(beam);
world.add(beamPivot);
const beaconLight = new THREE.PointLight(0xFFD98A, 0, 60, 2);
beaconLight.position.set(-14, 12.5, -14);
world.add(beaconLight);

/* ── the village (the FlyRank stop) ── */
{
  const v = new THREE.Group();
  const plots = [
    [  0, 0,  0.3, 3.0, 2.6, 2.3, M.roofA, M.wall ],
    [  4.6, -2.2, -0.6, 2.5, 2.3, 2.0, M.roofC, M.wall2 ],
    [ -4.2, -1.4,  0.9, 2.4, 2.2, 1.9, M.roofB, M.wall ],
    [  1.8, -6.0,  0.2, 2.8, 2.5, 2.2, M.roofC, M.wall  ],
    [ -2.6, -6.4, -0.5, 2.3, 2.1, 1.8, M.roofA, M.wall2 ],
    [  6.2,  2.4,  1.3, 2.2, 2.0, 1.7, M.roofB, M.wall  ],
  ];
  plots.forEach(([x, z, ry, w, d, h, roof, wall]) => v.add(cottage(x, z, ry, w, d, h, roof, wall)));

  /* a lantern strung between two posts, the village's warm spot */
  [[-6.6, 1.4], [7.6, -4.6]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.0, 6), M.wood2);
    post.position.set(x, 1.5, z); v.add(post);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), M.glass);
    l.position.set(x, 3.05, z); v.add(l);
    windows.push(l.material = M.glass.clone());
    l.material.emissiveIntensity = 0;
  });

  /* footpath */
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.14, 7), M.sand);
    s.position.set(Math.sin(i * 0.55) * 2.2 - 1, 0.06, 6 - i * 1.15);
    s.rotation.y = i; v.add(s);
  }
  v.position.set(6, 1.6, -14);
  world.add(v);
}

/* ── the workshop dock (the skills stop) ── */
{
  const d = new THREE.Group();
  /* planks running out over the water */
  for (let i = 0; i < 15; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 0.72), i % 2 ? M.wood : M.wood2);
    p.position.set(0, 0, i * 0.86);
    d.add(p);
  }
  /* posts sunk into the water */
  for (let i = 0; i < 8; i++) {
    [-1.5, 1.5].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.4, 6), M.wood2);
      post.position.set(x, -1.6, i * 1.7);
      d.add(post);
    });
  }
  /* the workbench at the end: crates, barrels, a hanging lamp */
  d.add(crate(-1.0, 0.08, 9.4, 0.9, 0.3));
  d.add(crate(-1.0, 0.98, 9.4, 0.7, -0.5));
  d.add(crate( 1.0, 0.08, 10.6, 1.0, 0.15));
  d.add(crate( 0.1, 0.08, 11.8, 0.8, 0.8));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.1, 10), M.roofB);
  barrel.position.set(1.1, 0.63, 8.2); d.add(barrel);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.9), M.wood);
  bench.position.set(0, 0.95, 6.4); d.add(bench);
  [[-1.1, 5.99], [1.1, 5.99], [-1.1, 6.81], [1.1, 6.81]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.88, 0.14), M.wood2);
    leg.position.set(x, 0.44, z); d.add(leg);
  });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 6), M.wood2);
  mast.position.set(-1.5, 1.8, 12.2); d.add(mast);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), M.wood2);
  arm.position.set(-0.9, 3.5, 12.2); d.add(arm);
  const hang = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), M.glass.clone());
  hang.material.emissiveIntensity = 0;
  hang.position.set(-0.25, 3.2, 12.2); d.add(hang);
  windows.push(hang.material);

  d.position.set(2, 0.9, 15);
  d.rotation.y = 0.14;
  world.add(d);
}

/* ── palms and shrubs scattered over the main island ── */
{
  const spots = [
    [-8, 4, 1.05, 0.1], [-11, -1, 0.9, -0.12], [11, 2, 1.0, 0.08], [13.5, -6, 0.85, -0.06],
    [-6, -12, 0.95, 0.05], [15, -10, 0.9, 0.12], [-15, -3, 0.8, -0.15], [8, 6, 1.1, -0.08],
    [-3, 8, 0.95, 0.09], [4, 9, 0.85, -0.1], [-12, -14, 0.9, 0.07], [16, 1, 0.8, 0.11],
  ];
  spots.forEach(([x, z, s, t]) => {
    const p = palm(x, z - 5, s, t);
    p.position.y = 1.55;
    world.add(p);
  });
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 12;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + Math.random() * 0.4, 0), Math.random() > 0.5 ? M.leaf : M.leaf2);
    b.position.set(Math.cos(a) * r, 1.7, Math.sin(a) * r - 5);
    b.scale.y = 0.7;
    world.add(b);
  }
  /* driftwood rocks on the sand */
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 5;
    const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.55, 0), M.rock);
    k.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r - 5);
    k.rotation.set(Math.random(), Math.random(), Math.random());
    world.add(k);
  }
}

/* ═══════════════════════ 8. the project isles ════════════════════════ */

const PROJ_ISLES = [
  { x: -11, z: -56, r: 7,   accent: M.roofA },
  { x:  12, z: -56, r: 7.5, accent: M.roofC },
];

PROJ_ISLES.forEach((P, i) => {
  world.add(island(P.x, P.z, P.r, 1.2, i + 2));

  /* each isle gets a marker: a little tower with a lit top */
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 4.2, 8), M.wall);
  post.position.y = 2.1; g.add(post);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.8, 8), P.accent);
  band.position.y = 2.4; g.add(band);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.1, 8), P.accent);
  cap.position.y = 4.7; g.add(cap);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), M.glass.clone());
  bulb.material.emissiveIntensity = 0;
  bulb.position.y = 5.5; g.add(bulb);
  windows.push(bulb.material);
  g.position.set(P.x, 1.3, P.z);
  world.add(g);

  /* palms + a crate or two */
  [[-2.6, 2.2, 0.85, 0.1], [3.0, -1.4, 0.95, -0.09]].forEach(([dx, dz, s, tilt]) => {
    const p = palm(P.x + dx, P.z + dz, s, tilt);
    p.position.y = 1.3;
    world.add(p);
  });
  const c = crate(P.x + 1.4, 1.3, P.z + 2.8, 0.8, 0.4);
  world.add(c);
});

/* a rope bridge strung between the isles */
[[PROJ_ISLES[0], PROJ_ISLES[1]]].forEach(([a, b]) => {
  const from = new THREE.Vector3(a.x + a.r * 0.75, 1.6, a.z);
  const to   = new THREE.Vector3(b.x - b.r * 0.75, 1.6, b.z);
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = from.clone().lerp(to, t);
    p.y -= Math.sin(t * Math.PI) * 1.5;          // the sag
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.09, 1.5), M.wood);
    plank.position.copy(p);
    plank.rotation.z = Math.cos(t * Math.PI) * 0.22;
    world.add(plank);
  }
});

/* ═══════════════════════ 9. boats, birds, clouds ═════════════════════ */

/* ── sailboats that drift across the bay ── */
const boats = [];
function boat(scale = 1) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 1.1), M.wood);
  hull.position.y = 0.3; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 4), M.wood);
  bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4;
  bow.position.set(1.75, 0.3, 0); g.add(bow);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.16, 1.12), M.roofA);
  stripe.position.y = 0.52; g.add(stripe);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6), M.wood2);
  mast.position.y = 2.0; g.add(mast);
  const sailA = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.5, 3), M.sail);
  sailA.position.set(0.42, 2.0, 0); sailA.scale.z = 0.12; sailA.rotation.y = Math.PI / 2;
  g.add(sailA);
  const sailB = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.7, 3), M.cloth);
  sailB.position.set(-0.55, 1.6, 0); sailB.scale.z = 0.12; sailB.rotation.y = -Math.PI / 2;
  g.add(sailB);
  g.scale.setScalar(scale);
  return g;
}
[
  { c: [ 34,  22 ], r: 16, s: 0.10, y: 0.0,  sc: 1.0 },
  { c: [-34,  10 ], r: 20, s: -0.07, y: 0.0, sc: 0.85 },
  { c: [ 10, -60 ], r: 26, s: 0.055, y: 0.0, sc: 0.9 },
].forEach((b) => { const m = boat(b.sc); m.userData = b; boats.push(m); world.add(m); });

/* ── gulls: a V of two wings, looping overhead ── */
const birds = new THREE.Group();
for (let i = 0; i < 11; i++) {
  const b = new THREE.Group();
  [-1, 1].forEach((s) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.2), M.white);
    w.position.x = s * 0.45; w.rotation.z = s * 0.4;
    b.add(w);
  });
  b.userData = {
    r: 22 + Math.random() * 40,
    y: 20 + Math.random() * 16,
    a: Math.random() * Math.PI * 2,
    s: 0.06 + Math.random() * 0.07,
    cz: -10 - Math.random() * 40,
    f: 3 + Math.random() * 3,
  };
  birds.add(b);
}
scene.add(birds);

/* ── clouds: clusters of squashed spheres ── */
const clouds = new THREE.Group();
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xFFFBF4, roughness: 1, flatShading: true, transparent: true, opacity: 0.95 });
for (let i = 0; i < 16; i++) {
  const c = new THREE.Group();
  const n = 3 + (i % 3);
  for (let j = 0; j < n; j++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 + Math.random() * 2.6, 0), cloudMat);
    p.position.set(j * 3.2 - n * 1.4, Math.random() * 1.2, Math.random() * 2 - 1);
    p.scale.y = 0.58;
    c.add(p);
  }
  c.position.set((Math.random() - 0.5) * 300, 34 + Math.random() * 30, -160 + Math.random() * 260);
  c.userData.drift = 0.4 + Math.random() * 0.7;
  clouds.add(c);
}
scene.add(clouds);

/* ═══════════════════════ 10. night sky ═══════════════════════════════ */

/* a soft round dot, so stars aren't the default square sprites */
const dotTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d').createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  const ctx = c.getContext('2d');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

const starMat = new THREE.PointsMaterial({
  color: 0xFFF4D6, size: 2.6, map: dotTex, sizeAttenuation: true,
  transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
  blending: THREE.AdditiveBlending,
});
{
  const N = 1600, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    /* upper hemisphere only, so we never scatter stars into the sea */
    const u = Math.random(), v = Math.random() * 0.62 + 0.16;
    const th = u * Math.PI * 2, ph = Math.acos(1 - 2 * v);
    const r = 300;
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.9 + 20;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, starMat));
}

/* a few constellations that draw themselves in at the finale */
const constMat = new THREE.LineBasicMaterial({
  color: 0xFFE3B0, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
});
const constellations = new THREE.Group();
{
  /* rough shapes, laid out in the patch of sky the last stop looks at */
  const SHAPES = [
    { o: [-46, 78, -190], s: 12, pts: [[0,0],[1,0.9],[2.1,0.6],[2.6,1.8],[3.6,1.4],[1,0.9]] },
    { o: [  6, 96, -215], s: 13, pts: [[0,0],[0.9,1.2],[2.0,1.0],[2.4,2.3],[3.5,2.0],[3.9,0.8],[2.0,1.0]] },
    { o: [ 52, 74, -195], s: 11, pts: [[0,0],[1.2,0.4],[1.8,1.6],[3.0,1.9],[3.4,0.7],[1.8,1.6]] },
  ];
  SHAPES.forEach((S) => {
    const v = S.pts.map(([x, y]) => new THREE.Vector3(S.o[0] + x * S.s, S.o[1] + y * S.s, S.o[2]));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(v), constMat);
    constellations.add(line);
    /* a bright dot at each vertex */
    const dg = new THREE.BufferGeometry().setFromPoints(v);
    constellations.add(new THREE.Points(dg, new THREE.PointsMaterial({
      color: 0xFFF4D6, size: 5.5, map: dotTex, transparent: true, opacity: 0,
      depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
    })));
  });
}
scene.add(constellations);

/* the moon, hidden until dusk */
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(9, 24, 18),
  new THREE.MeshBasicMaterial({ color: 0xFFF4D6, transparent: true, opacity: 0, toneMapped: false, fog: false })
);
moon.position.set(-70, 110, -230);
scene.add(moon);

/* ═══════════════════════ 11. scroll → camera ═════════════════════════ */

const N = STOPS.length;
const scroller = document.getElementById('scroll');
scroller.style.height = `${N * 145}vh`;

const KEY_POS  = STOPS.map((s) => new THREE.Vector3(...s.pos));
const KEY_LOOK = STOPS.map((s) => new THREE.Vector3(...s.look));

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

let target = 0;      // raw scroll progress, 0..N-1
let cur = 0;         // eased progress the camera actually uses
const lookAt = KEY_LOOK[0].clone();

function readScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
  target = p * (N - 1);
}
/* read every frame rather than on the scroll event: smooth-scroll, momentum
   scrolling and programmatic jumps all land here without special-casing */
readScroll();

/* ── the overlay: which chapter, and which card inside it ── */
const chapterEls = {};
['ch-hero', 'ch-about', 'ch-skills', 'ch-work', 'ch-projects', 'ch-contact']
  .forEach((id) => { chapterEls[id] = document.getElementById(id); });

const workCard = document.getElementById('workCard');
const workKick = document.getElementById('workKicker');
const projCard = document.getElementById('projCard');

let shownStop = -1;
function applyStop(i) {
  if (i === shownStop) return;
  const prev = shownStop;
  shownStop = i;

  const stop = STOPS[i];
  const id = stop.chapter;

  /* if we're moving between two stops that share a chapter, swap the card
     contents in place rather than fading the whole chapter out and back */
  const sameChapter = prev >= 0 && STOPS[prev].chapter === id;

  const fill = () => {
    if (id === 'ch-work') { workCard.innerHTML = stop.card; workKick.textContent = stop.kicker; }
    if (id === 'ch-projects') { projCard.innerHTML = stop.card; }
  };

  if (sameChapter && stop.card) {
    const el = id === 'ch-work' ? workCard : projCard;
    el.classList.add('swap');
    setTimeout(() => { fill(); el.classList.remove('swap'); }, 170);
  } else {
    fill();
  }

  for (const key in chapterEls) chapterEls[key].classList.toggle('show', key === id);

  dots.forEach((d, k) => d.classList.toggle('on', k === i));
}

/* nothing is shown in the gaps between stops — that pause is the point */
function updateOverlay(f) {
  const near = Math.round(f);
  if (Math.abs(f - near) < 0.34) {
    applyStop(near);
  } else if (shownStop !== -1) {
    for (const key in chapterEls) chapterEls[key].classList.remove('show');
    shownStop = -1;
    dots.forEach((d) => d.classList.remove('on'));
  }
}

/* ── dot navigation ── */
const dotNav = document.getElementById('dots');
const dots = STOPS.map((_, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', DOT_LABELS[i]);
  b.dataset.label = DOT_LABELS[i];
  b.addEventListener('click', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: (i / (N - 1)) * max, behavior: 'smooth' });
  });
  dotNav.appendChild(b);
  return b;
});

/* ── the scroll hint retires once you've actually scrolled ── */
const hintEl = document.getElementById('hint');

/* ═══════════════════════ 12. time of day ═════════════════════════════ */

const tmpA = new THREE.Color(), tmpB = new THREE.Color();
function blend(key, f, out) {
  const i = Math.min(Math.floor(f), TOD.length - 2);
  const t = smooth(Math.min(Math.max(f - i, 0), 1));
  tmpA.set(TOD[i][key]); tmpB.set(TOD[i + 1][key]);
  out.copy(tmpA).lerp(tmpB, t);
  return out;
}
function blendNum(key, f) {
  const i = Math.min(Math.floor(f), TOD.length - 2);
  const t = smooth(Math.min(Math.max(f - i, 0), 1));
  return lerp(TOD[i][key], TOD[i + 1][key], t);
}

function applyTOD(f) {
  blend('top', f, skyU.top.value);
  blend('bot', f, skyU.bot.value);
  blend('sun', f, skyU.sunC.value);
  blend('deep', f, oceanU.deep.value);
  blend('shal', f, oceanU.shal.value);
  blend('fogC', f, oceanU.fogC.value);
  blend('fogC', f, scene.fog.color);
  blend('amb', f, hemi.color);
  blend('dir', f, sun.color);

  const night = blendNum('night', f);
  sun.intensity = blendNum('dirI', f);
  hemi.intensity = blendNum('ambI', f);
  rim.intensity = lerp(0.35, 0.12, night);
  skyU.glow.value = 1 - night;
  oceanU.spec.value = lerp(1, 0.25, night);
  renderer.toneMappingExposure = lerp(1.06, 0.92, night);

  /* the sun sinks as the day goes */
  skyU.sunP.value.set(0.42, lerp(0.22, -0.10, night), 0.88).normalize();
  sun.position.set(60, lerp(48, -6, night), 90);

  /* lights come on */
  const glow = smooth(Math.min(Math.max((night - 0.1) / 0.55, 0), 1));
  windows.forEach((m) => { m.emissiveIntensity = glow * 1.5; });
  beamMat.opacity = glow * 0.14;
  beaconLight.intensity = glow * 3.2;
  /* clouds thin out and then leave entirely — nothing should sit between
     the viewer and the constellations at the finale */
  cloudMat.opacity = lerp(0.95, 0, smooth(Math.min(night / 0.75, 1)));
  clouds.visible = cloudMat.opacity > 0.02;

  starMat.opacity = smooth(Math.min(Math.max((night - 0.4) / 0.5, 0), 1));
  moon.material.opacity = starMat.opacity;

  /* constellations draw in only at the very last stop */
  const draw = smooth(Math.min(Math.max((f - (N - 1.55)) / 1.2, 0), 1));
  constMat.opacity = draw * 0.85;
  constellations.children.forEach((c) => { if (c.material.isPointsMaterial) c.material.opacity = draw; });

  document.body.classList.toggle('night', night > 0.5);
}

/* ═══════════════════════ 13. the loop ════════════════════════════════ */

const clock = new THREE.Clock();
const tmpPos = new THREE.Vector3(), tmpLook = new THREE.Vector3();

function frame() {
  requestAnimationFrame(frame);
  const rawDt = Math.min(clock.getDelta(), 0.5);
  const dt = Math.min(rawDt, 0.05);          // animation uses a clamped step
  const t = clock.elapsedTime;

  /* ease the camera toward the scroll target so flicks feel like sailing */
  readScroll();
  if (scrollY > 60) hintEl.classList.add('gone');

  /* frame-rate independent easing: a background-throttled tab still converges
     at the same wall-clock rate a 60fps one does */
  cur += (target - cur) * (1 - Math.exp(-3.6 * rawDt));

  const i = Math.min(Math.floor(cur), N - 2);
  const local = smooth(Math.min(Math.max(cur - i, 0), 1));
  tmpPos.copy(KEY_POS[i]).lerp(KEY_POS[i + 1], local);
  tmpLook.copy(KEY_LOOK[i]).lerp(KEY_LOOK[i + 1], local);

  /* a slow idle drift, as if the camera were on a boat */
  tmpPos.y += Math.sin(t * 0.42) * 0.42;
  tmpPos.x += Math.sin(t * 0.27) * 0.30;

  camera.position.copy(tmpPos);
  lookAt.lerp(tmpLook, 1 - Math.exp(-5.0 * rawDt));
  camera.lookAt(lookAt);

  oceanU.time.value = t;
  oceanU.sunP.value.copy(sun.position).normalize();

  applyTOD(cur);
  updateOverlay(cur);

  /* boats circle slowly; they bob with the swell */
  boats.forEach((b) => {
    const d = b.userData;
    d.a = (d.a || 0) + d.s * dt;
    b.position.set(d.c[0] + Math.cos(d.a) * d.r, 0, d.c[1] + Math.sin(d.a) * d.r);
    b.position.y = Math.sin(t * 1.2 + d.c[0]) * 0.22;
    b.rotation.y = -d.a + Math.PI / 2;
    b.rotation.z = Math.sin(t * 1.0 + d.c[0]) * 0.05;
  });

  /* gulls */
  birds.children.forEach((b) => {
    const d = b.userData;
    d.a += d.s * dt;
    b.position.set(Math.cos(d.a) * d.r, d.y + Math.sin(t * 0.7 + d.a) * 1.4, d.cz + Math.sin(d.a) * d.r);
    b.rotation.y = -d.a;
    b.rotation.z = Math.sin(t * d.f) * 0.5;
  });

  clouds.children.forEach((c) => {
    c.position.x += c.userData.drift * dt;
    if (c.position.x > 170) c.position.x = -170;
  });

  beamPivot.rotation.y += dt * 0.55;

  renderer.render(scene, camera);
}

/* ═══════════════════════ 14. boot ════════════════════════════════════ */

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
}, { passive: true });

/* start at the top even on a reload, so the story opens where it should */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

applyTOD(0);
renderer.compile(scene, camera);
frame();

/* reveal on the first painted frame — but never let a throttled rAF strand the
   loader on screen, so a timer races it */
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  document.body.classList.add('ready');
  applyStop(0);
  const l = document.getElementById('loader');
  if (!l) return;
  l.classList.add('reveal');
  setTimeout(() => l.remove(), 900);
}
requestAnimationFrame(reveal);
setTimeout(reveal, 2500);
