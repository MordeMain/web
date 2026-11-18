'use strict';

// ============================================================
//  CONTENIDO EDITABLE
// ============================================================

const IMG = (name) => '../img/grid/' + name + '.jpg';

const CATEGORIES = [
  { name: 'Renders', text: 'Imágenes fotorrealistas de exteriores e interiores, desde la vista aérea hasta el detalle de un acabado.', cover: 'fachada-esquina',
    gallery: ['fachada-completa', 'aereo-01', 'fachada-frontal-01', 'piscina-01', 'urbanizacion-01', 'aereo-03', 'interior-02', 'terraza-01', 'detalle-01', 'acceso-01'] },
  { name: 'Video', text: 'Piezas audiovisuales con recorrido de cámara por el exterior y el interior del proyecto.', cover: 'aereo-02',
    video: '../img/Background.mp4', kind: 'videos' },
  { name: 'Tours', text: 'Renders 360° navegables, recorridos en Unreal Engine y tours digitales para recorrer el espacio en todas direcciones.', cover: 'interior-01',
    kind: 'tour' },
  { name: 'Planos', text: 'Plantas, secciones y axonometrías renderizadas: CAD, ambientado, fugado y fugado realista.', cover: 'conceptual-01',
    kind: 'section' },
  { name: 'Marketing', text: 'Campañas de comunicación y venta construidas a partir de las imágenes del proyecto.', cover: 'evocativa-01',
    gallery: ['evocativa-01', 'evocativa-03', 'conceptual-01', 'fachada-frontal-03', 'piscina-03', 'urbanizacion-03'] },
  { name: 'Morph XS', text: 'Maquetas físicas, impresión 3D y piezas de material: el proyecto a escala, en tus manos.', cover: 'maqueta-02',
    gallery: ['maqueta-01', 'maqueta-02', 'detalle-02', 'detalle-03', 'detalle-04'] }
];

// Textos impresos en las capas de la trama, en el orden en que aparecen al hacer scroll (uno cada vez).
// layer: capa donde está impreso (1 = justo bajo la primera, 3 = fondo).
// at: punto de la pantalla (0–1) donde lo enmarcan sus aberturas; se mueve un poco si choca con otra abertura.
const REVEALS = [
  // cada burbuja va abajo y en el lado contrario de la pieza impresa que la acompaña (PAPER_ITEMS, mismo orden)
  { layer: 1, at: [0.68, 0.62], label: 'Quiénes somos', text: 'Siete arquitectos y tres expertos en visualización.' },
  { layer: 2, at: [0.32, 0.62], label: 'Experiencia', text: 'Miles de horas de diseño y visualización.' },
  { layer: 1, at: [0.68, 0.62], label: 'Modelado', text: 'Archicad, Rhino, 3ds Max, Blender y Unreal Engine.' },
  { layer: 2, at: [0.32, 0.62], label: 'Inteligencia artificial', text: 'ComfyUI, ChatGPT, Google Flow y Kling AI.' },
  // la trama termina aquí (más corta): el cierre va centrado y enseguida empiezan las nubes
  { layer: 2, at: [0.50, 0.50], label: 'with morph', text: 'DREAM BIG', big: true, pre: 0.3 }   // pre: papel limpio antes (ningún dibujo alrededor de DREAM BIG)
];

// Lo que va impreso en el papel frontal de la trama, en los huecos blancos entre aberturas (se mueve con él):
// frases cortas y dibujos de concepto, solos o con su frase debajo. Se colocan en este orden al hacer scroll.
// Dibujos de img/sketches/: box = zona del dibujo en la imagen [x0, y0, x1, y1] (px), iw = ancho de la imagen,
// w = ancho en pantalla (vmin). Son trazos de lápiz muy claros sobre fondo transparente: se imprimen en grafito.
const SKETCHES = {
  conjunto: { src: 'dibujo-1.webp', iw: 2000, box: [276, 220, 1524, 534], w: 46 },
  calle:    { src: 'dibujo-2.webp', iw: 2000, box: [302, 268, 1606, 610], w: 46 },
  plaza:    { src: 'dibujo-3.png',  iw: 1986, box: [252, 312, 1604, 658], w: 46 }
};
// Una pieza por cada texto de REVEALS (mismo orden): arriba y en el lado contrario a su burbuja.
// label + p: título y párrafo; s: dibujo (debajo del párrafo); q: frase sin título bajo el dibujo.
// Todos los textos con el mismo estilo de párrafo.
const PAPER_ITEMS = [
  { label: 'Nuestro equipo', p: 'Entendemos cada proyecto desde dentro: pensamos como arquitectos y lo representamos con rigor técnico y sensibilidad espacial.',
    s: 'plaza', q: 'Render, video, tours, planos, marketing y maquetas en un mismo estudio.' },
  { label: 'Proceso', p: 'Acompañamos cada proyecto desde las primeras ideas hasta las imágenes, videos y maquetas que lo presentan.' },
  { label: 'Representación', p: 'Cada imagen, recorrido y maqueta se construye con la precisión de un plano y la intención de un proyecto.',
    s: 'conjunto', q: 'Del concepto a la realidad.' },
  null,   // junto a la 4.ª burbuja no va ninguna pieza
  { label: 'Postproducción y video', p: 'Photoshop, Illustrator e InDesign para la postproducción; Premiere Pro y DaVinci Resolve para el montaje.',
    s: 'calle', q: 'La tecnología acelera; el criterio arquitectónico decide.' }
];

// ============================================================

(() => {
  // La página siempre empieza arriba: la intro depende de ello.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (f) => f * f * (3 - 2 * f);
  const easeOut = (f) => 1 - Math.pow(1 - f, 3);
  const easeIn = (f) => f * f * f;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snap = location.search.includes('snap');
  // «Idea 1»: la torre en espiral (escena 3D) con el barrido desde la derecha. Sin ella, el diseño base:
  // vídeo de la torre bajando como un ascensor y barrido desde abajo.
  const IDEA1 = document.documentElement.classList.contains('idea1');
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const sectionProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1);
  };
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  const vmin = () => Math.min(window.innerWidth, window.innerHeight);

  // ==========================================================
  //  01 · INTRO: cita → célula → mitosis orgánica → logo
  // ==========================================================
  const intro = (() => {
    const section = document.getElementById('intro');
    const canvas = document.getElementById('cells');
    const ctx = canvas.getContext('2d');
    const quote = document.getElementById('introQuote');
    const hint = document.getElementById('introHint');
    const gooBlur = document.getElementById('gooBlur');

    const R_CAP = 11.2;          // radio máximo en reposo: las células no se tocan (paso de la retícula = 24)
    const SPLIT = 0.62;          // duración de una división (s)

    const raw = window.MORPH_DOTS.split(';').map((s) => s.split(',').map(Number));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    raw.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const designW = maxX - minX + 30;
    const leaves = raw.map(([x, y, r]) => ({ x: x - cx, y: y - cy, r: Math.min(r, R_CAP), px: x - cx, py: y - cy, vx: 0, vy: 0, s: 1, ph: rand() * 6.28 }));

    const build = (list) => {
      if (list.length === 1) return list[0];
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      list.forEach((l) => { x0 = Math.min(x0, l.x); x1 = Math.max(x1, l.x); y0 = Math.min(y0, l.y); y1 = Math.max(y1, l.y); });
      const key = (x1 - x0) >= (y1 - y0) ? 'x' : 'y';
      const sorted = list.slice().sort((a, b) => a[key] - b[key]);
      const mid = sorted.length >> 1;
      const kids = [build(sorted.slice(0, mid)), build(sorted.slice(mid))];
      let w = 0, sx = 0, sy = 0;
      list.forEach((l) => { const ww = l.r * l.r; w += ww; sx += l.x * ww; sy += l.y * ww; });
      return { x: sx / w, y: sy / w, r: Math.sqrt(w) * Math.pow(list.length, -0.19), kids: kids, ph: rand() * 6.28 };
    };
    const root = build(leaves);
    root.x = 0; root.y = 0;

    // vecinas de cada célula (para que se empujen entre ellas)
    const SWELL = 0.95, SWELL_R = 40;
    const pairs = [];
    for (let i = 0; i < leaves.length; i++) {
      leaves[i].cr = leaves[i].r;
      for (let j = i + 1; j < leaves.length; j++) {
        if (Math.hypot(leaves[i].x - leaves[j].x, leaves[i].y - leaves[j].y) < 64) pairs.push(i, j);
      }
    }

    // Línea de tiempo: cita (0.2–4.3 s) → "Imaginary" se dibuja con líneas (4.4–5.3 s); cada línea se desliza
    // en su fila y cambia de largo hasta formar "Reality" (5.6–7.4 s)
    // → "Reality" colapsa como un agujero negro en la primera célula (7.8–9 s) → mitosis
    const T_DRAW = 4.4, T_BREAK = 5.6, T_BUILT = 7.4, T_COLLAPSE = 7.8, T_ROOT = 8.6, T_SPLIT1 = T_ROOT + 0.25;   // T_SPLIT1: primera división (enseguida)
    let segs = [], step = 4, fontPx = 120, iDot = { x: 0, y: 0, r: 4, maxD: 1 };
    // descompone una palabra en las líneas horizontales (tramado) que forman sus letras
    const hatch = (word, dx = 0) => {
      if (W < 10 || fontPx < 1) return [];   // pestaña oculta o sin tamaño todavía
      const cw = Math.ceil(W), ch = Math.ceil(fontPx * 1.6);
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const g = cv.getContext('2d');
      g.font = '400 ' + fontPx + 'px Saans, "Helvetica Neue", Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000';
      g.fillText(word, cw / 2 + dx, ch / 2);
      const data = g.getImageData(0, 0, cw, ch).data, out = [];
      for (let y = step / 2; y < ch; y += step) {
        let x0 = -1;
        const row = Math.floor(y) * cw;
        for (let x = 0; x <= cw; x++) {
          const on = x < cw && data[(row + x) * 4 + 3] > 110;
          if (on && x0 < 0) x0 = x;
          if (!on && x0 >= 0) { if (x - x0 > 1) out.push({ x: (x0 + x) / 2, y: y - ch / 2 + H / 2, len: x - x0 }); x0 = -1; }
        }
      }
      return out.sort((a, b) => a.x - b.x || a.y - b.y);
    };
    const buildSegs = () => {
      fontPx = clamp(W * 0.1, 56, 150);
      step = Math.max(3, Math.round(fontPx / 34));
      // "Reality" va desplazada a la izquierda para que el punto de su "i" quede en el centro de la pantalla:
      // al convertirse en círculo no tiene que moverse y la mitosis empieza enseguida
      const mc = document.createElement('canvas').getContext('2d');
      mc.font = '400 ' + fontPx + 'px Saans, "Helvetica Neue", Arial, sans-serif';
      const iw = mc.measureText('i').width;
      const ix0 = W / 2 - mc.measureText('Reality').width / 2 + mc.measureText('Real').width + iw / 2;
      const dxR = Math.round(W / 2 - ix0), ix = ix0 + dxR;
      const A = hatch('Imaginary'), B = hatch('Reality', dxR);
      if (!A.length || !B.length) { segs = []; return; }
      // punto de la "i": líneas de "Reality" en la columna de la i y por encima de la altura de las minúsculas
      const dotSegs = B.filter((s) => Math.abs(s.x - ix) < iw * 0.7 && s.y < H / 2 - fontPx * 0.22);
      dotSegs.forEach((s) => { s.isDot = true; });
      let dy = dotSegs.length ? dotSegs.reduce((acc, s) => acc + s.y, 0) / dotSegs.length : H / 2 - fontPx * 0.33;
      // y en vertical: las dos palabras bajan lo justo (en filas enteras del tramado) para que el punto quede a media altura
      const vOff = Math.round((H / 2 - dy) / step) * step;
      A.forEach((q) => { q.y += vOff; }); B.forEach((q) => { q.y += vOff; });
      dy += vOff;
      iDot = { x: ix, y: dy, r: Math.max(fontPx * 0.045, dotSegs.length * step / 2), maxD: 0 };
      B.forEach((s) => { iDot.maxD = Math.max(iDot.maxD, Math.hypot(s.x - ix, s.y - dy)); });
      // Las dos palabras tienen las mismas filas de tramado. En cada fila, las líneas de "Imaginary" solo se
      // deslizan a izquierda o derecha y se alargan o acortan hasta las de "Reality", en orden (sin cruzarse):
      // si sobran, varias se juntan en una; si faltan, una se divide. Así la cola de la "g" acaba como la de la "y".
      const pt = (q) => ({ x: q.x, y: q.y, len: q.len, ang: 0, al: 1 });
      const rows = new Map();
      const row = (q) => Math.round(q.y / step);
      A.forEach((q) => { const r = row(q); if (!rows.has(r)) rows.set(r, [[], []]); rows.get(r)[0].push(q); });
      B.forEach((q) => { const r = row(q); if (!rows.has(r)) rows.set(r, [[], []]); rows.get(r)[1].push(q); });
      segs = [];
      rows.forEach(([ra, rb]) => {
        ra.sort((p, q) => p.x - q.x); rb.sort((p, q) => p.x - q.x);
        const lagOf = (q) => (q.x / W) * 0.25;
        if (!rb.length) { ra.forEach((q) => segs.push({ a: pt(q), b: Object.assign(pt(q), { len: 0, al: 0 }), lag: lagOf(q) })); return; }
        if (!ra.length) { rb.forEach((q) => segs.push({ a: Object.assign(pt(q), { len: 0, al: 0 }), b: pt(q), isDot: !!q.isDot, lag: lagOf(q) })); return; }
        // emparejamiento monótono (como DTW) que minimiza el desplazamiento: toda línea de origen y de destino se usa
        const n = ra.length, m = rb.length;
        const cost = (i, j) => Math.abs(ra[i].x - rb[j].x) + Math.abs(ra[i].len - rb[j].len) * 0.5;
        const D = Array.from({ length: n }, () => new Float64Array(m).fill(Infinity));
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
          const best = i === 0 && j === 0 ? 0 : Math.min(i > 0 ? D[i - 1][j] : Infinity, j > 0 ? D[i][j - 1] : Infinity, i > 0 && j > 0 ? D[i - 1][j - 1] : Infinity);
          D[i][j] = best + cost(i, j);
        }
        let i = n - 1, j = m - 1;
        for (;;) {
          segs.push({ a: pt(ra[i]), b: pt(rb[j]), isDot: !!rb[j].isDot, lag: lagOf(ra[i]) });
          if (i === 0 && j === 0) break;
          const di = i > 0 && j > 0 ? D[i - 1][j - 1] : Infinity, up = i > 0 ? D[i - 1][j] : Infinity, lf = j > 0 ? D[i][j - 1] : Infinity;
          if (di <= up && di <= lf) { i--; j--; } else if (up <= lf) i--; else j--;
        }
      });
    };
    const mix = (p, q, f) => ({ x: lerp(p.x, q.x, f), y: lerp(p.y, q.y, f), len: lerp(p.len, q.len, f), ang: lerp(p.ang, q.ang, f), al: lerp(p.al, q.al, f) });
    const inOut = (f) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2);
    const drawLines = (t) => {
      if (t < T_DRAW || t >= T_ROOT || !segs.length) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = '#14181A';
      ctx.fillStyle = '#14181A';
      const lw = Math.max(1.5, step * 0.7);
      ctx.lineWidth = lw;
      const cx = W / 2, cy = H / 2;
      // final: el punto de la "i" (ya en el centro) crece hasta ser la primera célula y absorbe las demás letras
      const a1 = inOut(clamp((t - T_COLLAPSE) / (T_ROOT - T_COLLAPSE), 0, 1));
      const absorbing = t >= T_COLLAPSE;
      const rootR = root.r * k;   // mismo tamaño que la primera célula: no hay salto al empezar la mitosis
      const bx = lerp(iDot.x, cx, a1), by = lerp(iDot.y, cy, a1), br = lerp(iDot.r, rootR, a1);   // el resto (<1 fila) se ajusta mientras crece
      const front = (iDot.maxD + fontPx * 0.6) * a1;
      for (const s of segs) {
        let st;
        if (t < T_BREAK) {
          // "Imaginary" se dibuja de izquierda a derecha, como un trazo a lápiz
          const g = clamp((t - T_DRAW - (s.a.x / W) * 0.45) / 0.35, 0, 1);
          st = { x: s.a.x - s.a.len * (1 - g) / 2, y: s.a.y, len: s.a.len * g, ang: 0, al: s.a.al };
        } else {
          // cada línea se desliza en su fila y cambia de largo hasta su sitio en "Reality"
          st = mix(s.a, s.b, inOut(clamp((t - T_BREAK - s.lag) / (T_BUILT - T_BREAK - 0.3), 0, 1)));
        }
        if (absorbing) {
          if (s.isDot) continue;                       // el punto ya es el círculo
          const d = Math.hypot(st.x - iDot.x, st.y - iDot.y);
          const ab = clamp((front - d) / (fontPx * 0.6), 0, 1);
          if (ab >= 1) continue;
          const e = easeIn(ab);
          st = { x: lerp(st.x, bx, e), y: lerp(st.y, by, e), len: st.len * (1 - ab), ang: st.ang, al: st.al };
        }
        if (st.al <= 0.01 || st.len < 0.3) continue;
        const hx = Math.cos(st.ang) * st.len / 2, hy = Math.sin(st.ang) * st.len / 2;
        ctx.globalAlpha = st.al;
        ctx.beginPath(); ctx.moveTo(st.x - hx, st.y - hy); ctx.lineTo(st.x + hx, st.y + hy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (absorbing) { ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.2832); ctx.fill(); }
    };
    let fontsReady = false;
    (document.fonts && document.fonts.load ? document.fonts.load('400 100px Saans') : Promise.resolve())
      .then(() => { fontsReady = true; buildSegs(); }, () => { fontsReady = true; buildSegs(); });
    let doneAt = 0;
    const splits = [];
    const schedule = (node, ts, depth) => {
      node.ts = ts;
      if (!node.kids) { doneAt = Math.max(doneAt, ts); return; }
      splits.push({ ts, depth });
      node.kids.forEach((kid) => {
        kid.parent = node;
        kid.born = ts;
        const gen = SPLIT * (0.72 + rand() * 0.7);
        schedule(kid, kid.kids ? ts + gen : ts + SPLIT, depth + 1);
      });
    };
    root.born = T_ROOT;
    schedule(root, T_SPLIT1, 0);
    splits.sort((a, b) => a.ts - b.ts);
    let nextSplit = 0, lastPop = -1;
    const T_DONE = doneAt + 0.2;

    let W = 0, H = 0, dpr = 1, k = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      k = Math.min(W * 0.78, 1120) / designW;
      if (fontsReady) buildSegs();
    };
    resize();
    window.addEventListener('resize', resize);

    // Igual que el logo anterior: el ratón empuja las células y vuelven a su sitio con un muelle.
    let offsetY = 0;
    let mouse = { x: -1e4, y: -1e4 };
    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: (e.clientX - r.left - W / 2) / k, y: (e.clientY - r.top - H / 2 - offsetY) / k };
    });
    document.addEventListener('pointerleave', () => { mouse = { x: -1e4, y: -1e4 }; });

    const spring = (q) => (q >= 1 ? 1 : 1 - Math.exp(-5 * q) * Math.cos(7.5 * q));
    const start = performance.now();
    const dot = (x, y, r) => { if (r < 0.15) return; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); };

    let spread = 1;   // el grupo nace apretado y se abre hasta formar el logo
    const drawNode = (node, ox, oy, orr, t, wob) => {
      const q = node.parent ? clamp((t - node.born) / SPLIT, 0, 1) : 1;
      const e = spring(q);
      let x = lerp(ox, node.x, e), y = lerp(oy, node.y, e);
      let r = lerp(orr * 0.74, node.r, easeOut(q));
      if (node.kids && t >= node.ts) {
        node.kids.forEach((kid) => drawNode(kid, x, y, r, t, wob));
        return;
      }
      r *= 1 + wob * 0.07 * Math.sin(t * 5.3 + node.ph);
      x += wob * 1.6 * Math.sin(t * 2.1 + node.ph * 1.7);
      y += wob * 1.6 * Math.cos(t * 1.8 + node.ph);
      dot(x * spread, y * spread, r);
    };

    let sw1 = false, sw2 = false;
    const frame = (now, sp) => {
      const t = reduced ? T_DONE + 5 : (snap && window.__introT != null ? window.__introT : (now - start) / 1000);   // __introT: solo pruebas

      quote.classList.toggle('is-in', t > 0.2 && t < 3.4);
      quote.classList.toggle('is-out', t >= 3.4);
      // swoosh suave: uno largo cuando las líneas de «Imaginary» se deslizan hasta «Reality»,
      // y otro más grave y corto cuando «Reality» se recoge en la primera célula (solo si se ve en su momento)
      if (!sw1 && t >= T_BREAK) { sw1 = true; if (t - T_BREAK < 0.3) audio.swoosh(T_BUILT - T_BREAK + 0.2, 300, 1400, 480, 0.07, 0.35); }
      if (!sw2 && t >= T_COLLAPSE) { sw2 = true; if (t - T_COLLAPSE < 0.3) audio.swoosh(1.2, 900, 420, 160, 0.045, -0.2); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (t < T_ROOT) { canvas.style.filter = 'none'; drawLines(t); return; }
      // sonido de burbuja en cada división (limitado para que no se amontonen)
      while (nextSplit < splits.length && splits[nextSplit].ts <= t) {
        if (t - lastPop > 0.045 && t - splits[nextSplit].ts < 0.2) { audio.pop(splits[nextSplit].depth); lastPop = t; }
        nextSplit++;
      }
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * W / 2, dpr * (H / 2 + offsetY));
      ctx.fillStyle = '#14181A';
      ctx.beginPath();

      if (t < T_DONE) {
        const life = clamp((t - T_SPLIT1) / (T_DONE - T_SPLIT1), 0, 1);
        const blur = 10 * Math.pow(1 - life, 1.4) * Math.min(1, k * 1.4);
        if (blur > 1.4) { canvas.style.filter = 'url(#goo)'; gooBlur.setAttribute('stdDeviation', blur.toFixed(2)); }
        else canvas.style.filter = 'none';
        const pop = 1;   // la célula ya existe: es el punto de la i
        const wob = (1 - clamp((t - (T_DONE - 1.2)) / 1.2, 0, 1)) * ease(clamp((t - T_ROOT) / 0.9, 0, 1));   // la respiración entra poco a poco: el punto de la i no salta
        spread = lerp(0.16, 1, ease(Math.pow(life, 0.85)));
        drawNode(root, 0, 0, root.r * pop / 0.74, t, wob);
      } else {
        canvas.style.filter = 'none';
        // Bajo el ratón las células se hinchan y empujan a sus vecinas, que vuelven a su sitio con un muelle.
        const s2 = 2 * SWELL_R * SWELL_R;
        for (let i = 0; i < leaves.length; i++) {
          const l = leaves[i];
          const dx = l.x - mouse.x, dy = l.y - mouse.y;
          l.s += (1 + SWELL * Math.exp(-(dx * dx + dy * dy) / s2) - l.s) * 0.16;
          l.cr = l.r * l.s;
        }
        for (let it = 0; it < 3; it++) {
          for (let q = 0; q < pairs.length; q += 2) {
            const a = leaves[pairs[q]], b = leaves[pairs[q + 1]];
            const dx = b.px - a.px, dy = b.py - a.py, d = Math.hypot(dx, dy) || 0.01;
            const min = a.cr + b.cr + 2;
            if (d < min) {
              const push = (min - d) * 0.5, ux = dx / d, uy = dy / d;
              const wa = b.cr / (a.cr + b.cr), wb = 1 - wa;   // la célula grande se mueve menos
              a.vx -= ux * push * wa * 0.5; a.vy -= uy * push * wa * 0.5;
              b.vx += ux * push * wb * 0.5; b.vy += uy * push * wb * 0.5;
              a.px -= ux * push * wa * 0.5; a.py -= uy * push * wa * 0.5;
              b.px += ux * push * wb * 0.5; b.py += uy * push * wb * 0.5;
            }
          }
        }
        for (let i = 0; i < leaves.length; i++) {
          const l = leaves[i];
          l.vx += (l.x - l.px) * 0.05; l.vy += (l.y - l.py) * 0.05;
          l.vx *= 0.8; l.vy *= 0.8;
          l.px += l.vx; l.py += l.vy;
          dot(l.px, l.py, l.cr);
        }
      }
      ctx.fill();

      const hintIn = clamp((t - (T_DONE + 2)) / 0.8, 0, 1);
      hint.style.opacity = String(hintIn * clamp(1 - sp * 6, 0, 1));
    };

    // el logo ya terminó de formarse (la cabecera espera a este momento)
    const done = () => reduced || (snap && window.__introT != null ? window.__introT : (performance.now() - start) / 1000) >= T_DONE;
    return { section, frame, done };
  })();

  // ==========================================================
  //  02 · TRAMA: capas de papel con aberturas fijas que se deslizan
  //  Cada texto tiene su propio tramo de scroll: solo se ve uno a la vez y
  //  solo lo descubren sus aberturas (las demás nunca lo enseñan).
  // ==========================================================
  const capas = (() => {
    const section = document.getElementById('capas');
    const stage = document.getElementById('capasStage');
    const cloudBox = document.getElementById('capasClouds');
    const FILLS = ['#FFFFFF', '#F7F8F8', '#EFF1F1', '#E6E8E8'];
    const EDGES = ['#D5D9DB', '#CFD3D5', '#C9CDCF'];             // canto de cada capa (su grosor)
    const SPEED = [[-15, -82], [12, -42], [-8, -18], [0, 0]];    // vmin por pantalla de scroll (la frontal es la más rápida)
    const SIZES = [[22, 22], [22, 22], [22, 22]];                // un solo tamaño de abertura en todas las capas (radio, vmin)
    const START_HOLES = 4;                                       // aberturas visibles en la primera fila (transición desde el logo)
    const GAP = 2.4;                                             // papel entre aberturas (vmin)
    const THICK = 4;                                             // grosor del papel (px)
    // pantallas: antes del 1er texto (la trama empieza detrás del logo), solape entre un texto y el siguiente
    // (negativo: el siguiente empieza a aparecer mientras el anterior se oculta), y final (nubes)
    const START = 1.3, BETWEEN = -0.25, TAIL = 0.5;

    // Cada capa es un "papel" largo dividido en franjas del alto de la pantalla; solo se muestran las cercanas
    // y la capa entera se desliza con transform (rápido). Debajo de cada franja va su canto (grosor).
    const layers = FILLS.map((fill, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'layer';
      if (i < 3) wrap.style.filter = 'drop-shadow(0 1.2vmin 1.6vmin rgba(20,24,26,.22))';
      const box = document.createElement('div');
      box.className = 'layer-texts';
      wrap.appendChild(box);
      return { wrap, box, fill, tiles: [], texts: [] };
    });
    stage.style.background = FILLS[3];
    layers.slice().reverse().forEach((l) => stage.insertBefore(l.wrap, cloudBox));

    const texts = REVEALS.map((rv) => {
      const el = document.createElement('div');
      el.className = 'layer-text' + (rv.big ? ' is-big' : '');
      el.innerHTML = (rv.label ? '<span class="eyebrow"></span>' : '') + '<span class="lt-text"></span>' + (rv.sub ? '<span class="lt-sub"></span>' : '');
      if (rv.label) el.querySelector('.eyebrow').textContent = rv.label;
      el.querySelector('.lt-text').textContent = rv.text;
      if (rv.sub) el.querySelector('.lt-sub').textContent = rv.sub;
      layers[rv.layer].box.appendChild(el);
      const tx = { el, rv, k: rv.layer, forced: [] };
      layers[rv.layer].texts.push(tx);
      return tx;
    });

    // Banco de nubes que sube desde abajo al final de la trama: la misma imagen de nubes, girada (borde
    // esponjoso arriba) y debajo un panel blanco. Cubre la trama entera por sí solo: ningún borde recto.
    const bank = document.createElement('div');
    bank.className = 'cloud-bank';
    bank.innerHTML = '<div class="cb-band"><img src="../img/clouds.webp" alt="" decoding="async"></div><div class="cb-white"></div>';
    cloudBox.appendChild(bank);
    const bankBand = bank.querySelector('.cb-band'), bankImg = bank.querySelector('img'), bankWhite = bank.querySelector('.cb-white');
    let bankSize = '', bandH = 0;
    const clouds = (cover) => {
      const W = window.innerWidth, H = window.innerHeight;
      if (bankSize !== W + 'x' + H) {
        bankSize = W + 'x' + H;
        const w = Math.max(W, H * 1.2), h = w * 2000 / 1414;
        bandH = 0.42 * h;
        bank.style.width = w.toFixed(0) + 'px';
        bankBand.style.height = bandH.toFixed(0) + 'px';
        bankImg.style.width = w.toFixed(0) + 'px';
        bankImg.style.top = (-0.30 * h).toFixed(0) + 'px';
        bankWhite.style.height = (H + 4) + 'px';
        bank.style.left = ((W - w) / 2).toFixed(0) + 'px';
      }
      const y = lerp(H, -bandH, cover);
      bank.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      bank.style.visibility = cover > 0 ? 'visible' : 'hidden';
    };
    let shift = [0, 0], total = 6, quoteEls = [], quoteRects = [];
    const off = (j, s) => { const m = vmin() / 100; return [SPEED[j][0] * m * s, SPEED[j][1] * m * s]; };

    const layout = () => {
      const W = window.innerWidth, H = window.innerHeight, m = vmin() / 100;
      seed = 11;
      const halfW = (rv) => (rv.big ? 17 : 13) * m;
      const radius = (rv) => Math.hypot(halfW(rv), (rv.big ? (rv.sub ? 9 : 7) : 6.5) * m);
      const holeR = (tx, j) => tx.R * 1.15 + (tx.k - 1 - j) * 3 * m;
      const rel = (a, b) => Math.hypot(SPEED[a][0] - SPEED[b][0], SPEED[a][1] - SPEED[b][1]) * m;

      // tramo de cada texto: mientras TODAS sus aberturas lo tocan
      let s = START;
      texts.forEach((tx, i) => {
        tx.R = radius(tx.rv);
        tx.hw = Infinity;
        for (let j = 0; j < tx.k; j++) tx.hw = Math.min(tx.hw, (holeR(tx, j) + tx.R) / rel(tx.k, j));
        if (i > 0) s += texts[i - 1].hw + BETWEEN + tx.hw + (tx.rv.pre || 0);
        else s += tx.hw;
        tx.s = s;
      });
      total = s + texts[texts.length - 1].hw + TAIL;
      section.style.height = ((total + 1) * 100).toFixed(1) + 'vh';

      // tamaño del papel: cubre la pantalla durante todo el recorrido de todas las capas
      let minX = 0, maxX = 0, minY = 0, maxY = 0;
      SPEED.forEach((_, j) => [-1.2, total + 0.2].forEach((ss) => {
        const [ox, oy] = off(j, ss);
        minX = Math.min(minX, ox); maxX = Math.max(maxX, ox); minY = Math.min(minY, oy); maxY = Math.max(maxY, oy);
      }));
      const marg = 0.3 * Math.max(W, H);
      shift = [maxX + marg, maxY + marg];
      const PW = W + (maxX - minX) + 2 * marg, PH = H + (maxY - minY) + 2 * marg;
      const local = (j, at, ss) => { const [ox, oy] = off(j, ss); return [at[0] * W - ox + shift[0], at[1] * H - oy + shift[1]]; };

      const allHoles = [[], [], []];
      const clear = (j, x, y, r) => allHoles[j].every((h) => Math.hypot(h.x - x, h.y - y) >= h.r + r + GAP * m);

      // aberturas de cada texto: lo contienen entero y son más grandes cuanto más arriba
      texts.forEach((tx) => {
        const tries = [{ at: tx.rv.at, cost: 0 }];
        for (let ax = 0.26; ax <= 0.741; ax += 0.06) for (let ay = 0.3; ay <= 0.701; ay += 0.06) {
          tries.push({ at: [ax, ay], cost: Math.hypot(ax - tx.rv.at[0], ay - tx.rv.at[1]) });
        }
        tries.sort((a, b) => a.cost - b.cost);
        let pick = tries[0].at;
        for (const { at } of tries) {
          let ok = true;
          for (let j = 0; j < tx.k && ok; j++) { const [x, y] = local(j, at, tx.s); ok = clear(j, x, y, holeR(tx, j)); }
          if (ok) { pick = at; break; }
        }
        tx.forced = [];
        for (let j = 0; j < tx.k; j++) {
          const [x, y] = local(j, pick, tx.s);
          const h = { j, x, y, r: holeR(tx, j) };
          allHoles[j].push(h);
          tx.forced.push(h);
        }
        tx.c = local(tx.k, pick, tx.s);
        tx.el.style.left = tx.c[0] + 'px';
        tx.el.style.top = tx.c[1] + 'px';
        tx.el.style.width = (halfW(tx.rv) * 2).toFixed(0) + 'px';
      });

      // largo real de la sección: hasta que desaparece de verdad el último texto (no una estimación)
      const seen = (tx, ss) => tx.forced.every((h) => {
        const [kx, ky] = off(tx.k, ss), [hx, hy] = off(h.j, ss);
        return Math.hypot((tx.c[0] + kx) - (h.x + hx), (tx.c[1] + ky) - (h.y + hy)) < h.r + tx.R;
      });
      let lastEnd = 0;
      texts.forEach((tx) => { let e = tx.s; while (e < tx.s + 4 && seen(tx, e)) e += 0.02; lastEnd = Math.max(lastEnd, e); });
      total = lastEnd + TAIL;
      section.style.height = ((total + 1) * 100).toFixed(1) + 'vh';

      // piezas del papel frontal (frases y dibujos): una cada ~0,7 pantallas, alternando lados, en zonas libres
      quoteEls.forEach((q) => q.remove());
      quoteEls = [];
      quoteRects = [];
      const rectClear = (x, y, w, h) => allHoles[0].every((hh) => {
        const nx = clamp(hh.x, x - w / 2, x + w / 2), ny = clamp(hh.y, y - h / 2, y + h / 2);
        return Math.hypot(hh.x - nx, hh.y - ny) > hh.r + GAP * 2 * m;
      });
      // cada pieza sale a la vez que su burbuja, arriba y en el lado contrario (la burbuja queda más abajo);
      // la última acompaña a DREAM BIG: entra entre la burbuja anterior y el cierre
      PAPER_ITEMS.forEach((item, qi) => {
        const tx = texts[qi];
        if (!tx || !item) return;
        const big = !!tx.rv.big;
        // todas un poco antes que su burbuja (quedan más arriba); la última justo tras la 4.ª burbuja, ya fuera antes de DREAM BIG
        const ss = big ? texts[qi - 1].s + 0.2 : tx.s - 0.15;
        const side = big ? (texts[qi - 1].rv.at[0] > 0.5 ? 0.3 : 0.7) : (tx.rv.at[0] > 0.5 ? 0.3 : 0.7);
        const sk = item.s && SKETCHES[item.s];
        const sw = sk ? sk.w * m : 0;                     // ancho del dibujo
        const w = Math.max(sw, 36 * m);                   // la pieza: al menos el ancho de un párrafo
        const dh = sk ? sw * (sk.box[3] - sk.box[1]) / (sk.box[2] - sk.box[0]) : 0;
        // párrafo: título y unas tres o cuatro líneas (menos a lo ancho de un dibujo); frase: una o dos líneas
        const paraH = item.p ? (sk ? 12 : 16) * m : 0, quoteH = item.q ? 6 * m : 0;
        const parts = [paraH, dh, quoteH].filter((v) => v > 0);
        const h = parts.reduce((a, b) => a + b, 0) + (parts.length - 1) * 2.6 * m;
        const y0 = big ? 0.2 : 0.3;
        const cands = [[side, y0], [side, y0 + 0.08], [side, y0 - 0.06], [side + (side < 0.5 ? 0.06 : -0.06), y0], [side, y0 + 0.16], [1 - side, y0], [side, y0 + 0.26], [1 - side, y0 + 0.16], [side, y0 + 0.36]];
        for (const [ax, ay] of cands) {
          const [ox, oy] = off(0, ss);
          const x = ax * W - ox + shift[0], y = ay * H - oy + shift[1];
          if (!rectClear(x, y, w, h)) continue;
          // ni encima de otra pieza ya impresa (con un margen)
          const pad = 4 * m;
          if (quoteRects.some(([qx, qy, qw, qh]) => Math.abs(qx - x) < (qw + w) / 2 + pad && Math.abs(qy - y) < (qh + h) / 2 + pad)) continue;
          const el = document.createElement('div');
          el.className = 'paper-item';
          el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w.toFixed(0) + 'px';
          // orden: título y párrafo, luego el dibujo y bajo él la frase (sin título); todo alineado a la izquierda
          el.classList.add('paper-para');
          if (sk) el.classList.add('has-sketch');
          if (item.p) {
            const cap = document.createElement('div');
            cap.className = 'pp-cap';
            cap.innerHTML = '<p class="eyebrow"></p><p class="pp-text"></p>';
            cap.querySelector('.eyebrow').textContent = item.label || '';
            cap.querySelector('.pp-text').textContent = item.p;
            el.appendChild(cap);
          }
          if (sk) {
            // recorte de un solo dibujo de la hoja
            const bw = sk.box[2] - sk.box[0], k = sw / bw;
            const fig = document.createElement('div');
            fig.className = 'paper-sketch';
            fig.style.width = sw.toFixed(0) + 'px';
            fig.style.height = dh.toFixed(0) + 'px';
            const img = document.createElement('img');
            img.src = '../img/sketches/' + sk.src; img.alt = ''; img.decoding = 'async';
            img.style.left = (-sk.box[0] * k).toFixed(1) + 'px';
            img.style.top = (-sk.box[1] * k).toFixed(1) + 'px';
            img.style.width = (sk.iw * k).toFixed(1) + 'px';
            fig.appendChild(img);
            el.appendChild(fig);
          }
          if (item.q) { const p = document.createElement('p'); p.className = 'pp-text'; p.textContent = item.q; el.appendChild(p); }
          layers[0].box.appendChild(el);
          quoteEls.push(el); quoteRects.push([x, y, w, h]);
          break;
        }
      });

      layers.forEach((L, j) => {
        if (j === 3) return;
        const holes = allHoles[j];
        // recorrido (en esta capa) de cada texto más profundo durante su propio tramo
        const segs = texts.filter((tx) => tx.k > j).map((tx) => {
          const a = tx.s - tx.hw - 0.15, b = tx.s + tx.hw + 0.15;
          const p = (ss) => { const [kx, ky] = off(tx.k, ss), [jx, jy] = off(j, ss); return [tx.c[0] + kx - jx, tx.c[1] + ky - jy]; };
          return { A: p(a), B: p(b), R: tx.R };
        });
        const segD = (sg, x, y) => {
          const dx = sg.B[0] - sg.A[0], dy = sg.B[1] - sg.A[1], len2 = dx * dx + dy * dy || 1;
          const t = clamp(((x - sg.A[0]) * dx + (y - sg.A[1]) * dy) / len2, 0, 1);
          return Math.hypot(x - (sg.A[0] + t * dx), y - (sg.A[1] + t * dy));
        };
        // alrededor de cada texto, en las capas entre la abertura de arriba y el texto, papel limpio:
        // a través de su abertura solo se ven los anillos concéntricos y el texto, ninguna otra abertura
        const cleanZones = [];
        texts.forEach((tx) => {
          if (j === 0 || j > tx.k) return;
          const c = j === tx.k ? tx.c : (tx.forced.find((h) => h.j === j) || {});
          if (c[0] != null) cleanZones.push([c[0], c[1], holeR(tx, 0) + 4 * m]);
          else if (c.x != null) cleanZones.push([c.x, c.y, holeR(tx, 0) + 4 * m]);
        });
        const free = (x, y, r) => {
          if (!clear(j, x, y, r)) return false;
          for (const tx of L.texts) if (Math.hypot(tx.c[0] - x, tx.c[1] - y) < r + tx.R) return false;
          for (const sg of segs) if (segD(sg, x, y) < r + sg.R + GAP * m) return false;
          for (const [cx, cy, cr] of cleanZones) if (Math.hypot(cx - x, cy - y) < r + cr) return false;
          // capa frontal: la primera pantalla (bajo el logo) es papel liso; las aberturas entran enteras desde abajo
          if (j === 0) {
            for (const [qx, qy, qw, qh] of quoteRects) {
              const nx = clamp(x, qx - qw / 2, qx + qw / 2), ny = clamp(y, qy - qh / 2, qy + qh / 2);
              if (Math.hypot(x - nx, y - ny) < r + GAP * 2 * m) return false;
            }
            const sx = x - shift[0], sy = y - shift[1];
            if (sy - r < H + 4 && sy + r > 0 && sx + r > 0 && sx - r < W) return false;
            // la primera fila que sube al empezar (transición desde el logo): pocas aberturas, como mucho 5
            const band = (xx, yy) => yy > H * 0.95 && yy < H * 1.75 && xx > -22 * m && xx < W + 42 * m;   // solo las que se ven
            if (band(sx, sy) && holes.filter((h) => band(h.x - shift[0], h.y - shift[1])).length >= START_HOLES) return false;
          }
          return true;
        };
        const [rmin, rmax] = SIZES[j];
        const tries = Math.round((PW * PH) / (Math.PI * Math.pow(((rmin + rmax) / 2) * m, 2)) * 4);
        for (let a = 0; a < tries; a++) {
          const r = (rmin + rand() * (rmax - rmin)) * m;
          const x = rand() * PW, y = rand() * PH;
          if (free(x, y, r)) holes.push({ x, y, r });
        }
        // transición desde el logo: la primera fila que sube tiene START_HOLES aberturas visibles (al azar casi no caben)
        if (j === 0) {
          const inStart = () => holes.filter((h) => { const hx = h.x - shift[0], hy = h.y - shift[1]; return hy > H * 0.95 && hy < H * 1.75 && hx > -22 * m && hx < W + 42 * m; }).length;
          for (let a = 0; a < 6000 && inStart() < START_HOLES; a++) {
            const r = rmin * m;
            const x = shift[0] - 0.05 * W + rand() * W * 1.2, y = shift[1] + H * (1 + rand() * 0.7);
            if (free(x, y, r)) holes.push({ x, y, r });
          }
        }
        // relleno: aberturas más pequeñas en los huecos que quedan (sin grandes zonas de papel vacío),
        // de mayor a menor para que cada hueco se llene con la más grande que quepa
        if (false) {   // relleno con aberturas pequeñas: desactivado (un solo tamaño)
          for (const f of [0.75]) {
            for (let a = 0; a < tries; a++) {
              const r = rmin * f * (0.9 + rand() * 0.2) * m;
              const x = rand() * PW, y = rand() * PH;
              if (free(x, y, r)) holes.push({ x, y, r });
            }
          }
        }
        // franjas: cada una con la máscara de las aberturas que la tocan; el canto va 4 px más abajo
        L.tiles.forEach((t) => { t.paper.remove(); t.edge.remove(); });
        L.tiles = [];
        const TH = Math.ceil(H);
        for (let y0 = 0; y0 < PH; y0 += TH) {
          let d = 'M0 0H' + PW.toFixed(0) + 'V' + (TH + 2) + 'H0Z';   // 2 px de solape entre franjas (sin costura)
          holes.forEach(({ x, y, r }) => {
            if (y + r < y0 - THICK || y - r > y0 + TH + 2) return;
            const yy = y - y0;
            d += 'M' + (x - r).toFixed(1) + ' ' + yy.toFixed(1) + 'a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (2 * r).toFixed(1) + ' 0a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (-2 * r).toFixed(1) + ' 0Z';
          });
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + PW.toFixed(0) + '" height="' + (TH + 2) + '"><path fill="#000" fill-rule="evenodd" d="' + d + '"/></svg>';
          const url = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
          const mk = (bg, dy) => {
            const el = document.createElement('div');
            el.className = 'layer-tile';
            el.style.cssText = 'left:0;top:' + (y0 + dy) + 'px;width:' + PW.toFixed(0) + 'px;height:' + (TH + 2) + 'px;background:' + bg;
            el.style.webkitMaskImage = el.style.maskImage = url;
            L.wrap.insertBefore(el, L.box);
            return el;
          };
          L.tiles.push({ y0, edge: mk(EDGES[j], THICK), paper: mk(L.fill, 0) });
        }
      });
    };
    layout();
    if (snap) window.__capasTexts = () => texts.map((tx) => ({ l: tx.rv.label, k: tx.k, s: +tx.s.toFixed(2), hw: +tx.hw.toFixed(2), n: tx.forced.length })).concat([{ total }]);
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });

    // s: pantallas recorridas desde que la sección llega arriba (negativo mientras sube bajo el logo)
    const frame = () => {
      const H = window.innerHeight;
      const s = -section.getBoundingClientRect().top / H;
      layers.forEach((L, j) => {
        const [ox, oy] = off(j, s);
        const px = ox - shift[0], py = oy - shift[1];
        L.wrap.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
        L.tiles.forEach((t) => {
          const top = t.y0 + py;
          const on = top < H * 2.2 && top + H > -H * 1.2;   // se preparan una pantalla antes de entrar: sin destellos
          if (t.on !== on) { t.on = on; t.paper.style.display = t.edge.style.display = on ? '' : 'none'; }
        });
      });
      // un texto solo existe mientras sus propias aberturas lo están descubriendo
      texts.forEach((tx) => {
        const [kx, ky] = off(tx.k, s);
        const show = tx.forced.every((h) => {
          const [hx, hy] = off(h.j, s);
          return Math.hypot((tx.c[0] + kx) - (h.x + hx), (tx.c[1] + ky) - (h.y + hy)) < h.r + tx.R;
        });
        tx.el.style.visibility = show ? 'visible' : 'hidden';
      });
      const cover = clamp((s - (total - TAIL)) / (TAIL - 0.04), 0, 1);
      clouds(cover);
      return cover;
    };
    // final de la trama: DREAM BIG centrado (parada del bloqueo de scroll trama ⇄ cielo)
    // justo cuando sus aberturas lo centran: anillos concéntricos y el título entero
    const endY = () => { const tx = texts[texts.length - 1]; return section.offsetTop + (tx.s + 0.02) * window.innerHeight; };
    return { section, frame, endY };
  })();

  // ==========================================================
  //  03 · TORRE: cielo, bajada vertical, espiral y tarjetas
  // ==========================================================
  const torre = (() => {
    const section = document.getElementById('torre');
    const world = document.getElementById('world');
    const worldScale = document.getElementById('worldScale');
    const cardsBox = document.getElementById('cards');
    const giant = document.getElementById('giant');
    const blackout = document.getElementById('blackout');
    const zoomer = document.getElementById('zoomer');
    // Transición de nubes (img/clouds.webp): un panel blanco liso y, debajo, solo la franja del borde de nubes
    // de la imagen (lo demás es blanco o transparente). Así la capa es pequeña y no pesa. Al bajar, sube y descubre el cielo.
    const BAND = [0.30, 0.72];                                     // franja útil de la imagen (proporción de su alto)
    const cloudBox = document.getElementById('torreClouds');
    const sheets = [{ flip: true, speed: 0.8, scale: 1.15, op: 0.7, white: false }, { flip: false, speed: 1, scale: 1, op: 1, white: true }].map((cfg) => {
      const el = document.createElement('div');
      el.className = 'cloud-sheet';
      el.innerHTML = (cfg.white ? '<div class="cs-white"></div>' : '') + '<div class="cs-band"><img src="../img/clouds.webp" alt="" decoding="async"></div>';
      el.style.opacity = cfg.op;
      cloudBox.appendChild(el);
      return Object.assign({ el, whiteEl: el.querySelector('.cs-white'), band: el.querySelector('.cs-band'), img: el.querySelector('img') }, cfg);
    });
    let sized = '';
    const clouds = (q) => {
      const W = window.innerWidth, H = window.innerHeight;
      if (sized !== W + 'x' + H) {
        sized = W + 'x' + H;
        sheets.forEach((sh) => {
          const w = Math.max(W, H * 1.2) * sh.scale, h = w * 2000 / 1414;
          sh.w = w; sh.bandH = (BAND[1] - BAND[0]) * h;
          sh.el.style.width = w.toFixed(0) + 'px';
          if (sh.whiteEl) sh.whiteEl.style.height = H + 'px';
          sh.band.style.height = sh.bandH.toFixed(0) + 'px';
          sh.img.style.width = w.toFixed(0) + 'px';
          sh.img.style.top = (-BAND[0] * h).toFixed(0) + 'px';
          sh.top = sh.white ? 0 : H * 0.7;
          sh.travel = (sh.white ? H : H * 0.7) + sh.bandH;
        });
      }
      sheets.forEach((sh) => {
        const y = sh.top - Math.pow(q, sh.speed < 1 ? 1.35 : 1) * sh.travel;   // la de fondo empieza más lenta (paralaje) y también sale del todo
        sh.el.style.transform = 'translate3d(' + ((W - sh.w) / 2).toFixed(0) + 'px,' + y.toFixed(1) + 'px,0)' + (sh.flip ? ' scaleX(-1)' : '');
        sh.el.style.visibility = y + (sh.white ? H : 0) + sh.bandH <= 1 ? 'hidden' : 'visible';
      });
    };

    const TW = 260, TH = 2600, D = 1150, TURNS = 2;
    const add = (parent, css) => { const d = document.createElement('div'); d.style.cssText = css; parent.appendChild(d); return d; };

    add(world, 'position:absolute;left:-5000px;top:-5000px;width:10000px;height:10000px;transform:translateY(' + TH / 2 + 'px) rotateX(90deg);' +
      'background:radial-gradient(circle at 50% 50%, rgba(196,206,214,.95) 0%, rgba(214,224,231,.6) 14%, rgba(226,236,243,0) 40%),' +
      'repeating-linear-gradient(to right, rgba(20,24,26,.05) 0 1px, transparent 1px 220px),repeating-linear-gradient(to bottom, rgba(20,24,26,.05) 0 1px, transparent 1px 220px)');

    for (let i = 0; i < 14; i++) {
      const w = 240 + ((i * 137) % 300), h = 1200 + ((i * 389) % 1800);
      const far = add(world, 'left:' + (-w / 2) + 'px;top:' + (TH / 2 - h) + 'px;width:' + w + 'px;height:' + h + 'px;background:' + (i % 2 ? '#C9D6E0' : '#BCCAD5') +
        ';transform:rotateY(' + (i * 25.7 + 9) + 'deg) translateZ(-' + (2800 + (i % 3) * 600) + 'px)');
      far.className = 'far';
    }

    // Nubes alrededor de la torre (img/clouds/cloud-1…5). NO están dentro de la escena 3D (allí se cortaban al
    // cruzarse con otras capas o con la torre): su posición, tamaño y profundidad se calculan con la misma
    // cámara y se dibujan como imágenes normales, detrás o delante de la torre según cuál esté más cerca.
    // Cada nube tiene varias "vistas" (imágenes distintas) que se funden entre sí al girar la cámara: se ve
    // distinta desde cada lado, nunca de canto y nunca aparece de golpe. Bordes fundidos.
    const BANDS = [[600, 1380], [600, 1370], [800, 1400], [620, 1530], [440, 1560]];   // franja útil (px de 2000)
    const SKY = [
      { views: [1, 3, 5], x: 600, z: 150, y: -1650, w: 2600, op: 0.95 },    // sobre el techo: se ven al bajar
      { views: [4, 2, 1], x: -1000, z: -300, y: -1450, w: 3000, op: 0.9 },
      { views: [3, 5, 2], x: 350, z: 650, y: -700, w: 2200, op: 0.9 },      // cerca: pasan por delante de la torre
      { views: [5, 1, 4], x: -2200, z: 1300, y: -400, w: 3600, op: 0.8 },   // lejos
      { views: [2, 4, 3], x: 500, z: -700, y: 250, w: 2600, op: 0.88 }
    ];
    const backBox = document.getElementById('cloudsBack'), frontBox = document.getElementById('cloudsFront');
    const skyClouds = SKY.map((c, i) => {
      const el = document.createElement('div');
      el.className = 'sky-cloud';
      const imgs = c.views.map((n, k) => {
        const [b0, b1] = BANDS[n - 1];
        const img = document.createElement('img');
        img.src = '../img/clouds/cloud-' + n + '.webp';
        img.alt = '';
        img.decoding = 'async';
        img.dataset.b0 = b0; img.dataset.b1 = b1;
        if ((i + k) % 2) img.dataset.flip = '1';
        el.appendChild(img);
        return img;
      });
      backBox.appendChild(el);
      return Object.assign({ el, imgs, ph: i * 1.7, yaw0: i * 73, front: false }, c);
    });
    const t0 = performance.now();
    const PERSP = 1400;
    const projectClouds = (angle, pitch, camY, dist, W, H, k, frontFade) => {
      frontBox.style.opacity = frontFade.toFixed(3);
      const t = (performance.now() - t0) / 1000;
      const a = angle * Math.PI / 180, p = pitch * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), cp = Math.cos(p), sp = Math.sin(p);
      const ox = W / 2, oy = H * 0.45;   // origen de la perspectiva (igual que .viewport3d)
      skyClouds.forEach((c) => {
        const x = c.x + Math.sin(t * 0.045 + c.ph) * 140, z = c.z + Math.cos(t * 0.035 + c.ph) * 90, y = c.y + Math.sin(t * 0.08 + c.ph) * 18;
        // misma transformación que el mundo: translateY(-camY) → rotateY(angle) → rotateX(pitch) → translateZ(-dist)
        const y1 = y - camY;
        const x2 = x * ca + z * sa, z2 = -x * sa + z * ca;
        const y3 = y1 * cp - z2 * sp, z3 = y1 * sp + z2 * cp;
        const Z = (z3 - dist) * k;
        const s = PERSP / (PERSP - Z);
        // muy cerca de la cámara la nube se aclara poco a poco (como atravesar su borde) y luego se oculta
        const near = clamp((3.2 - PERSP / Math.max(1, PERSP - Z)) / 1.4, 0, 1);
        if (PERSP - Z < 60 || near <= 0) { c.el.style.visibility = 'hidden'; return; }
        const sx = ox + (W / 2 + x2 * k - ox) * s, sy = oy + (H / 2 + y3 * k - oy) * s;
        const w = c.w * k * s;
        // y también según su tamaño en pantalla: nada más ancho que ~3,5 pantallas (no tapa todo ni pesa)
        const big = clamp((3.5 * W - w) / (1.5 * W), 0, 1);
        if (big <= 0) { c.el.style.visibility = 'hidden'; return; }
        // delante solo si está entera por delante de la esquina más cercana de la torre; si no, se dibuja
        // detrás y la propia torre tapa la parte oculta con su forma exacta (máscara con la forma del edificio)
        const front = z3 > (TW / 2) * Math.SQRT2 + 10;
        if (front !== c.front) { (front ? frontBox : backBox).appendChild(c.el); c.front = front; }
        c.el.style.visibility = 'visible';
        const h = w * 0.62;
        c.el.style.width = w.toFixed(0) + 'px';
        c.el.style.height = h.toFixed(0) + 'px';
        c.el.style.transform = 'translate3d(' + (sx - w / 2).toFixed(1) + 'px,' + (sy - h / 2).toFixed(1) + 'px,0)';
        // cada vista centrada en la caja (su franja de nube en el medio)
        c.imgs.forEach((img) => { img.style.top = (h / 2 - (+img.dataset.b0 + +img.dataset.b1) / 2 * w / 1414).toFixed(1) + 'px'; });
        c.el.style.zIndex = String(Math.round(Z + 100000));
        c.el.style.opacity = (c.op * near * big).toFixed(3);
        // vista según el ángulo desde el que se mira: fundido entre las dos vistas más cercanas
        const rel = (((angle + c.yaw0) % 360) + 360) % 360 / (360 / c.views.length);
        const i0 = Math.floor(rel) % c.views.length, i1 = (i0 + 1) % c.views.length, f = ease(rel - Math.floor(rel));
        c.imgs.forEach((img, j) => {
          const o = j === i0 ? 1 - f : j === i1 ? f : 0;
          img.style.opacity = o.toFixed(3);
          img.style.display = o > 0.002 ? '' : 'none';
        });
      });
    };
    const win ='repeating-linear-gradient(to bottom, rgba(20,24,26,0) 0 30px, rgba(20,24,26,.16) 30px 36px),repeating-linear-gradient(to right, rgba(20,24,26,0) 0 50px, rgba(20,24,26,.10) 50px 53px)';
    ['#F4F5F5', '#D8DBDD', '#C3C8CB', '#E4E6E8'].forEach((shade, i) => {
      const f = add(world, 'left:' + (-TW / 2) + 'px;top:' + (-TH / 2) + 'px;width:' + TW + 'px;height:' + (TH + 2) + 'px;background:' + win + ',' + shade +
        ';outline:1px solid rgba(20,24,26,.08);transform:rotateY(' + i * 90 + 'deg) translateZ(' + TW / 2 + 'px)');
      f.className = 'face';
    });
    const roof = add(world, 'left:' + (-TW / 2) + 'px;top:' + (-TW / 2) + 'px;width:' + TW + 'px;height:' + TW + 'px;background:#FFFFFF;box-shadow:inset 0 0 0 10px #E9EBEC;transform:translateY(' + (-TH / 2) + 'px) rotateX(90deg)');
    roof.className = 'face';

    // Diseño base: el recorrido de la torre es una secuencia de fotogramas (video/tower, exportados del vídeo
    // con Blender), no el vídeo: así cualquier punto del scroll tiene su imagen exacta. Se dibujan en un lienzo
    // (el edificio desplazado entre fotogramas) y el tiempo mostrado sigue al scroll con inercia: todo se desliza.
    const vCanvas = document.getElementById('towerCanvas'), vctx = vCanvas.getContext('2d', { alpha: false });
    vctx.imageSmoothingQuality = 'high';
    // Render final (2560×1438, 30 fps, ya graduado por el estudio), volteado: el edificio ocupa el ~26 % derecho.
    const N_FRAMES = 303, FPS = 30, DUR = N_FRAMES / FPS, VW = 2560, VH = 1438, IMG_H = 1438;
    const FRAME = (i) => '../video/tower/f_' + String(i + 1).padStart(4, '0') + '.webp';
    const V_CUT = 8.6;                 // segundo del recorrido en que empieza el degradado hacia la FAQ
    const FLOOR_PX = 139;              // velocidad de las nubes planas (px del fotograma por segundo)
    // Desplazamiento real del edificio entre un fotograma y el siguiente (px), medido en los fotogramas: la cámara
    // baja a ritmo constante (11,75 px por fotograma) y se para en los 2 últimos. Entre fotogramas no se funden dos
    // imágenes (emborronaba): se dibuja el más cercano desplazado justo lo que corresponde.
    const SH = new Array(N_FRAMES).fill(11.75);
    SH[N_FRAMES - 1] = SH[N_FRAMES - 2] = SH[N_FRAMES - 3] = 0;
    const shiftAt = (i) => SH[clamp(i, 0, N_FRAMES - 1)];
    const CUM = [0];                   // subida acumulada del edificio hasta cada fotograma
    for (let i = 1; i < N_FRAMES; i++) CUM.push(CUM[i - 1] + shiftAt(i - 1));
    const BUILDING_X = 0.72;          // a la derecha de esta línea (proporción del ancho) está el edificio
    const riseAt = (t) => { const x = clamp(t * FPS - 0.5, 0, N_FRAMES - 1), i = Math.min(N_FRAMES - 2, Math.floor(x)); return CUM[i] + (x - i) * shiftAt(i); };
    const KEEP = 14;                   // fotogramas descodificados que se guardan alrededor del actual
    let vWant = 0, vShown = 0, drawnKey = '', curI = 0, dir = 1;
    const frames = new Array(N_FRAMES);  // blobs comprimidos (≈15 MB en total)
    const bms = new Map();               // fotogramas ya descodificados (ImageBitmap), solo cerca del actual
    const getBm = (i) => {
      const b = bms.get(i);
      if (b && b !== 'p') return b;
      if (!b && frames[i]) {
        bms.set(i, 'p');
        createImageBitmap(frames[i]).then((bm) => {
          bms.set(i, bm); drawnKey = '';
          if (bms.size > KEEP * 2) for (const [k, v] of bms) { if (v !== 'p' && Math.abs(k - curI) > KEEP) { v.close(); bms.delete(k); } if (bms.size <= KEEP * 2) break; }
        });
      }
      return null;
    };
    // el más cercano ya descodificado (para no congelar la imagen si se adelanta el scroll)
    const nearest = (i) => { for (let d = 0; d < 8; d++) { const x = bms.get(i - d * dir); if (x && x !== 'p') return x; } return null; };
    const drawFrame = () => {
      const x = clamp(vShown * FPS - 0.5, 0, N_FRAMES - 1), i = Math.floor(x), f = x - i;
      if (i !== curI) dir = i > curI ? 1 : -1;
      curI = i;
      for (let k = -2; k <= 6; k++) { const j = i + k * dir; if (j >= 0 && j < N_FRAMES) getBm(j); }   // por delante, en el sentido del scroll
      const j = Math.min(N_FRAMES - 1, i + 1), sh = shiftAt(i), off = f * sh;
      const A = getBm(i), B = getBm(j);
      const useB = f >= 0.5 && B, main = useB ? B : (A || nearest(i));
      if (!main) return;
      const key = (useB ? j : i) + ':' + off.toFixed(1) + (main === A || main === B ? '' : '~');
      if (key === drawnKey) return;
      drawnKey = key;
      const Wc = vCanvas.width, Hc = vCanvas.height;
      // El cielo, las nubes lejanas y la franja oscura de abajo no se mueven entre fotogramas (la cámara solo
      // baja): se dibujan quietos con el fotograma más cercano. Solo la zona del edificio (derecha) se desplaza.
      vctx.drawImage(main, 0, 0, Wc, IMG_H);
      const X = Math.round(Wc * BUILDING_X);
      vctx.save(); vctx.beginPath(); vctx.rect(X, 0, Wc - X, Hc); vctx.clip();
      if (!useB) {
        // fotograma actual subido «off» px; la franja que queda abajo la rellena el siguiente
        vctx.drawImage(main, 0, -off, Wc, IMG_H);
        if (B && off > 0.05) { vctx.beginPath(); vctx.rect(X, Hc - off - 1, Wc - X, off + 1); vctx.clip(); vctx.drawImage(B, 0, sh - off, Wc, IMG_H); }
      } else {
        // siguiente fotograma, aún «sh − off» px por debajo; la franja de arriba la rellena el actual
        const d = sh - off;
        vctx.drawImage(main, 0, d, Wc, IMG_H);
        if (A && d > 0.05) { vctx.beginPath(); vctx.rect(X, 0, Wc - X, d + 1); vctx.clip(); vctx.drawImage(A, 0, -off, Wc, IMG_H); }
      }
      vctx.restore();
    };
    if (!IDEA1) {
      vCanvas.width = VW; vCanvas.height = VH;
      // se descargan en orden (6 a la vez) mientras se ve la intro
      let next = 0;
      const pull = () => {
        if (next >= N_FRAMES) return;
        const i = next++;
        fetch(FRAME(i)).then((r) => r.blob()).then((bl) => {
          frames[i] = bl;
          if (i === 0) { getBm(0); vCanvas.classList.add('is-ready'); }
          drawnKey = '';
        }).catch(() => {}).finally(pull);
      };
      for (let k = 0; k < 6; k++) pull();
    }

    // Nubes planas en capas (base): imágenes de img/clouds, cada una a su profundidad (f: cuánto se mueven
    // respecto a las plantas del edificio; las de delante, más). Cada capa proyecta su sombra sobre la de
    // detrás. t0: segundo del vídeo en que su centro pasa por el centro de la pantalla; x: centro (0–1); w: ancho (× pantalla).
    const skyBox = document.getElementById('skyLayers');
    const SKY_LAYERS = [
      { n: 1, t0: 0.6, f: 0.45, x: 0.28, w: 1.5, flip: false },
      { n: 4, t0: 2.8, f: 0.5, x: 0.72, w: 1.6, flip: true },
      { n: 2, t0: 0.0, f: 0.85, x: 0.12, w: 1.8, flip: false },
      { n: 5, t0: 3.6, f: 0.95, x: 0.58, w: 1.9, flip: false },
      { n: 3, t0: -0.4, f: 1.5, x: 0.55, w: 2.3, flip: true },
      { n: 1, t0: 2.4, f: 1.65, x: 0.08, w: 2.2, flip: true }
    ];
    const mkLayer = (box) => (L) => {
      const el = document.createElement('div');
      el.className = 'sky-layer';
      el.innerHTML = '<div class="sky-crop"><img alt="" decoding="async"></div>';
      const imgs = [...el.querySelectorAll('img')];
      imgs.forEach((img) => { img.src = '../img/clouds/cloud-' + L.n + '.webp'; if (L.flip) img.dataset.flip = '1'; });
      box.appendChild(el);
      return Object.assign({ el, crop: el.firstChild, imgs, band: BANDS[L.n - 1] }, L);
    };
    const ALL_SKY = SKY_LAYERS.map(mkLayer(skyBox));
    // cada capa de nubes a su altura (z) dentro de #skyLayers: los pájaros vuelan entre ellas
    ALL_SKY.forEach((L, i) => { L.el.style.zIndex = String((i + 1) * 10); });

    // Pájaros (base): siluetas grises con volumen que vuelan ENTRE las capas de nubes (pasan por detrás de
    // unas y por delante de otras, y cambian de capa a mitad de vuelo). Vuelo irregular: rachas de aleteo y
    // planeos, rumbo que cambia poco a poco y ángulos distintos; algunos suben desde abajo y vuelven a bajar.
    // Sobre todo pájaros solos; como mucho dos bandadas pequeñas a la vez. Se desvanecen antes del edificio.
    if (!IDEA1) {
      const R = (a, b) => a + Math.random() * (b - a);
      const birds = [];
      let flockId = 0;
      const NLAYERS = ALL_SKY.length;
      const make = (o) => {
        const el = document.createElement('div');
        el.className = 'bird';
        el.innerHTML = '<svg viewBox="0 0 40 20"><path/></svg>';
        const path = el.firstChild.firstChild;
        // profundidad: entre qué capas vuela (0 = detrás de todas). Más al fondo = más pequeño y más claro
        const depth = o.depth != null ? o.depth : Math.floor(R(0, NLAYERS + 1));
        const near = depth / NLAYERS;
        const size = R(17, 24) * lerp(0.75, 1.15, near);
        el.style.width = size.toFixed(1) + 'px'; el.style.height = (size / 2).toFixed(1) + 'px';
        el.style.zIndex = String(depth * 10 + 5);
        el.style.setProperty('--tone', lerp(0.5, 0.72, near).toFixed(2));
        skyBox.appendChild(el);
        const b = Object.assign({ el, path, size, age: 0, flapT: R(0.5, 1.4), gliding: false, op: 0,
          swapAt: R(2.5, 6), swapped: false, period: R(0.26, 0.38), wob: R(0.6, 0.9) }, o, { depth, v0: vShown });
        path.style.animationDuration = b.period.toFixed(2) + 's';
        path.style.animationDelay = (-R(0, b.period)).toFixed(2) + 's';
        birds.push(b);
        return b;
      };
      const spawnSolo = (W, H) => {
        if (Math.random() < 0.35) {
          // sube desde abajo, gira y vuelve a bajar
          const dirX = Math.random() < 0.5 ? 1 : -1;
          make({ x: R(0.06, 0.55) * W, y: H + 30, hd: -Math.PI / 2 + dirX * R(0.1, 0.35), sp: R(80, 115), turn: dirX * R(0.16, 0.26), mode: 'rise' });
        } else {
          const ltr = Math.random() < 0.55;
          make({ x: ltr ? -40 : W * 0.7, y: R(0.08, 0.6) * H, hd: (ltr ? 0 : Math.PI) + R(-0.45, 0.45), sp: R(60, 100), turn: 0, mode: 'cross' });
        }
      };
      const spawnFlock = (W, H) => {
        const ltr = Math.random() < 0.6, n = 3 + Math.floor(Math.random() * 3);
        const lead = { x: ltr ? -40 : W * 0.7, y: R(0.12, 0.45) * H, hd: (ltr ? 0 : Math.PI) + R(-0.3, 0.3), sp: R(65, 90) };
        const depth = Math.floor(R(1, NLAYERS));
        const id = ++flockId;
        for (let k = 0; k < n; k++) {
          const off = (k + 1) * R(16, 26);
          make({ x: lead.x - Math.cos(lead.hd) * off + R(-10, 10), y: lead.y + R(-22, 22) + k * R(-6, 8), hd: lead.hd + R(-0.08, 0.08),
            sp: lead.sp * R(0.96, 1.04), turn: 0, mode: 'cross', depth, flock: id, swapAt: 999 });
        }
      };
      let nextSolo = R(1.5, 4), nextFlock = R(15, 30), last = performance.now();
      const fly = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const W = window.innerWidth, H = window.innerHeight;
        const r = section.getBoundingClientRect();
        const visible = r.top <= 1 && r.bottom >= H - 1 && !document.body.classList.contains('floor-open');
        if (visible) {
          nextSolo -= dt; nextFlock -= dt;
          const solos = birds.filter((b) => !b.flock).length;
          if (nextSolo <= 0) { if (solos < 5) spawnSolo(W, H); nextSolo = R(2.5, 6); }
          if (nextFlock <= 0) { if (new Set(birds.filter((b) => b.flock).map((b) => b.flock)).size < 2) spawnFlock(W, H); nextFlock = R(18, 38); }
        }
        const edge = W * 0.72;   // el edificio
        // como las tarjetas: cada pájaro está a una altura fija en el aire y sube con el edificio al bajar el ascensor
        const cover = Math.max(W / VW, H / VH), riseNow = riseAt(vShown);
        for (let i = birds.length - 1; i >= 0; i--) {
          const b = birds[i];
          b.age += dt;
          // aleteo a rachas y planeos (al planear pierde algo de altura y velocidad)
          b.flapT -= dt;
          if (b.flapT <= 0) {
            b.gliding = !b.gliding;
            b.flapT = b.gliding ? R(0.6, 1.8) : R(0.5, 1.6);
            b.el.classList.toggle('glide', b.gliding);
          }
          const sp = b.sp * (b.gliding ? 0.88 : 1.05);
          // rumbo: deriva suave + giro propio (los que suben acaban dando la vuelta hacia abajo)
          if (b.mode === 'rise') b.hd += b.turn * dt;
          else if (!b.flock) b.hd += Math.sin(b.age * b.wob + i) * 0.25 * dt + (Math.random() - 0.5) * 0.6 * dt;
          else b.hd += (Math.random() - 0.5) * 0.25 * dt;
          b.x += Math.cos(b.hd) * sp * dt;
          b.y += Math.sin(b.hd) * sp * dt + (b.gliding ? 6 * dt : 0) + Math.sin(b.age * 7) * (b.gliding ? 0 : 0.25);
          // cambio de capa a mitad de vuelo: pasa de detrás a delante de una nube (o al revés)
          if (!b.swapped && b.age > b.swapAt) {
            b.swapped = true;
            b.depth = clamp(b.depth + (Math.random() < 0.5 ? -1 : 1) * Math.ceil(R(0.01, 2)), 0, NLAYERS);
            b.el.style.zIndex = String(b.depth * 10 + 5);
          }
          // aparece y se desvanece en los bordes y antes del edificio
          const fadeIn = clamp(b.age / 0.6, 0, 1);
          const nearB = clamp((edge - b.x) / (W * 0.06), 0, 1);
          const sy = b.y + (riseAt(b.v0) - riseNow) * cover * lerp(0.7, 1, b.depth / NLAYERS);   // posición en pantalla
          b.op = fadeIn * nearB;
          const out = b.x < -80 || b.x > edge + 20 || sy > H + 60 || sy < -80 || b.op <= 0.01;
          if (out && b.age > 1) {
            b.el.remove(); birds.splice(i, 1);
            continue;
          }
          // orientación: mira hacia donde va; se inclina con el rumbo (limitado)
          const left = Math.cos(b.hd) < 0;
          const tilt = clamp(left ? Math.atan2(Math.sin(b.hd), -Math.cos(b.hd)) : b.hd, -0.7, 0.7);
          b.el.style.opacity = b.op.toFixed(3);
          b.el.style.transform = 'translate3d(' + b.x.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) rotate(' + (left ? -tilt : tilt).toFixed(3) + 'rad)' + (left ? ' scaleX(-1)' : '');
        }
        requestAnimationFrame(fly);
      };
      requestAnimationFrame(fly);
    }
    const placeSky = (W, H, s) => {
      ALL_SKY.forEach((L) => {
        const w = L.w * W, k = w / 1414, bh = (L.band[1] - L.band[0]) * k;
        const y = H / 2 + (L.t0 - vShown) * FLOOR_PX * s * L.f - bh / 2;
        const on = y < H + 40 && y + bh > -40;
        L.el.style.visibility = on ? 'visible' : 'hidden';
        if (!on) return;
        if (L.sized !== w) {
          L.sized = w;
          L.el.style.width = w.toFixed(0) + 'px';
          L.crop.style.height = bh.toFixed(0) + 'px';
          L.imgs.forEach((img) => { img.style.top = (-L.band[0] * k).toFixed(0) + 'px'; });
          // se aclara hacia el edificio: la capa solo se mueve en vertical, así la máscara queda fija en pantalla
          const at = (sx) => (((sx * W) - (L.x * W - w / 2)) / w * 100).toFixed(1) + '%';
          const m = 'linear-gradient(to right, #000 ' + at(0.36) + ', rgba(0,0,0,.45) ' + at(0.55) + ', rgba(0,0,0,.12) ' + at(0.66) + ', rgba(0,0,0,0) ' + at(0.71) + ')';   // nada sobre el edificio
          L.crop.style.webkitMaskImage = L.crop.style.maskImage = m;
        }
        L.el.style.transform = 'translate3d(' + (L.x * W - w / 2).toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });
    };

    const cards = CATEGORIES.map((c, i) => {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML =
        '<div class="card-media"><img alt="" loading="lazy">' +
        '<button type="button" class="card-open"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M11 3v16M3 11h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button></div>' +
        '<h3></h3><p></p>';
      if (c.video) {
        // la tarjeta de Video muestra el propio vídeo, recortado al tamaño de la imagen
        const v = document.createElement('video');
        v.src = c.video; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'metadata';
        v.setAttribute('aria-hidden', 'true');
        el.querySelector('img').replaceWith(v);
        const p = v.play(); if (p) p.catch(() => {});
      } else {
        el.querySelector('img').src = IMG(c.cover);
      }
      el.querySelector('h3').textContent = c.name;
      el.querySelector('p').textContent = c.text;
      const btn = el.querySelector('.card-open');
      btn.setAttribute('aria-label', 'Entrar en ' + c.name);
      btn.addEventListener('click', () => floor.open(i, btn));
      cardsBox.appendChild(el);
      return el;
    });

    // tramos del recorrido (0–1 dentro de la sección)
    const P_DESC = 0.05;       // fin de la bajada vertical (nubes → cielo → techo de la torre)
    const P_CARDS = 0.68;      // última tarjeta
    // base: el degradado hacia la FAQ empieza justo en la última tarjeta (Morph XS) y termina justo en la parada de
    // la FAQ: el deslizamiento entre ambas es solo la transición (sin tramo muerto ni doble suavizado)
    const P_GIANT = IDEA1 ? P_CARDS + 0.045 : P_CARDS;  // Idea 1: el edificio enorme entra en cuanto desaparece la última tarjeta
    const P_BLACK = IDEA1 ? 1.0 : 0.96;   // la pantalla queda cubierta (base: en la parada de la FAQ)

    const frame = (P) => {
      const W = window.innerWidth, H = window.innerHeight;
      worldScale.style.transform = 'scale(' + (H / 900).toFixed(4) + ')';

      const desc = ease(clamp(P / P_DESC, 0, 1));
      const sp = clamp((P - P_DESC) / (1 - P_DESC), 0, 1);
      const dive = ease(clamp((P - P_GIANT) / (P_BLACK - P_GIANT), 0, 1));
      const camY = desc < 1 ? lerp(-3300, -1150, desc) : lerp(-1150, 1000, sp);
      const pitch = lerp(-38, -6, desc);
      const angle = sp * TURNS * 360;
      const dist = D - dive * 420;
      if (IDEA1) {
        world.style.transform = 'translateZ(' + (-dist).toFixed(1) + 'px) rotateX(' + pitch.toFixed(2) + 'deg) rotateY(' + angle.toFixed(2) + 'deg) translateY(' + (-camY).toFixed(1) + 'px)';
        // ninguna nube por delante desde la última tarjeta (Morph XS) hasta la FAQ
        projectClouds(angle, pitch, camY, dist, W, H, H / 900, 1 - clamp((P - (P_CARDS - 0.07)) / 0.05, 0, 1));
      } else {
        // hasta que empieza el barrido el vídeo llega al segundo V_CUT; el resto avanza al ritmo con que el
        // barrido cubre la pantalla (al cuadrado: casi quieto al principio), así el cambio queda tapado
        const gw = clamp((P - P_GIANT) / (P_BLACK - P_GIANT), 0, 1);   // lineal: el deslizamiento ya suaviza
        vWant = P < P_GIANT ? lerp(0, V_CUT, P / P_GIANT) : lerp(V_CUT, DUR - 0.05, gw);
        // inercia: el fotograma mostrado sigue al scroll suavemente (sin saltos)
        vShown = snap || Math.abs(vWant - vShown) < 0.002 ? vWant : vShown + (vWant - vShown) * 0.1;
        drawFrame();
      }
      const cover = Math.max(W / VW, H / VH);   // escala del vídeo a pantalla completa (object-fit: cover)
      if (!IDEA1) placeSky(W, H, cover);

      clouds(clamp(P / (P_DESC * 0.95), 0, 1));

      const n = cards.length;
      const narrow = W < 760;
      // borde de la torre en pantalla (su diagonal, para que nunca la pise al girar) + separación
      const proj = (1400 / (1400 + dist)) * (H / 900);
      const edge = (TW / 2) * Math.SQRT2 * proj + Math.max(28, W * 0.025);
      cards.forEach((el, i) => {
        const center = P_DESC + 0.05 + i * ((P_CARDS - P_DESC - 0.05) / (n - 1));
        const t = (P - center) / 0.045;
        const a = Math.abs(t);
        const right = i % 2 === 0;
        const shaped = Math.sign(t) * Math.pow(Math.min(a, 1), 1.6);
        const rot = (right ? -1 : 1) * shaped * 92;
        const cw = el.offsetWidth || 300;
        // base: el edificio está a la derecha del vídeo, las tarjetas van en el cielo (dos columnas)
        // base: una sola columna, centrada en la 3.ª de una retícula de 4 columnas iguales (centro en el 62,5 % del ancho)
        const xl = IDEA1 ? (right ? W / 2 + edge : W / 2 - edge - cw) : W * 0.625 - cw / 2;
        el.style.left = narrow ? 'calc(50% - min(150px, 39vw))' : (xl.toFixed(1) + 'px');
        if (!IDEA1) {
          // base: sin giro. La tarjeta aparece con un fundido y va «pegada» a una planta del edificio: sube con
          // ella al bajar el ascensor (profundidad)
          const tc = V_CUT * center / P_GIANT;                 // segundo del vídeo en que su planta está centrada
          const ab = Math.abs((P - center) / 0.048);   // ventana menor que la separación: nunca dos a la vez
          const fade = 1 - ease(clamp((ab - 0.45) / 0.55, 0, 1));
          el.style.transformOrigin = 'center center';
          el.style.transform = 'translate3d(0,' + ((riseAt(tc) - riseAt(vShown)) * cover).toFixed(1) + 'px,0)';
          el.style.opacity = fade.toFixed(3);
          el.style.visibility = ab < 1 ? 'visible' : 'hidden';
          el.classList.toggle('is-active', ab < 0.5);
          return;
        }
        el.style.transformOrigin = narrow ? 'center center' : (right ? 'left center' : 'right center');
        el.style.transform = 'translateY(' + (-t * 50).toFixed(1) + 'px) rotateY(' + rot.toFixed(2) + 'deg)';
        el.style.opacity = clamp(1.25 - a * 1.25, 0, 1).toFixed(3);
        el.style.visibility = a < 1 ? 'visible' : 'hidden';
        el.classList.toggle('is-active', a < 0.4);
      });

      // edificio enorme: asoma por la derecha mientras bajamos y barre la pantalla a negro (cortinilla de derecha a izquierda)
      // un único movimiento continuo (sin pausa): entra por la derecha y barre hasta la izquierda
      const g = clamp((P - P_GIANT) / (P_BLACK - P_GIANT), 0, 1);
      const sm = IDEA1 ? 0.5 - 0.5 * Math.cos(Math.PI * g) : g;
      // empieza del todo fuera (incluida su sombra) y entra poco a poco: nada aparece de golpe
      const lead = lerp(1 + 300 / W, -0.04, sm);
      const sweep = sm;
      giant.style.visibility = g > 0 ? 'visible' : 'hidden';
      // Idea 1: de derecha a izquierda; base: de abajo arriba (tapa el final del vídeo)
      giant.style.transform = IDEA1
        ? 'translate3d(' + (lead * W).toFixed(1) + 'px,0,0) scale(' + (1 + sweep * 0.12).toFixed(3) + ')'
        : 'translate3d(0,' + (lerp(1.99, 0, sm) * H).toFixed(1) + 'px,0)';   // su degradado (95vh) sale de la pantalla por arriba al final
      blackout.style.opacity = clamp((P - (P_BLACK - 0.03)) / 0.03, 0, 1).toFixed(3);
    };
    return { section, frame, zoomer, P_DESC, P_GIANT, P_CARDS };
  })();

  // ==========================================================
  //  PLANTA: zoom + cortinas + galería
  // ==========================================================
  const floor = (() => {
    const box = document.getElementById('floor');
    const body = document.getElementById('floorBody');
    const closeBtn = document.getElementById('floorClose');
    let opener = null, busy = false;

    const fill = (i) => {
      const c = CATEGORIES[i];
      document.getElementById('floorNum').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(CATEGORIES.length).padStart(2, '0');
      document.getElementById('floorTitle').textContent = c.name;
      document.getElementById('floorText').textContent = c.text;
      if (teardown) { teardown(); teardown = null; }
      wheelFn = null; swap = () => {};
      body.innerHTML = '';
      if (c.kind === 'tour') { teardown = tourGallery(); return; }
      if (c.kind === 'videos') { teardown = videoGallery(); return; }
      if (c.kind === 'section') { teardown = sectionGallery(); return; }
      // Rejilla de 4×4 que ocupa la pantalla (sin scroll). Al hacer scroll se cambian las 16 piezas por otras,
      // como el cambio Proceso → Packs de la web anterior: los bloques salen hacia un lado, escalonados, y los
      // nuevos entran desde el otro. Primero las piezas de la categoría, luego las de las demás; cuando ya no
      // quedan piezas nuevas, se reordenan para que cada retícula se vea distinta.
      const label = (name) => name.replace(/-/g, ' ').replace(/^./, (ch) => ch.toUpperCase());
      const pool = [...new Set(CATEGORIES.flatMap((o) => (o.gallery || []).concat(o.cover ? [o.cover] : [])))];
      const seq = c.gallery.slice();
      for (let k = 0; k < pool.length; k++) { const nm = pool[(i * 5 + k) % pool.length]; if (!seq.includes(nm)) seq.push(nm); }
      const lead = c.video ? 1 : 0;                                // en Video, la primera pieza es el propio vídeo
      const pageItems = (p) => {
        const start = p * 16 - (p > 0 ? lead : 0), n = p === 0 ? 16 - lead : 16;
        if (start + n <= seq.length) return seq.slice(start, start + n);
        if (start < seq.length) return seq.slice(start).concat(seq.slice(0, n - (seq.length - start)));
        // sin piezas nuevas: las mismas en otro orden (barajado fijo por página)
        let sd = p * 7919 + i * 31;
        const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
        const arr = seq.slice();
        for (let k = arr.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [arr[k], arr[j]] = [arr[j], arr[k]]; }
        return arr.slice(0, n);
      };
      const stage = document.createElement('div');
      stage.className = 'gallery-stage';
      body.appendChild(stage);
      const build = (p) => {
        const grid = document.createElement('div');
        grid.className = 'gallery';
        const add = (title, media) => {
          const fig = document.createElement('figure');
          fig.tabIndex = 0;
          const cap = document.createElement('figcaption');
          cap.textContent = title;
          fig.appendChild(cap);
          fig.appendChild(media);
          const cover = document.createElement('span');
          cover.className = 'g-cover';
          fig.appendChild(cover);
          grid.appendChild(fig);
        };
        if (p === 0 && c.video) {
          const v = document.createElement('video');
          v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'metadata'; v.src = c.video;
          add('Video recorrido', v);
        }
        pageItems(p).forEach((name) => {
          const img = document.createElement('img');
          img.src = IMG(name); img.alt = c.name + ' · ' + label(name); img.decoding = 'async';
          add(label(name), img);
        });
        return grid;
      };
      // escalonado: por columnas en el sentido del movimiento (y un poco por filas), 70 ms entre columnas
      const delay = (k, dir) => { const col = k % 4, row = Math.floor(k / 4); return (dir > 0 ? col : 3 - col) * 70 + row * 22; };
      let page = 0, grid = build(0), swapping = false;
      stage.appendChild(grid);
      gallery.bind(grid);
      swap = (dir) => {
        if (swapping || (dir < 0 && page === 0)) return;
        swapping = true;
        gallery.close();
        page += dir;
        const old = grid, next = build(page);
        old.style.pointerEvents = 'none';
        // salen hacia la izquierda (bajando) o la derecha (subiendo); las nuevas entran por el lado contrario
        [...old.children].forEach((f, k) => {
          f.style.transitionDelay = delay(k, dir) + 'ms';
          f.classList.add('g-out');
          f.style.setProperty('--gx', (dir > 0 ? -110 : 110) + 'vw');
        });
        [...next.children].forEach((f, k) => {
          f.style.setProperty('--gx', (dir > 0 ? 110 : -110) + 'vw');
          f.classList.add('g-out');
          f.style.transitionDelay = (260 + delay(k, dir)) + 'ms';
        });
        stage.appendChild(next);
        next.getBoundingClientRect();
        [...next.children].forEach((f) => f.classList.remove('g-out'));
        grid = next;
        gallery.bind(next);
        setTimeout(() => {
          old.remove();
          [...next.children].forEach((f) => { f.style.transitionDelay = ''; });
          swapping = false;
        }, 260 + 3 * 70 + 3 * 22 + 900 + 60);
      };
    };
    let swap = () => {};
    let wheelFn = null;     // galerías que usan la rueda de forma continua (Planos)
    let teardown = null;    // limpieza de la galería actual (bucles, sonido, observadores)

    const mk = (tag, cls, parent) => { const el = document.createElement(tag); if (cls) el.className = cls; if (parent) parent.appendChild(el); return el; };
    const mkVideo = (src, parent, cls) => {
      const v = mk('video', cls, parent);
      v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto'; v.src = src;
      v.setAttribute('aria-hidden', 'true');
      const p = v.play(); if (p) p.catch(() => {});
      return v;
    };

    // ---------- Visor 360: la imagen equirrectangular se proyecta sobre una esfera (por píxel, en WebGL).
    // Arrastrar gira la vista, con inercia; quieta, gira muy despacio sola.
    const panoViewer = (canvas, src) => {
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
      if (!gl) return { destroy() {}, setActive() {} };
      const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,
        'precision highp float;varying vec2 v;uniform sampler2D t;uniform float yaw,pitch,f,asp;' +
        'void main(){vec3 d=normalize(vec3(v.x*f*asp,v.y*f,-1.));float cp=cos(pitch),sp=sin(pitch);' +
        'd=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy-d.z*sy,d.y,d.x*sy+d.z*cy);' +
        'vec2 uv=vec2(atan(d.x,-d.z)/6.2831853+.5,.5-asin(clamp(d.y,-1.,1.))/3.1415927);gl_FragColor=texture2D(t,uv);}'));
      gl.linkProgram(prog); gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = (n) => gl.getUniformLocation(prog, n);
      const uYaw = U('yaw'), uPitch = U('pitch'), uF = U('f'), uAsp = U('asp');
      const tex = gl.createTexture(); let ready = false;
      const img = new Image();
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        ready = true;
      };
      img.src = src;
      let yaw = 0, pitch = -0.05, vy = 0, vp = 0, drag = null, active = false, raf = 0, last = performance.now();
      const FOV = 78 * Math.PI / 180;
      const draw = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        if (!drag) {
          yaw += vy * dt; pitch += vp * dt;
          vy *= Math.pow(0.04, dt); vp *= Math.pow(0.04, dt);
          if (Math.abs(vy) < 0.02) yaw += 0.025 * dt;               // giro lento cuando nadie la toca
        }
        pitch = clamp(pitch, -1.25, 1.25);
        if (ready) {
          gl.viewport(0, 0, w, h);
          gl.uniform1f(uYaw, yaw); gl.uniform1f(uPitch, pitch);
          gl.uniform1f(uF, Math.tan(FOV / 2)); gl.uniform1f(uAsp, w / h);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
      const k = () => FOV / Math.max(1, canvas.clientHeight);       // radianes por píxel: la imagen sigue al cursor
      canvas.addEventListener('pointerdown', (e) => {
        if (!active) return;
        drag = { x: e.clientX, y: e.clientY, t: performance.now() };
        canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging');
        e.preventDefault();
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const now = performance.now(), dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Math.max(1, now - drag.t) / 1000;
        yaw -= dx * k(); pitch += dy * k();
        vy = -dx * k() / dt; vp = dy * k() / dt;
        drag = { x: e.clientX, y: e.clientY, t: now };
      });
      const up = (e) => { if (!drag) return; drag = null; canvas.classList.remove('is-dragging'); try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} };
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      return {
        setActive(on) { active = on; },
        dragging: () => !!drag,
        destroy() { cancelAnimationFrame(raf); const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
      };
    };

    // ---------- Tours: retícula de 3×1 (Tour 360, Tour Unreal Engine, Tour Digital). Al pasar por encima, la
    // pieza ocupa todo el espacio de la galería (360 navegable o vídeo); al salir del 90 % central, vuelve.
    const tourGallery = () => {
      const wrap = mk('div', 'tour', body);
      const ITEMS = [
        { name: 'Tour 360', pano: '../img/tour/render-360.jpg' },
        { name: 'Tour Unreal Engine', video: '../video/gallery/tour-unreal.mp4' },
        { name: 'Tour Digital', video: '../video/gallery/tour-digital.mp4' }
      ];
      let viewer = null;
      const figs = ITEMS.map((it, k) => {
        const fig = mk('figure', 'tour-item', wrap);
        fig.tabIndex = 0;
        mk('figcaption', '', fig).textContent = it.name;
        const media = mk('div', 'tour-media', fig);
        if (it.pano) { const cv = mk('canvas', 'tour-pano', media); viewer = panoViewer(cv, it.pano); mk('span', 'tour-hint', media).textContent = 'Arrastra para girar'; }
        else mkVideo(it.video, media);
        fig.addEventListener('focus', () => expand(k));
        fig.addEventListener('click', () => { if (open < 0) expand(k); });
        return fig;
      });
      // sonido del interior (render 360): al 50 %, con fundido
      const room = new Audio('../audio/tour-360.mp3');
      room.loop = true; room.volume = 0; room.preload = 'auto';
      let roomRaf = 0;
      const roomTo = (to) => {
        cancelAnimationFrame(roomRaf);
        if (to > 0 && room.paused) { const p = room.play(); if (p) p.catch(() => {}); }
        const from = room.volume, t0 = performance.now(), ms = to > 0 ? 900 : 600;
        const step = (now) => {
          const u = clamp((now - t0) / ms, 0, 1);
          room.volume = clamp(lerp(from, to, u), 0, 1);
          if (u < 1) roomRaf = requestAnimationFrame(step);
          else if (to === 0) room.pause();
        };
        roomRaf = requestAnimationFrame(step);
      };
      let open = -1, entered = false, quietUntil = 0, settleK = null;
      const expand = (k) => {
        if (open === k) return;
        open = k; entered = false;
        wrap.classList.add('has-open');
        figs.forEach((f, j) => f.classList.toggle('is-open', j === k));
        if (viewer) viewer.setActive(k === 0);
        roomTo(k === 0 ? 0.5 : 0);
      };
      const collapse = () => {
        if (open < 0) return;
        open = -1;
        wrap.classList.remove('has-open');
        figs.forEach((f) => f.classList.remove('is-open'));
        if (viewer) viewer.setActive(false);
        roomTo(0);
        // tras volver a la retícula, no se abre nada hasta que el cursor pase a otra columna
        quietUntil = performance.now() + 750; settleK = null;
      };
      const colAt = (x) => figs.findIndex((f) => { const q = f.getBoundingClientRect(); return x >= q.left && x <= q.right; });
      wrap.addEventListener('mousemove', (e) => {
        if (open < 0) {
          if (performance.now() < quietUntil) return;
          const k = colAt(e.clientX);
          if (k < 0) return;
          if (settleK === null && quietUntil) { settleK = k; return; }
          if (k === settleK) return;
          settleK = null; quietUntil = 0;
          expand(k);
          return;
        }
        if (viewer && viewer.dragging()) return;
        const r = wrap.getBoundingClientRect(), mx = r.width * 0.05, my = r.height * 0.05;
        const inner = e.clientX > r.left + mx && e.clientX < r.right - mx && e.clientY > r.top + my && e.clientY < r.bottom - my;
        if (inner) entered = true;
        else if (entered) collapse();
      });
      wrap.addEventListener('mouseleave', () => { if (!(viewer && viewer.dragging())) { collapse(); quietUntil = 0; settleK = null; } });
      return () => { if (viewer) viewer.destroy(); cancelAnimationFrame(roomRaf); room.pause(); room.src = ''; };
    };

    // ---------- Video: dos rectángulos 3:4 (Infográfico, Storytelling), cada uno con su video vertical completo.
    // Al pulsar uno, ese mismo pasa a su versión horizontal 16:9 (más grande) y el otro se queda en 3:4 al lado;
    // al pulsarlo otra vez vuelve. Solo se reproduce lo que se ve.
    const videoGallery = () => {
      const wrap = mk('div', 'vids', body);
      const V = '../video/gallery/';
      const TYPES = [
        { name: 'Infográfico', v: V + 'infografico-v-full.mp4?c=2', h: V + 'infografico-h-full.mp4?c=2' },
        // el vertical de Storytelling que nos pasaron es el mismo archivo que el de Infográfico: esta copia empieza
        // en el segundo 55 y da la vuelta, así nunca muestran el mismo fotograma a la vez
        { name: 'Storytelling', v: V + 'storytelling-v-full.mp4?c=2', h: V + 'storytelling-h-full.mp4?c=2' }
      ];
      const slots = TYPES.map((t) => {
        const fig = mk('figure', 'vid', wrap);
        mk('figcaption', '', fig).textContent = t.name;
        const media = mk('div', 'vid-media', fig);
        fig._v = mkVideo(t.v, media, 'vid-own');
        fig._h = mkVideo(t.h, media, 'vid-alt');       // su propio formato horizontal (al pulsarlo)
        fig._h.autoplay = false; fig._h.pause(); fig._h.preload = 'metadata';
        return fig;
      });
      let active = -1;
      const play = (el, on) => { if (on) { const p = el.play(); if (p) p.catch(() => {}); } else el.pause(); };
      const layout = () => {
        const W = wrap.clientWidth, H = wrap.clientHeight, cap = 30, gap = Math.max(18, W * 0.03);
        const rects = [];
        if (active < 0) {
          const h = Math.min(H - cap, ((W - gap) / 2) / 0.75), w = h * 0.75;
          const x0 = (W - 2 * w - gap) / 2, top = cap + (H - cap - h) / 2;
          rects.push({ x: x0, y: top, w, h }, { x: x0 + w + gap, y: top, w, h });
        } else {
          // el pulsado en 16:9 y el otro en 3:4 a la misma altura, en el mismo orden
          const h = Math.min(H - cap, (W - gap) / (16 / 9 + 0.75)), wa = h * 16 / 9, wo = h * 0.75;
          const x0 = (W - wa - wo - gap) / 2, top = cap + (H - cap - h) / 2;
          const first = active === 0 ? wa : wo;
          rects.push({ x: x0, y: top, w: first, h }, { x: x0 + first + gap, y: top, w: active === 1 ? wa : wo, h });
        }
        slots.forEach((s, k) => {
          const r = rects[k];
          s.style.left = Math.round(r.x) + 'px'; s.style.top = Math.round(r.y) + 'px';
          s.style.width = Math.round(r.w) + 'px'; s.style.height = Math.round(r.h) + 'px';
          const on = k === active;
          s.classList.toggle('is-wide', on);
          play(s._h, on); play(s._v, !on);
        });
      };
      const setActive = (k) => { active = k; layout(); };
      slots.forEach((s, k) => s.addEventListener('click', () => setActive(active === k ? -1 : k)));
      const ro = new ResizeObserver(layout); ro.observe(wrap);
      layout();
      return () => { ro.disconnect(); slots.forEach((s) => { s._v.pause(); s._h.pause(); }); };
    };

    // ---------- Planos: bloc de láminas. Con la rueda se desenrolla la siguiente lámina hacia abajo (sección →
    // sección ambientada); luego la lámina se inclina 36° y aparece la isometría en blanco y negro; al final se
    // desenrolla la isometría renderizada.
    const sectionGallery = () => {
      const SHEETS = [
        { src: '../img/planos/1-seccion.svg', name: 'Sección' },
        { src: '../img/planos/2-seccion-ambientada.webp', name: 'Sección ambientada' },
        { src: '../img/planos/3-isometrica.webp', name: 'Sección isométrica' },
        { src: '../img/planos/4-isometrica-render.webp', name: 'Isometría renderizada' }
      ];
      const LAST = SHEETS.length - 1;
      const wrap = mk('div', 'pad-wrap', body);
      const head = mk('div', 'pad-head', wrap);
      const label = mk('span', 'pad-label', head);
      const hint = mk('span', 'pad-hint', head); hint.textContent = 'Scroll ↓';
      const pad = mk('div', 'pad', wrap);
      const sheets = SHEETS.map((s, k) => {
        const el = mk('div', 'sheet', pad);
        el.style.zIndex = String([1, 3, 2, 4][k]);   // la isometría B/N queda bajo la sección ambientada que se inclina
        const img = mk('img', '', el); img.src = s.src; img.alt = s.name; img.decoding = 'async';
        el._curl = mk('span', 'sheet-curl', pad);     // fuera de la hoja, para que su recorte no lo corte
        el._curl.style.zIndex = String(10 + k);
        return el;
      });
      let p = 0, shown = 0, raf = 0, idle = 0, touched = false, dir = 1, sized = '';
      const sizePad = () => {
        const W = wrap.clientWidth, H = wrap.clientHeight - 40;
        if (W <= 0 || H <= 0 || sized === W + 'x' + H) return;
        sized = W + 'x' + H;
        const w = Math.min(W, H * 16 / 9);
        pad.style.width = w.toFixed(0) + 'px'; pad.style.height = (w * 9 / 16).toFixed(0) + 'px';
      };
      const unroll = (el, k) => {      // k: 0 → oculta, 1 → desenrollada del todo (de arriba abajo)
        el.style.visibility = k > 0.001 ? 'visible' : 'hidden';
        el.style.clipPath = 'inset(0 0 ' + ((1 - k) * 100).toFixed(2) + '% 0)';
        const curl = el._curl;
        curl.style.top = (k * 100).toFixed(2) + '%';
        curl.style.opacity = (k > 0.001 && k < 0.999 ? 1 : 0).toFixed(2);
      };
      const render = () => {
        const k1 = clamp(shown, 0, 1), k2 = clamp(shown - 1, 0, 1), k3 = clamp(shown - 2, 0, 1);
        sheets[0].style.visibility = k1 < 1 ? 'visible' : 'hidden';
        unroll(sheets[1], k1);
        // inclinación de 36°: la lámina se tumba hacia atrás y se funde, dejando ver la isometría
        const tilt = ease(clamp(k2 / 0.75, 0, 1));
        sheets[1].style.transform = 'perspective(1600px) rotateX(' + (36 * tilt).toFixed(2) + 'deg) scale(' + (1 - 0.06 * tilt).toFixed(3) + ')';
        sheets[1].style.opacity = (1 - ease(clamp((k2 - 0.35) / 0.6, 0, 1))).toFixed(3);
        sheets[2].style.visibility = k2 > 0.001 ? 'visible' : 'hidden';
        sheets[2].style.opacity = ease(clamp((k2 - 0.2) / 0.7, 0, 1)).toFixed(3);
        sheets[2].style.transform = 'scale(' + (0.94 + 0.06 * ease(k2)).toFixed(3) + ')';
        unroll(sheets[3], k3);
        label.textContent = String(Math.round(shown) + 1).padStart(2, '0') + ' / ' + String(SHEETS.length).padStart(2, '0') + ' · ' + SHEETS[Math.round(shown)].name;
      };
      const loop = () => {
        sizePad();
        // cuando la rueda para, la lámina a medias termina de desenrollarse en el sentido del gesto (o vuelve si apenas se movió)
        if (performance.now() - idle > 260) {
          const to = clamp(dir > 0 ? Math.ceil(p - 0.2) : Math.floor(p + 0.2), 0, LAST);
          p += (to - p) * 0.12;
          if (Math.abs(to - p) < 0.001) p = to;
        }
        shown += (p - shown) * 0.14;
        if (Math.abs(p - shown) < 0.0005) shown = p;
        render();
        raf = requestAnimationFrame(loop);
      };
      wheelFn = (d) => {
        p = clamp(p + d / 700, 0, LAST);
        if (Math.abs(d) > 0.5) dir = Math.sign(d);
        idle = performance.now();
        if (!touched) { touched = true; hint.classList.add('is-gone'); }
      };
      const ro = new ResizeObserver(sizePad); ro.observe(wrap);
      sizePad(); render();
      raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    };

    // en la planta, la rueda (o deslizar el dedo) cambia la retícula en lugar de desplazar la página
    let wheelLock = 0, touchY = null, touchLast = null;
    box.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (wheelFn) { wheelFn(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY); return; }
      if (Math.abs(e.deltaY) < 4 || performance.now() < wheelLock) return;
      wheelLock = performance.now() + 1500;
      swap(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
    box.addEventListener('touchstart', (e) => { touchY = touchLast = e.touches[0].clientY; }, { passive: true });
    box.addEventListener('touchmove', (e) => {
      if (!wheelFn || touchLast == null) return;
      const y = e.touches[0].clientY; wheelFn((touchLast - y) * 2.5); touchLast = y;
    }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (wheelFn) { touchY = touchLast = null; return; }
      if (touchY == null) return;
      const d = touchY - e.changedTouches[0].clientY; touchY = null;
      if (Math.abs(d) > 40) swap(d > 0 ? 1 : -1);
    }, { passive: true });

    // Al pasar por encima, la pieza crece hasta ocupar también sus 3 vecinas (bloque de 2×2), igual que la
    // retícula de «Adicionales» de la web anterior: escala uniforme anclada a una esquina (derecha/abajo, o
    // izquierda/arriba en la última columna o fila), con la misma curva suave, y el nombre no crece con ella.
    const gallery = (() => {
      let current = null;
      const close = () => {
        if (!current) return;
        const f = current;
        current = null;
        f.classList.remove('is-big');
        f.classList.add('is-leaving');                 // sigue por encima de las vecinas mientras encoge
        clearTimeout(f._t);
        f._t = setTimeout(() => f.classList.remove('is-leaving'), 560);
      };
      const open = (grid, fig) => {
        if (current === fig) return;
        close();
        const figs = [...grid.children].filter((el) => el.tagName === 'FIGURE');
        const i = figs.indexOf(fig);
        const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
        const rows = Math.ceil(figs.length / cols);
        if (cols < 2) return;
        const gcs = getComputedStyle(grid);
        const gap = parseFloat(gcs.columnGap) || 0, rgap = parseFloat(gcs.rowGap) || gap;
        const col = i % cols, row = Math.floor(i / cols);
        const r = fig.getBoundingClientRect();
        // La imagen crece hasta cubrir el bloque de 2×2 alineada con los bordes de las imágenes vecinas; el nombre
        // (y una franja blanca que tapa los nombres de las vecinas) se va a la esquina del bloque.
        const media = fig.querySelector('img, video');
        const capH = media.offsetTop, w = r.width, h = r.height;
        const dx = col < cols - 1 ? 1 : -1, dy = rows > 1 && row === rows - 1 ? -1 : 1;
        // +2 px: el redondeo de subpíxeles dejaba asomar 1–2 px de la imagen de debajo en los bordes
        const sx = (w * 2 + gap + 2) / w, sy = (h * 2 + rgap - capH + 2) / (h - capH);
        const shift = 'translate(' + (dx < 0 ? -(w + gap) : 0) + 'px,' + (dy < 0 ? -(h + rgap) : 0) + 'px)';
        const side = dx > 0 ? 'left' : 'right';
        media.style.transformOrigin = side + ' ' + (dy > 0 ? 'top' : 'bottom');
        fig.style.setProperty('--media', 'scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')');
        fig.style.setProperty('--cap', shift);   // el nombre solo se desplaza: mismo tamaño que los demás
        // la franja ya crece hacia el lado correcto al escalar desde su borde: solo sube, nunca se desplaza en horizontal
        fig.style.setProperty('--cover', 'translate(0,' + (dy < 0 ? -(h + rgap) : 0) + 'px) scaleX(' + sx.toFixed(4) + ')');
        fig.querySelector('.g-cover').style.transformOrigin = side + ' top';
        clearTimeout(fig._t);
        fig.classList.remove('is-leaving');
        fig.classList.add('is-big');
        current = fig;

        // Bordes de la pieza ampliada que dan a una imagen no tapada: al entrar el ratón en esa franja,
        // pasa a ampliarse la imagen más cercana.
        const to = { l: dx > 0 ? r.left : r.right - (w * 2 + gap), t: dy > 0 ? r.top : r.bottom - (h * 2 + rgap) };
        to.r = to.l + w * 2 + gap; to.b = to.t + h * 2 + rgap;
        const covered = new Set([i, i + dx, i + dy * cols, i + dx + dy * cols].filter((k) => k >= 0 && k < figs.length));
        const others = figs.filter((_, k) => !covered.has(k));
        fig._move = (e) => {
          if (current !== fig) return;
          const bx = (to.r - to.l) * 0.16, by = (to.b - to.t) * 0.16, x = e.clientX, y = e.clientY;
          const beyond = [];
          if (y - to.t < by) beyond.push((fr) => fr.bottom <= to.t + 4);
          if (to.b - y < by) beyond.push((fr) => fr.top >= to.b - 4);
          if (x - to.l < bx) beyond.push((fr) => fr.right <= to.l + 4);
          if (to.r - x < bx) beyond.push((fr) => fr.left >= to.r - 4);
          if (!beyond.length) return;
          let best = null, bestD = Infinity;
          others.forEach((f) => {
            const fr = f.getBoundingClientRect();
            if (!beyond.some((test) => test(fr))) return;
            const d = Math.hypot(Math.max(fr.left - x, 0, x - fr.right), Math.max(fr.top - y, 0, y - fr.bottom));
            if (d < bestD) { bestD = d; best = f; }
          });
          if (best) open(grid, best);
        };
      };
      const bind = (grid) => {
        [...grid.children].forEach((fig) => {
          fig.addEventListener('mouseenter', () => open(grid, fig));
          fig.addEventListener('mousemove', (e) => fig._move && fig._move(e));
          fig.addEventListener('mouseleave', () => { if (current === fig) close(); });
          fig.addEventListener('focus', () => open(grid, fig));
          fig.addEventListener('blur', close);
        });
      };
      return { bind, close };
    })();

    // La tarjeta se abre: la caja nace con su tamaño y posición y crece hasta ocupar la parte izquierda de la
    // pantalla (la galería). Pulsar fuera (el resto de la web, oscurecido) o la X la devuelve a la tarjeta.
    const shade = document.getElementById('floorShade');
    let card = null;
    const place = (r) => { box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.width = r.width + 'px'; box.style.height = r.height + 'px'; };
    // flota como las tarjetas: margen alrededor, esquinas redondeadas y sombra (en móvil, casi toda la pantalla)
    const panel = () => {
      const W = window.innerWidth, H = window.innerHeight;
      if (W < 900) return { left: 12, top: 12, width: W - 24, height: H - 24 };
      return { left: Math.round(W * 0.035), top: Math.round(H * 0.065), width: Math.round(W * 0.63), height: Math.round(H * 0.87) };
    };
    const open = (i, btn) => {
      if (busy) return;
      busy = true; opener = btn;
      card = btn.closest('.card');
      audio.duck(true);
      const pw = panel();
      box.style.setProperty('--pw', pw.width + 'px');
      box.style.setProperty('--ph', pw.height + 'px');
      fill(i);
      place(card.getBoundingClientRect());
      box.hidden = false; shade.hidden = false;
      card.classList.add('is-opened');                // la caja «es» la tarjeta mientras está abierta
      document.documentElement.style.overflow = 'hidden';
      box.getBoundingClientRect();                  // aplica el tamaño de la tarjeta antes de animar
      box.classList.add('is-open'); shade.classList.add('is-on');
      place(pw);
      setTimeout(() => { closeBtn.focus({ preventScroll: true }); busy = false; }, 760);
    };
    const close = () => {
      if (busy || box.hidden) return;
      busy = true;
      gallery.close();
      box.classList.remove('is-open'); shade.classList.remove('is-on');
      if (card) place(card.getBoundingClientRect());
      setTimeout(() => {
        box.hidden = true; shade.hidden = true;
        if (teardown) { teardown(); teardown = null; }
        wheelFn = null;
        body.innerHTML = '';
        if (card) card.classList.remove('is-opened');
        document.documentElement.style.overflow = '';
        audio.duck(false);
        if (opener) opener.focus({ preventScroll: true });
        busy = false;
      }, 780);
    };
    shade.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });
    return { open, isOpen: () => !box.hidden };
  })();

  // ==========================================================
  //  SONIDO. Siempre activado: arranca al cargar la página (si el navegador lo bloquea hasta la
  //  primera interacción, arranca solo en cuanto la hay).
  //  · Viento y coches: grabaciones (audio/wind.mp3, audio/cars.mp3) en bucle con fundido cruzado.
  //  · Burbujas de la mitosis: sintetizadas.
  // ==========================================================
  const audio = (() => {
    const FADE = 2.5;   // segundos de fundido entre una vuelta del bucle y la siguiente
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const VOL = location.search.includes('mute') ? 0 : 0.9;   // ?mute: silencio total (para pruebas)
    const master = ctx.createGain(); master.gain.value = VOL; master.connect(ctx.destination);

    // Pista en bucle: dos copias del archivo que se alternan; cuando una llega al final se funde
    // hacia fuera mientras la otra empieza fundiéndose hacia dentro. Se transmiten (no se decodifican
    // enteras en memoria) y se pausan cuando llevan un rato en silencio.
    const track = (src, from = 0) => {   // from: segundo del archivo desde el que empieza cada vuelta
      const out = ctx.createGain(); out.gain.value = 0; out.connect(master);
      const voices = [0, 1].map(() => {
        const el = new Audio(src);
        el.preload = 'auto';
        const g = ctx.createGain(); g.gain.value = 0;
        ctx.createMediaElementSource(el).connect(g).connect(out);
        return { el, g };
      });
      let cur = 0, playing = false, quietSince = 0;
      const fade = (v, to) => { const t = ctx.currentTime; v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(to, t + FADE); };
      const start = (v) => { v.el.currentTime = from; const p = v.el.play(); if (p) p.catch(() => {}); fade(v, 1); };
      const tick = (lvl) => {
        if (!isFinite(lvl)) lvl = 0;
        out.gain.setTargetAtTime(lvl, ctx.currentTime, 0.4);
        const now = performance.now();
        if (lvl > 0.005) quietSince = now;
        if (!playing && lvl > 0.005 && ctx.state === 'running') { playing = true; start(voices[cur]); }
        if (playing && now - quietSince > 4000) { playing = false; voices.forEach((v) => { v.el.pause(); v.g.gain.value = 0; }); return; }
        if (!playing) return;
        const a = voices[cur];
        if (a.el.paused && ctx.state === 'running') { const p = a.el.play(); if (p) p.catch(() => {}); }
        const d = a.el.duration;
        if (d && isFinite(d) && a.el.currentTime > d - FADE - 0.1) {
          cur = 1 - cur;
          start(voices[cur]);
          fade(a, 0);
          setTimeout(() => { if (voices[1 - cur] === a) a.el.pause(); }, FADE * 1000 + 200);
        }
      };
      const info = () => ({ playing, cur, t: voices.map((v) => +v.el.currentTime.toFixed(1)), paused: voices.map((v) => v.el.paused), level: +out.gain.value.toFixed(2) });
      return { tick, info };
    };
    const wind = track('../audio/wind.mp3');
    const cars = track('../audio/cars.mp3', 30);   // los coches empiezan en el segundo 30 de la grabación

    const on = true;
    const unlock = () => {
      if (ctx.state === 'running') { ['pointerdown', 'pointerup', 'click', 'keydown', 'touchstart', 'touchend'].forEach((ev) => window.removeEventListener(ev, unlock, true)); return; }
      ctx.resume();
    };
    ctx.resume();   // en navegadores que lo permiten, suena desde el primer momento
    ['pointerdown', 'pointerup', 'click', 'keydown', 'touchstart', 'touchend'].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
    // pestaña oculta, minimizada o cerrándose: todo el sonido se detiene; al volver, sigue
    const away = () => { if (document.hidden) ctx.suspend(); else ctx.resume(); };
    document.addEventListener('visibilitychange', away);
    window.addEventListener('pagehide', () => ctx.suspend());
    if (snap) window.__audio = () => ({ on, state: ctx.state, master: +master.gain.value.toFixed(3), wind: wind.info(), cars: cars.info() });   // solo pruebas

    // «swoosh» suave: ruido rosado filtrado cuyo filtro barre de grave a agudo y vuelve, con paneo lento
    let noiseBuf = null;
    const noise = () => {
      if (noiseBuf) return noiseBuf;
      const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < n; i++) {   // ruido rosado (Paul Kellet, versión corta): sin siseo
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
      }
      return (noiseBuf = b);
    };
    const swoosh = (dur = 1.8, f0 = 320, f1 = 1500, f2 = 520, peak = 0.07, pan = 0.35) => {
      if (ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource(); src.buffer = noise();
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(f0, t);
      bp.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.55);
      bp.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = g;
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.setValueAtTime(-pan, t); p.pan.linearRampToValueAtTime(pan, t + dur);
        g.connect(p); node = p;
      }
      src.connect(bp).connect(lp).connect(g); node.connect(master);
      src.start(t); src.stop(t + dur + 0.05);
    };
    const pop = (depth) => {
      if (ctx.state !== 'running') return;
      const t = ctx.currentTime, f = 260 * Math.pow(1.12, Math.min(depth, 9)) * (0.9 + Math.random() * 0.2);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 2.1, t + 0.012);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.13);
    };
    // niveles 0–1 que manda el scroll: viento en las nubes y suave en la bajada; coches al acercarnos al suelo
    const ambience = (windLvl, cityLvl) => {
      wind.tick(0.8 * windLvl);
      cars.tick(Math.min(1, cityLvl * 1.1));
    };
    // al abrir una galería el ambiente baja un 70 % (sigue sonando); al cerrarla vuelve poco a poco
    const duck = (quiet) => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(quiet ? VOL * 0.3 : VOL, t + (quiet ? 0.5 : 1.6));
    };
    return { pop, swoosh, ambience, duck };
  })();

  // ==========================================================
  //  EXPLORE US: cuadrícula 8×8 de puntos blancos; cada punto es un proyecto. Al pulsar uno,
  //  la cuadrícula se va a la izquierda y el círculo vuela al centro, se inclina y hace de base
  //  de una maqueta de bloques (provisional hasta tener los modelos 3D), que se gira arrastrando.
  //  A la derecha, imágenes del proyecto.
  // ==========================================================
  const explore = (() => {
    const section = document.getElementById('explore');
    const inEl = document.getElementById('exIn');
    const head = inEl.querySelector('.ex-head');
    const grid = document.getElementById('exGrid');
    const view = document.getElementById('exView');
    const sceneEl = document.getElementById('exScene');
    const stageEl = section.querySelector('.stage');
    const faqEl = document.getElementById('faq');
    const pics = document.getElementById('exPics');
    const nameEl = document.getElementById('exName');
    const hint = document.getElementById('exHint');
    const N = 64, BASE = 480, F = 13;       // puntos, tamaño del modelo (px), altura de planta
    // azar con semilla: cada punto tiene siempre la misma maqueta
    const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const COL = { blue: [192, 38, 84], pink: [2, 82, 80], green: [92, 22, 80], white: [0, 0, 100] };
    const NAMES = ['Alameda', 'Los Cedros', 'Mirador', 'Altamira', 'Nogal', 'Bosque', 'Arrecife', 'Cumbre', 'Sabana', 'Laureles', 'Pinar', 'Brisa', 'Ceiba', 'Guadua', 'Ribera', 'Aurora'];
    const PICS = ['fachada-completa', 'fachada-esquina', 'fachada-frontal-01', 'fachada-frontal-03', 'fachada-zoom', 'aereo-01', 'aereo-02', 'aereo-03', 'aereo-04', 'aereo-05', 'aereo-06', 'acceso-01', 'acceso-02', 'amenities-01', 'amenities-02', 'amenities-03', 'amenities-04', 'interior-01', 'interior-02', 'interior-03', 'piscina-01', 'piscina-02', 'piscina-03', 'piscina-04', 'terraza-01', 'terraza-02', 'terraza-03', 'urbanizacion-01', 'urbanizacion-02', 'urbanizacion-03', 'detalle-01', 'detalle-02', 'detalle-03', 'detalle-04', 'evocativa-01', 'evocativa-03', 'conceptual-01', 'maqueta-01', 'maqueta-02'];

    // ---- maquetas: varios tipos (patio, torre con podio, agrupación, tablillas, escalonado, torres gemelas)
    const genProject = (i) => {
      const r = rng(i * 7919 + 17), R = (a, b) => a + r() * (b - a), I = (a, b) => Math.floor(R(a, b + 1));
      const boxes = [];
      const S = I(210, 250), h0 = -S / 2;                      // solar cuadrado centrado
      const add = (x, y, w, d, floors, c, z0 = 0) => boxes.push({ x, y, w, d, h: floors * F, z0, c });
      const main = r() < 0.55 ? 'blue' : r() < 0.6 ? 'pink' : 'green', acc = main === 'pink' ? 'blue' : 'pink';
      const type = i % 6 === 0 ? 5 : I(0, 4);
      const m = I(14, 26), x0 = h0 + m, x1 = -h0 - m, L = x1 - x0;
      let kind;
      if (type === 0) {            // manzana con patio: cuatro barras de alturas distintas
        kind = 'Residencial';
        const t = I(46, 64);
        const fl = () => I(2, 5);
        add(x0, x0, L * R(0.45, 0.6), t, fl(), main); add(x0 + L * 0.45, x0, L * 0.55, t, fl(), main);
        add(x0, x1 - t, L * 0.5, t, fl(), main); add(x0 + L * 0.5, x1 - t, L * 0.5, t, fl(), main);
        add(x0, x0 + t, t, L - 2 * t, fl(), main); add(x1 - t, x0 + t, t, L - 2 * t, fl(), main);
        if (r() < 0.6) add(x1 - t + I(-6, 6), x0, t, t, I(6, 9), acc);
      } else if (type === 1) {     // torre sobre podio
        kind = 'Torre';
        const pf = I(2, 3);
        add(x0, x0, L * R(0.7, 1), L * R(0.7, 1), pf, r() < 0.5 ? 'green' : main, 0);
        const tw = I(70, 100), tx = R(x0 + 8, x0 + L * 0.6 - tw * 0.4), ty = R(x0 + 8, x0 + L * 0.45);
        add(tx, ty, tw, tw * R(0.8, 1.2), I(11, 18), 'pink', pf * F);
        if (r() < 0.6) add(x1 - 50, x1 - 50, 46, 46, I(1, 2), 'pink');
      } else if (type === 2) {     // agrupación de piezas en dos niveles
        kind = 'Conjunto';
        const c = L / 3;
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
          if (r() < 0.3 || (a === 1 && b === 1 && r() < 0.7)) continue;
          const w = c * R(0.75, 1.15), d = c * R(0.75, 1.15), fl = I(1, 3);
          add(x0 + a * c + R(-6, 6), x0 + b * c + R(-6, 6), w, d, fl, main);
          if (r() < 0.35) add(x0 + a * c + w * 0.2, x0 + b * c + d * 0.2, w * 0.6, d * 0.6, I(1, 3), acc, fl * F);
        }
      } else if (type === 3) {     // tablillas paralelas con un volumen alto
        kind = 'Oficinas';
        const n = I(2, 3), gap = I(18, 30), t = (L - gap * (n - 1)) / n;
        for (let k = 0; k < n; k++) add(x0, x0 + k * (t + gap), L * R(0.65, 1), t, I(2, 6), main);
        add(x1 - I(60, 80), x0 + R(0, L * 0.4), I(55, 70), I(55, 80), I(8, 14), acc);
      } else if (type === 4) {     // escalonado: piezas apiladas que se van reduciendo
        kind = 'Hotel';
        let x = x0, y = x0, w = L, d = L * R(0.75, 1), z = 0;
        const tiers = I(3, 4);
        for (let k = 0; k < tiers; k++) {
          const fl = I(2, 4); add(x, y, w, d, fl, k === tiers - 1 ? acc : main, z);
          z += fl * F; const nw = w * R(0.5, 0.75), nd = d * R(0.5, 0.8);
          x += R(0, w - nw); y += R(0, d - nd); w = nw; d = nd;
        }
      } else {                     // torres gemelas sobre un zócalo
        kind = 'Campus';
        add(x0, x0, L, L * R(0.55, 0.8), 2, 'green');
        const tw = I(56, 70);
        add(x0 + 12, x0 + 10, tw, tw, I(9, 14), main, 2 * F);
        add(x1 - tw - 12, x0 + L * 0.2, tw, tw, I(12, 18), acc, 2 * F);
      }
      const pic = (k) => '../img/grid/' + PICS[(i * 5 + k * 11) % PICS.length] + '.jpg';
      return {
        boxes, S,
        name: kind + ' ' + NAMES[(i * 3) % NAMES.length],
        meta: String(i + 1).padStart(2, '0') + ' / ' + N + ' · ' + (2018 + (i * 5) % 8),
        pics: [0, 1, 2, 3].map(pic)
      };
    };
    const projects = Array.from({ length: N }, (_, i) => genProject(i));

    // ---- construcción del modelo en CSS 3D
    const el = (cls, parent, css) => { const d = document.createElement('div'); d.className = cls; if (css) d.style.cssText = css; parent.appendChild(d); return d; };
    const boxEl = (b, parent, plain) => {
      const [h, s, l] = COL[b.c];
      const o = el('ex-box' + (plain ? ' plain' : ''), parent, `--h:${h};--s:${s}%;--l:${l}%;width:${b.w}px;height:${b.d}px`);
      const X = BASE / 2 + b.x, Y = BASE / 2 + b.y;
      o._pos = [X, Y, b.z0];
      el('ex-f t', o, `width:${b.w}px;height:${b.d}px;transform:translateZ(${b.h}px)`);
      el('ex-f n', o, `width:${b.w}px;height:${b.h}px;transform:rotateX(90deg)`);                                 // y = 0
      el('ex-f s', o, `width:${b.w}px;height:${b.h}px;transform:translateY(${b.d}px) rotateX(90deg)`);         // y = d
      el('ex-f w', o, `width:${b.h}px;height:${b.d}px;transform:rotateY(-90deg)`);                               // x = 0
      el('ex-f e', o, `width:${b.h}px;height:${b.d}px;transform:translateX(${b.w}px) rotateY(-90deg)`);        // x = w
      return o;
    };
    // sombra arrojada (fija respecto a la maqueta, como en un esquema): envolvente de la planta desplazada
    const SH = [-0.8, -0.42];
    const hull = (pts) => {
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
      return lo.slice(0, -1).concat(up.slice(0, -1));
    };
    // cada proyecto abierto es su propia maqueta (así la anterior puede volver a su punto mientras sale la nueva)
    sceneEl.textContent = '';
    let cur = -1;
    const build = (p) => {
      // la opacidad va en un envoltorio con su propia perspectiva: puesta en la maqueta la aplanaría
      const wrap = el('ex-wrap', sceneEl);
      wrap.style.opacity = '0';
      const model = el('ex-model', wrap);
      // canto del disco: discos apilados, cada vez más oscuros
      // placa base: un cilindro macizo de poca altura (cara inferior + pared de 72 lamas sombreadas según el giro)
      const R0 = BASE / 2, T = 11, SEG = 72, sw = 2 * Math.PI * R0 / SEG + 0.8;
      el('ex-disc ex-bottom', model, `transform:translateZ(${-T}px)`);
      for (let k = 0; k < SEG; k++) {
        const th = k * 360 / SEG;
        el('ex-wall', model, `width:${sw.toFixed(2)}px;height:${T}px;left:${(R0 - sw / 2).toFixed(2)}px;top:${R0}px;--phi:${(th + 90).toFixed(1)}deg;transform:rotateZ(${th}deg) translateY(${R0 - 0.3}px) rotateX(-90deg)`);
      }
      el('ex-disc', model);
      const half = p.S / 2;
      const plot = boxEl({ x: -half, y: -half, w: p.S, d: p.S, h: 3, z0: 0, c: 'white' }, model, true);
      plot.style.transformOrigin = '50% 50%';
      plot.style.visibility = 'hidden';   // el solar aparece al aterrizar el disco, igual que los bloques
      const C = BASE / 2;
      const paths = p.boxes.map((b) => {
        const pts = [];
        for (const z of [b.z0, b.z0 + b.h]) for (const [cx, cy] of [[0, 0], [b.w, 0], [0, b.d], [b.w, b.d]]) pts.push([C + b.x + cx + SH[0] * z, C + b.y + cy + SH[1] * z]);
        return 'M' + hull(pts).map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
      }).join('');
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      const cid = 'exClip' + Math.random().toString(36).slice(2, 8);
      svg.setAttribute('class', 'ex-ground'); svg.setAttribute('viewBox', `0 0 ${BASE} ${BASE}`); svg.setAttribute('width', BASE); svg.setAttribute('height', BASE);
      svg.innerHTML = `<defs><clipPath id="${cid}"><circle cx="${C}" cy="${C}" r="${C}"/></clipPath></defs><g clip-path="url(#${cid})" fill="#14181A" opacity="0"><path d="${paths}"/></g>`;
      svg.style.transform = 'translateZ(3.5px)';
      model.appendChild(svg);
      return { el: model, wrap, plot, shadow: svg.querySelector('g'), boxes: p.boxes.map((b) => boxEl(b, model, false)) };
    };

    // ---- puntos
    const dots = projects.map((p, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ex-dot'; b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', p.name);
      b.addEventListener('click', () => { ripple(i); if (cur === i) close(); else open(i); });
      grid.appendChild(b);
      return b;
    });
    // al pulsar: la célula se aplasta y rebota, y las vecinas reciben el empujón como una onda
    const ripple = (i) => {
      if (reduced || !dots[0].animate) return;
      const ci = i % 8, ri = Math.floor(i / 8);
      dots[i].animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22,0.78)' }, { transform: 'scale(0.86,1.14)' }, { transform: 'scale(1.05,0.96)' }, { transform: 'scale(1)' }],
        { duration: 520, easing: 'ease-out' });
      dots.forEach((d, j) => {
        if (j === i) return;
        const dx = j % 8 - ci, dy = Math.floor(j / 8) - ri, dist = Math.hypot(dx, dy), amp = 9 * Math.exp(-dist / 2.4);
        if (amp < 0.6) return;
        const ux = dx / dist * amp, uy = dy / dist * amp;
        d.animate([{ transform: 'none' }, { transform: `translate(${ux.toFixed(1)}px,${uy.toFixed(1)}px) scale(${(1 - amp / 40).toFixed(3)})` }, { transform: `translate(${(-ux * 0.25).toFixed(1)}px,${(-uy * 0.25).toFixed(1)}px)` }, { transform: 'none' }],
          { duration: 640, delay: dist * 45, easing: 'cubic-bezier(.3,.7,.4,1)' });
      });
    };

    // ---- mitosis: al llegar a la sección, una sola célula se divide hasta formar la cuadrícula 8×8
    // (en x y en y por turnos: 1 → 2 → 4 → … → 64), con el mismo efecto gelatinoso del logo
    const SPLITS = [0.5, 0.42, 0.36, 0.32, 0.29, 0.27];   // duración de cada división (s)
    const mit = { t0: 0, done: false, level: -1 };
    const groupPos = (c, r, k) => {
      const nx = Math.ceil(k / 2), ny = Math.floor(k / 2);
      const sx = 1 << (3 - nx), sy = 1 << (3 - ny);
      return [30 + 60 * (Math.floor(c / sx) * sx + (sx - 1) / 2), 30 + 60 * (Math.floor(r / sy) * sy + (sy - 1) / 2)];
    };
    const backOut = (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
    const sz = (lv) => Math.pow(Math.pow(2, 6 - lv), 0.3);
    const placeDots = (L, birth) => {
      // L: divisiones hechas (0–6, continuo); birth: 0–1 aparición de la primera célula
      const k = Math.min(5, Math.floor(L)), fr = L >= 6 ? 1 : L - k, e = backOut(clamp(fr, 0, 1));
      dots.forEach((d, i) => {
        const c = i % 8, r = Math.floor(i / 8);
        const a = groupPos(c, r, k), b = groupPos(c, r, k + 1);
        const x = lerp(a[0], b[0], e) - (30 + 60 * c), y = lerp(a[1], b[1], e) - (30 + 60 * r);
        const s = lerp(sz(k), sz(k + 1), clamp(fr * 1.4, 0, 1)) * birth;
        d.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${Math.max(0.001, s).toFixed(3)})`;
      });
    };
    const runMitosis = (now) => {
      const t = (now - mit.t0) / 1000;
      const birth = backOut(clamp(t / 0.45, 0, 1));
      let L = 0, acc = 0.45;
      for (let k = 0; k < 6; k++) {
        const f = clamp((t - acc) / SPLITS[k], 0, 1);
        if (f > 0 && mit.level < k) { mit.level = k; audio.pop(k + 2); }
        L += f; acc += SPLITS[k] + 0.04;
      }
      placeDots(L, birth);
      if (t > acc + 0.1) {
        mit.done = true;
        grid.classList.remove('is-growing');
        head.classList.add('is-on');   // el título aparece cuando la cuadrícula ya está formada
        dots.forEach((d) => { d.style.transform = ''; });
      }
    };
    const resetMitosis = () => {
      mit.t0 = 0; mit.done = false; mit.level = -1;
      grid.classList.add('is-growing');
      head.classList.remove('is-on');
      placeDots(0, 0);
    };
    resetMitosis();

    // ---- disposición en tres columnas con aire entre ellas:
    //  cerrada: título y cuadrícula juntos, centrados; abierta: ambos a la columna izquierda,
    //  maqueta centrada en la columna central e imágenes en la derecha
    let isOpen = false;
    const layout = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const narrow = W < 900;
      const pad = narrow ? 20 : Math.max(48, W * 0.06);           // margen lateral
      const gap = narrow ? 16 : Math.max(40, W * 0.045);          // separación entre columnas
      const col = narrow ? W - 2 * pad : Math.min(W * 0.22, 440); // ancho de las columnas laterales
      const top = Math.max(110, H * 0.17), padB = Math.max(48, H * 0.08);
      const hw = head.offsetWidth, hh = head.offsetHeight, hGap = 36;
      let g, gx, gy, hx, hy;
      if (!isOpen) {
        // grupo centrado: el título encima de la cuadrícula, alineado con su borde izquierdo
        g = Math.min(520, W - 2 * pad, H - hh - hGap - 2 * Math.max(70, H * 0.1));
        gx = (W - g) / 2;
        gy = (H - (hh + hGap + g)) / 2 + hh + hGap;
        hx = gx; hy = gy - hh - hGap;
      } else if (!narrow) {
        hx = pad; hy = top;
        g = Math.min(col, H - (top + hh + hGap) - padB);
        gx = pad; gy = top + hh + hGap;
      } else {
        hx = pad; hy = top;
        g = Math.min(130, W * 0.32); gx = W - pad - g; gy = top - 6;
      }
      head.style.transform = `translate3d(${hx.toFixed(1)}px,${hy.toFixed(1)}px,0)`;
      grid.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0) scale(${(g / BASE).toFixed(4)})`;
      if (!isOpen) return;   // la vista y las fotos se quedan donde estaban mientras se cierran
      let vx, vy, vw, vh, px, py, pw, ph;
      if (!narrow) {
        pw = col; px = W - pad - pw; py = top; ph = H - top - padB;
        vx = pad + Math.max(col, hw) + gap; vw = px - gap - vx; vy = top - 20; vh = H - vy - padB + 20;
      } else {
        ph = Math.min(H * 0.24, 200); pw = W - 2 * pad; px = pad; py = H - padB - ph + 20;
        vx = pad; vw = W - 2 * pad; vy = Math.max(top + hh, gy + g) + 12; vh = py - vy - 12;
      }
      Object.assign(view.style, { left: vx + 'px', top: vy + 'px', width: vw + 'px', height: vh + 'px' });
      Object.assign(pics.style, { left: px + 'px', top: py + 'px', width: pw + 'px', height: ph + 'px' });
      pics.style.gridTemplateColumns = narrow ? 'repeat(4, 1fr)' : '';
      pics.style.gridTemplateRows = narrow ? '1fr' : '';
      pics.classList.toggle('is-row', narrow);
    };

    // ---- estado de la vista
    const st = { yaw: -28, tilt: 56, vYaw: 0, k: 1, last: 0, drag: null, idle: 0 };
    let active = null;            // maqueta abierta: { el, boxes, shadow, i, t0 }
    const leaving = [];           // maquetas que vuelven a su punto
    const sceneSize = () => {
      const r = sceneEl.getBoundingClientRect();
      // altura que ocupa: disco inclinado + edificios (los más altos ~ 250 px)
      return { r, k: clamp(Math.min(r.width * 0.62 / BASE, r.height * 0.8 / (BASE * 0.6 + 230)), 0.35, 1.15) };
    };
    // posición del punto i respecto al centro de la escena (en vivo: la cuadrícula se mueve mientras tanto)
    const dotOffset = (i, r) => {
      const d = dots[i].getBoundingClientRect();
      return { x: d.left + d.width / 2 - (r.left + r.width / 2), y: d.top + d.height / 2 - (r.top + r.height / 2), s: d.width / BASE };
    };
    let swapT = 0, picT = 0;
    const setInfo = (p, delay) => {
      clearTimeout(swapT);
      view.classList.add('is-swapping');
      swapT = setTimeout(() => {
        nameEl.textContent = p.name;
        view.classList.remove('is-swapping');
      }, delay);
    };
    const setPics = (p, delay) => {
      clearTimeout(picT);
      [...pics.children].forEach((f) => f.classList.remove('is-in'));
      picT = setTimeout(() => {
        pics.textContent = '';
        p.pics.forEach((src, k) => {
          const f = document.createElement('figure'), im = new Image();
          im.alt = p.name + ' · imagen ' + (k + 1); im.decoding = 'async'; im.src = src;
          f.appendChild(im); pics.appendChild(f);
          setTimeout(() => f.classList.add('is-in'), 40 + k * 120);
        });
      }, delay);
    };
    const sendHome = () => {
      if (!active) return;
      leaving.push(Object.assign(active, { out: performance.now(), from: active.cur }));
      active = null;
    };
    const open = (i) => {
      const first = !isOpen;
      sendHome();
      cur = i; isOpen = true;
      view.classList.remove('is-leaving');
      inEl.classList.add('is-open');
      const p = projects[i];
      layout();
      const m = build(p);
      st.k = sceneSize().k;
      // despega tras el rebote del punto (y, si cambiamos de proyecto, mientras la anterior se recoge)
      active = Object.assign(m, { i, t0: performance.now() + (first ? 260 : 380), yaw0: st.yaw - 40 });
      setInfo(p, first ? 0 : 340);
      setPics(p, first ? 600 : 380);
      hint.style.opacity = '1';
    };
    const close = () => {
      if (!isOpen) return;
      isOpen = false; cur = -1;
      sendHome();
      view.classList.add('is-leaving');
      inEl.classList.remove('is-open');
      [...pics.children].forEach((f) => f.classList.remove('is-in'));
      layout();
    };
    // sin botón de cerrar: se cambia pulsando otro punto; se cierra con Esc o pulsando en un espacio vacío
    inEl.addEventListener('click', (e) => { if (isOpen && (e.target === inEl || e.target === view)) close(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen && onScreen(section)) close(); });
    // al cargar o cambiar el tamaño, la cuadrícula se coloca sin deslizarse
    const placeNow = () => { grid.style.transition = head.style.transition = 'none'; layout(); grid.getBoundingClientRect(); grid.style.transition = head.style.transition = ''; };
    window.addEventListener('resize', () => { placeNow(); if (isOpen) st.k = sceneSize().k; });
    placeNow();
    // la cabecera usa la fuente web: al cargarla cambia de tamaño
    if (document.fonts) document.fonts.ready.then(placeNow);

    // ---- arrastrar para girar (con inercia); vertical cambia un poco la inclinación
    sceneEl.addEventListener('pointerdown', (e) => {
      if (!isOpen) return;
      st.drag = { x: e.clientX, y: e.clientY, t: performance.now() };
      sceneEl.setPointerCapture(e.pointerId); sceneEl.classList.add('is-drag');
      hint.style.opacity = '0';
    });
    sceneEl.addEventListener('pointermove', (e) => {
      if (!st.drag) return;
      const now = performance.now(), dx = e.clientX - st.drag.x, dy = e.clientY - st.drag.y;
      st.yaw -= dx * 0.35;
      st.tilt = clamp(st.tilt - dy * 0.15, 30, 74);
      st.vYaw = -dx * 0.35 / Math.max(8, now - st.drag.t) * 16;
      st.drag = { x: e.clientX, y: e.clientY, t: now };
    });
    const endDrag = () => { if (!st.drag) return; st.drag = null; sceneEl.classList.remove('is-drag'); st.idle = performance.now(); };
    sceneEl.addEventListener('pointerup', endDrag); sceneEl.addEventListener('pointercancel', endDrag);

    const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const pose = (m, v) => {
      m.cur = v;
      m.wrap.style.opacity = v.o.toFixed(3);
      m.el.style.transform = `translate3d(${v.x.toFixed(1)}px,${v.y.toFixed(1)}px,0) scale3d(${v.s.toFixed(4)},${v.s.toFixed(4)},${v.s.toFixed(4)}) rotateX(${v.tilt.toFixed(2)}deg) rotateZ(${v.yaw.toFixed(2)}deg)`;
      // luz fija respecto a la pantalla: cada cara se aclara u oscurece según hacia dónde mira
      const L = 65 * Math.PI / 180, a = v.yaw * Math.PI / 180;
      const sh = (ang) => (-15 + 11 * Math.cos(ang + a - L)).toFixed(1);
      m.el.style.setProperty('--yl', (v.yaw - 65).toFixed(1) + 'deg');
      m.el.style.setProperty('--kE', sh(0)); m.el.style.setProperty('--kS', sh(Math.PI / 2));
      m.el.style.setProperty('--kW', sh(Math.PI)); m.el.style.setProperty('--kN', sh(-Math.PI / 2));
    };
    const plotAt = (m, k) => {
      if (m._pk === k) return; m._pk = k;
      m.plot.style.visibility = k > 0.001 ? '' : 'hidden';
      const s = (0.86 + 0.14 * k).toFixed(4);
      m.plot.style.transform = `translate3d(${m.plot._pos[0]}px,${m.plot._pos[1]}px,0) scale3d(${s},${s},1)`;
    };
    const grow = (m, gOf) => {
      m.boxes.forEach((b, i) => {
        const g = Math.max(0.001, gOf(i));
        if (b._g === g) return; b._g = g;
        b.style.visibility = g > 0.002 ? '' : 'hidden';   // ocultos del todo hasta que empiezan a crecer
        b.style.transform = `translate3d(${b._pos[0]}px,${b._pos[1]}px,${(b._pos[2] * g).toFixed(2)}px) scale3d(1,1,${g.toFixed(4)})`;
      });
    };

    // ---- cada fotograma (solo mientras se ve)
    const frame = (now) => {
      const H = window.innerHeight;
      // entrada: igual que hacía la FAQ (sube desde abajo detrás del barrido; Idea 1: desde la derecha)
      const sr = section.getBoundingClientRect();
      const f = clamp((H - sr.top) / H, 0, 1);
      const d = easeOut(clamp((f - 0.35) / 0.6, 0, 1));
      // salida: la FAQ sube por encima; esto se aleja un poco hacia arriba y se apaga (sin cortes bruscos)
      const c = clamp(1 - faqEl.getBoundingClientRect().top / H, 0, 1);
      const up = c * 14;
      inEl.style.transform = IDEA1 ? 'translate3d(' + ((1 - d) * 70).toFixed(2) + 'vw,' + (-up).toFixed(2) + 'vh,0)' : 'translate3d(0,' + ((1 - d) * 60 - up).toFixed(2) + 'vh,0)';
      inEl.style.opacity = (clamp(d * 1.6, 0, 1) * (1 - 0.75 * ease(c))).toFixed(3);
      stageEl.style.backgroundColor = 'rgba(11,14,15,' + clamp((f - 0.75) / 0.25, 0, 1).toFixed(3) + ')';

      // mitosis: empieza cuando la sección casi ha llegado; se repite si se vuelve a entrar desde la torre
      if (sr.top > H * 0.5 && mit.t0 && !isOpen) resetMitosis();
      if (!mit.done) {
        if (!mit.t0 && f > 0.9) mit.t0 = now;
        if (mit.t0) runMitosis(now);
      }

      if (!active && !leaving.length) return;
      const dt = Math.min(64, now - (st.last || now)); st.last = now;
      if (!st.drag) {
        st.yaw += st.vYaw * dt / 16;
        st.vYaw *= Math.pow(0.94, dt / 16);
        if (Math.abs(st.vYaw) < 0.02 && now - st.idle > 1800) st.yaw -= 0.004 * dt;   // giro lento cuando nadie la toca
      }
      const r = sceneEl.getBoundingClientRect();
      const yOff = 0.08 * BASE * st.k;    // un poco por debajo del centro: así disco + edificios quedan centrados
      if (active) {
        const m = active, since = now - m.t0;
        if (since < 0) pose(m, Object.assign(dotOffset(m.i, r), { tilt: 0, yaw: m.yaw0, o: 0 }));
        else {
          if (!m.launched) { m.launched = true; dots[m.i].classList.add('is-sel'); }
          const e = io(clamp(since / 1000, 0, 1)), o = dotOffset(m.i, r);
          pose(m, { x: lerp(o.x, 0, e), y: lerp(o.y, yOff, e), s: lerp(o.s, st.k, e), tilt: lerp(0, st.tilt, e), yaw: lerp(m.yaw0, st.yaw, e), o: 1 });
        }
        // los bloques solo crecen cuando el disco ya ha llegado al centro (el vuelo dura 1 s)
        plotAt(m, ease(clamp((since - 1000) / 350, 0, 1)));
        grow(m, (i) => ease(clamp((since - 1050 - i * 80) / 650, 0, 1)));
        m.shadow.setAttribute('opacity', (0.2 * ease(clamp((since - 1450 - m.boxes.length * 80) / 600, 0, 1))).toFixed(3));
      }
      for (let n = leaving.length - 1; n >= 0; n--) {
        const m = leaving[n], t = now - m.out, a = m.from;
        // primero los edificios bajan, luego el disco vuelve a su punto y se funde con él
        grow(m, (i) => Math.min(m.boxes[i]._g || 0, 1 - ease(clamp((t - i * 30) / 380, 0, 1))));
        plotAt(m, Math.min(m._pk || 0, 1 - ease(clamp((t - 300) / 250, 0, 1))));   // el solar se va tras los bloques
        m.shadow.setAttribute('opacity', (0.2 * (1 - clamp(t / 200, 0, 1))).toFixed(3));
        if (!a || !m.launched) { m.wrap.remove(); leaving.splice(n, 1); continue; }
        const e = io(clamp((t - 260) / 820, 0, 1)), o = dotOffset(m.i, r);
        pose(m, { x: lerp(a.x, o.x, e), y: lerp(a.y, o.y, e), s: lerp(a.s, o.s, e), tilt: lerp(a.tilt, 0, e), yaw: a.yaw, o: a.o * (1 - clamp((t - 960) / 160, 0, 1)) });
        if (t > 1000 && !m.landed) {
          m.landed = true;
          if (cur !== m.i) { dots[m.i].classList.remove('is-sel'); ripple(m.i); }
        }
        if (t > 1130) {
          m.wrap.remove(); leaving.splice(n, 1);
          if (!leaving.length && !isOpen) view.classList.remove('is-leaving');
        }
      }
    };
    return { section, frame, isOpen: () => isOpen };
  })();

  // ==========================================================
  //  FAQ: acordeón. Solo una pregunta abierta a la vez; se abre con suavidad y empuja
  //  las de debajo (el título y las de arriba no se mueven).
  // ==========================================================
  (() => {
    const items = [...document.querySelectorAll('.faq-list details')];
    items.forEach((d) => {
      const p = d.querySelector('p');
      const a = document.createElement('div');
      a.className = 'faq-a';
      p.replaceWith(a); a.appendChild(p);
      const on = d.hasAttribute('open');
      d.open = true;                                   // el contenido siempre existe; la altura lo muestra u oculta
      d.classList.toggle('is-open', on);
      a.style.height = on ? 'auto' : '0px';
      d.querySelector('summary').setAttribute('aria-expanded', String(on));
    });
    const set = (d, on) => {
      const a = d.querySelector('.faq-a');
      if (d.classList.contains('is-open') === on) return;
      d.classList.toggle('is-open', on);
      d.querySelector('summary').setAttribute('aria-expanded', String(on));
      // de la altura actual a la nueva (auto no se puede animar: se mide)
      a.style.height = a.offsetHeight + 'px';
      a.getBoundingClientRect();
      a.style.height = on ? a.scrollHeight + 'px' : '0px';
      clearTimeout(a._t);
      if (on) a._t = setTimeout(() => { a.style.height = 'auto'; }, 560);
    };
    items.forEach((d) => d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      const opening = !d.classList.contains('is-open');
      items.forEach((o) => { if (o !== d) set(o, false); });
      set(d, opening);
    }));
  })();

  // ==========================================================
  //  SCROLL CON INERCIA (rueda / trackpad); el táctil ya tiene inercia nativa
  // ==========================================================
  const momentum = (() => {
    let target = window.scrollY, cur = window.scrollY, running = false, snapping = false, snapAt = 0, snapFrom = 0, snapMs = 1400, snapLong = false;
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    const exploreEl = document.getElementById('explore'), faqEl = document.getElementById('faq'), contactEl = document.getElementById('contacto');
    // Bloqueo de scroll (como en la web anterior): una cadena de paradas desde el final de la trama
    // (DREAM BIG) por cada una de las 7 tarjetas de servicios hasta la FAQ y el contacto. Cada gesto lleva
    // suavemente a la parada siguiente o anterior (las nubes y el barrido se reproducen enteros al deslizar).
    // Varios gestos seguidos saltan varias paradas: dos gestos, se salta una; tres, dos… El resto de un
    // mismo gesto (la inercia del trackpad) se ignora para que no se salte nada sin querer.
    const groups = () => {
      const tr = torre.section, H = window.innerHeight, at = (P) => tr.offsetTop + (tr.offsetHeight - H) * P;
      const n = CATEGORIES.length, step = (torre.P_CARDS - torre.P_DESC - 0.05) / (n - 1);
      const cardsY = Array.from({ length: n }, (_, i) => at(torre.P_DESC + 0.05 + i * step));
      return [[capas.endY()].concat(cardsY, [exploreEl.offsetTop, faqEl.offsetTop, Math.min(contactEl.offsetTop, maxY())])];
    };
    let lastWheel = 0, gestureDir = 0, consumed = false;
    // siguiente parada (en el sentido del gesto) a partir de y; null si no hay
    const nextStop = (y, dirn) => {
      for (const pts of groups()) {
        if (y < pts[0] - 2 || y > pts[pts.length - 1] + 2) continue;
        return dirn > 0 ? pts.find((p) => p > y + 2) : pts.slice().reverse().find((p) => p < y - 2);
      }
      return null;
    };
    const snapTo = (y) => {
      snapFrom = running ? cur : window.scrollY; cur = snapFrom; target = clamp(y, 0, maxY());
      // recorridos largos (el barrido del edificio) duran algo más para que no vayan con prisa
      // los cortos (FAQ ⇄ contacto) responden al instante: arrancan ya en movimiento y frenan con suavidad
      const screens = Math.abs(target - snapFrom) / window.innerHeight;
      snapLong = screens > 1.5;
      snapMs = snapLong ? clamp(1100 + screens * 320, 1400, 2800) : 1000;
      // Explore ⇄ FAQ: la FAQ cubre una pantalla entera; mejor un deslizamiento suave en ambos extremos
      const ex = exploreEl.offsetTop, fq = faqEl.offsetTop, near = (a, b) => Math.abs(a - b) < 6;
      if ((near(snapFrom, ex) && near(target, fq)) || (near(snapFrom, fq) && near(target, ex))) { snapLong = true; snapMs = 1350; }
      running = true; snapping = true; snapAt = performance.now();
    };
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey || floor.isOpen() || reduced) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
      const d = e.deltaY * unit;
      if (!running) { target = cur = window.scrollY; }
      if (Math.abs(d) < 1) return;
      // un gesto nuevo empieza tras una pausa (o al cambiar de sentido); lo demás es el mismo gesto
      const now = performance.now(), dirn = Math.sign(d);
      const fresh = now - lastWheel > 200 || dirn !== gestureDir;
      lastWheel = now;
      if (fresh) { gestureDir = dirn; consumed = false; }
      if (consumed) return;
      if (snapping) {
        // otro gesto durante el deslizamiento: se salta a la parada siguiente a la que ya se iba
        const y = nextStop(target, dirn);
        if (y != null) snapTo(y);
        consumed = true;
        return;
      }
      const pos = target;
      let next = clamp(target + d, 0, maxY());
      for (const pts of groups()) {
        const first = pts[0], last = pts[pts.length - 1];
        if (d > 0 && pos >= first - 2 && pos < last - 2) { snapTo(pts.find((p) => p > pos + 2)); consumed = true; return; }
        if (d < 0 && pos > first + 2 && pos <= last + 2) { snapTo(pts.slice().reverse().find((p) => p < pos - 2)); consumed = true; return; }
        // entrando en una cadena desde fuera, su primera (bajando) o última (subiendo) parada hace de tope
        if (d > 0 && pos < first - 2 && next > first) next = first;
        if (d < 0 && pos > last + 2 && next < last) next = last;
      }
      target = next;
      running = true;
    }, { passive: false });
    window.addEventListener('scroll', () => { if (!running) target = cur = window.scrollY; }, { passive: true });
    return () => {
      if (!running) return;
      if (snapping) {
        // largos (barrido del edificio): seno, arranca despacio y frena con suavidad;
        // cortos: salida inmediata y frenada larga, sin espera al empezar
        const k = clamp((performance.now() - snapAt) / snapMs, 0, 1);
        cur = lerp(snapFrom, target, snapLong ? 0.5 - 0.5 * Math.cos(Math.PI * k) : 1 - Math.pow(1 - k, 2.6));
        if (k >= 1) { cur = target; running = false; snapping = false; }
      } else {
        cur += (target - cur) * 0.075;
        if (Math.abs(target - cur) < 0.4) { cur = target; running = false; }
      }
      window.scrollTo(0, cur);
    };
  })();

  // ==========================================================
  //  CABECERA: solo los nombres de las secciones. No aparece hasta que el logo termina;
  //  se desvanece al moverse y reaparece 1 s después de quedarse quieto.
  // ==========================================================
  (() => {
    const nav = document.getElementById('siteNav');
    // Services: lista de servicios que baja al pasar por encima (cada uno lleva a su tarjeta)
    const sub = document.getElementById('navSub');
    CATEGORIES.forEach((c, i) => {
      const a = document.createElement('a');
      a.href = '#torre'; a.textContent = c.name; a.dataset.card = String(i); a.style.setProperty('--i', i);
      sub.appendChild(a);
    });
    const links = [...nav.querySelectorAll('a')];
    // en Idea 1 el enlace pasa a llamarse «Idea 2» y vuelve al diseño principal
    const ideaLink = links.find((a) => a.dataset.idea);
    if (IDEA1 && ideaLink) {
      ideaLink.textContent = 'Idea 2';
      const q = new URLSearchParams(location.search); q.delete('idea');
      ideaLink.href = location.pathname + (q.toString() ? '?' + q : '');
    }
    const exploreEl = document.getElementById('explore'), faqEl = document.getElementById('faq'), contactEl = document.getElementById('contacto');
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    const spots = () => {
      const H = window.innerHeight, tr = torre.section;
      return {
        home: 0,
        intro: H,                                                            // la trama, con el intro ya fuera
        services: tr.offsetTop + (tr.offsetHeight - H) * (torre.P_DESC + 0.05),   // primera tarjeta (parada del bloqueo)
        explore: exploreEl.offsetTop,
        faq: faqEl.offsetTop,
        contact: Math.min(contactEl.offsetTop, maxY())
      };
    };
    links.forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      if (a.dataset.idea) {
        // «Idea 1» lleva al diseño en espiral; allí «Idea 2» vuelve al principal (se mantienen los demás parámetros)
        const q = new URLSearchParams(location.search);
        if (IDEA1) q.delete('idea'); else q.set('idea', '1');
        const qs = q.toString();
        location.href = location.pathname + (qs ? '?' + qs : '');
        return;
      }
      if (a.dataset.card != null) {
        // la parada de esa tarjeta (la misma que usa el bloqueo de scroll)
        const tr = torre.section, H = window.innerHeight, n = CATEGORIES.length;
        const step = (torre.P_CARDS - torre.P_DESC - 0.05) / (n - 1);
        a.blur();
        window.scrollTo({ top: tr.offsetTop + (tr.offsetHeight - H) * (torre.P_DESC + 0.05 + +a.dataset.card * step), behavior: 'smooth' });
        return;
      }
      window.scrollTo({ top: spots()[a.dataset.go], behavior: 'smooth' });
    }));
    let lastY = window.scrollY, lastMove = performance.now(), webSince = 0;
    const moved = () => { lastMove = performance.now(); };
    ['wheel', 'touchmove', 'keydown'].forEach((ev) => window.addEventListener(ev, moved, { passive: true }));
    const tick = (now) => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 0.5) { lastMove = now; lastY = y; }
      // la cabecera espera al logo, salvo que ya estemos en la trama: entonces cuenta desde que se entra en ella
      const inWeb = y >= window.innerHeight * 0.5;
      if (inWeb && !webSince) webSince = now;
      if (!inWeb) webSince = 0;
      const ready = intro.done() || (inWeb && now - webSince > 1000);
      const on = now - lastMove > 1000 && ready && !floor.isOpen();
      nav.classList.toggle('is-on', on);
      if (on) {
        const sp = spots(), H = window.innerHeight;
        const cur = y >= sp.contact - H * 0.5 ? 'contact' : y >= sp.faq - H * 0.5 ? 'faq' : y >= sp.explore - H * 0.5 ? 'explore' : y >= sp.services - H ? 'services' : y >= H * 0.5 ? 'intro' : 'home';
        links.forEach((a) => a.classList.toggle('is-current', !a.dataset.idea && a.dataset.go === cur));   // (sin estilo: no se resalta ninguna palabra)
        nav.classList.toggle('on-dark', cur === 'explore' || cur === 'faq' || cur === 'contact');
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  // ==========================================================
  //  BUCLE
  // ==========================================================
  const smooth = { torre: 0 };
  const edgeEls = [document.getElementById('faq'), document.getElementById('contacto')];
  const torreStage = document.getElementById('torreStage');
  const step = (now) => {
    momentum();
    const pt = sectionProgress(torre.section);
    smooth.torre += (pt - smooth.torre) * (reduced || snap ? 1 : 0.35);
    if (onScreen(intro.section)) intro.frame(now, clamp(window.scrollY / window.innerHeight, 0, 1));
    const cover = onScreen(capas.section) ? capas.frame() : 0;
    const torreOn = onScreen(torre.section);
    // la torre (que empieza encima del final de la trama) no se ve hasta llegar arriba: para entonces la trama ya es blanco
    torreStage.style.opacity = torre.section.getBoundingClientRect().top > 1 ? '0' : '1';   // opacidad (no visibility): ningún hijo puede asomar
    if (torreOn) torre.frame(smooth.torre);
    // viento en las nubes; ciudad al bajar por la torre, que se apaga cuando entra el edificio enorme
    const P = smooth.torre;
    const fadeOut = 1 - clamp((P - torre.P_GIANT) / 0.07, 0, 1);
    // viento: fuerte entre las nubes y suave durante toda la bajada
    const windLvl = Math.max(cover, torreOn ? lerp(1, 0.45, clamp((P - torre.P_DESC) / 0.1, 0, 1)) * fadeOut : 0);
    // ciudad: crece a medida que bajamos por la torre
    const cityLvl = torreOn ? Math.pow(clamp((P - 0.08) / 0.5, 0, 1), 0.8) * fadeOut : 0;
    audio.ambience(windLvl, cityLvl);
    if (onScreen(explore.section)) explore.frame(now);
    // borde suave de la FAQ y del contacto: solo aparece cuando empiezan a subir (en las paradas no oscurece nada)
    for (const el of edgeEls) { const t = el.getBoundingClientRect().top / window.innerHeight; el.style.setProperty('--edge', clamp((1 - t) * 6, 0, 1).toFixed(3)); }
  };
  if (snap) window.__step = () => step(performance.now());   // solo para pruebas (?snap)
  const loop = (now) => {
    step(now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
