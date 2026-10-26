/* ============ ГРАФИКА: свет, глубина, живой слой, отклик ============
   Общая библиотека сцен (стайлгайд — docs/style-guide.md). Только растения, небо, вода, камень, дерево, металл:
   никаких живых существ и лиц. Анимируем transform и opacity, частицы — на одном canvas, статичное рисуется один раз.
   Art.light — где ключевой свет сцены (солнце, луна, фонарь): от него светлые грани и тени. */
const Art = (() => {
  let uid = 0;
  const id = p => p + (++uid);
  const full = /fx=full/.test(location.search);   // для записи видео — всегда все эффекты
  const lite = !full && (navigator.deviceMemory || 8) <= 2;   // заведомо слабые; остальное решает замер кадров (autoQuality)
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const light = { x: 0, y: 0 };
  /* Псевдослучайность с зерном: сцена одинаковая при каждом заходе */
  const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

  /* Спрайт: SVG как картинка — браузер растрирует его один раз, дальше анимация только двигает готовый растр */
  function sprite(cls, svg, parent) {
    const i = el("img", cls, parent); i.alt = ""; i.decoding = "async"; i.draggable = false;
    i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
    return i;
  }

  /* ---------- планы глубины и камера ---------- */
  const planes = [];
  function plane(depth, z) {
    const p = el("div", "plane"); p.style.zIndex = z; p._depth = depth; planes.push(p);
    return p;
  }
  /* Камера по вертикали: dy > 0 — смотрим вверх (земля уходит вниз). Дальние планы сдвигаются меньше */
  function pan(dy, ms = 2200) {
    planes.filter(p => p.isConnected).forEach(p => { p.style.willChange = "transform"; setTimeout(() => { p.style.willChange = ""; }, ms + 100); }); // слой — только на время движения
    planes.filter(p => p.isConnected).forEach(p => p.animate([{ transform: getComputedStyle(p).transform === "none" ? "none" : getComputedStyle(p).transform }, { transform: `translateY(${(dy * p._depth).toFixed(1)}px)` }],
      { duration: reduced ? 1 : ms, easing: "cubic-bezier(.45,0,.2,1)", fill: "forwards" }));
  }
  /* Наезд камеры при входе в сцену */
  function enter() { if (!reduced) stage.animate([{ transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 1600, easing: "cubic-bezier(.2,.7,.2,1)" }); }
  function shake(px = 4, ms = 260) {
    if (reduced) return;
    stage.animate([0, 1, 2, 3, 4].map(i => ({ transform: i === 4 ? "none" : `translate(${(rnd(-1, 1) * px).toFixed(1)}px, ${(rnd(-1, 1) * px * 0.7).toFixed(1)}px)` })), { duration: ms, easing: "ease-out" });
  }

  /* ---------- небо и солнце ---------- */
  /* Небо: зенит, середина, горизонт + дымка у горизонта со стороны света */
  function sky(parent, c = ["#2F86CF", "#7EC2EC", "#D9EEF7"], haze = "rgba(255,236,196,.55)") {
    const s = el("div", "sky2", parent);
    s.style.background = `radial-gradient(120% 60% at ${light.x ? (light.x / size().W * 100).toFixed(0) : 70}% 100%, ${haze}, transparent 60%), linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 52%, ${c[2]} 100%)`;
    return s;
  }
  /* Солнце: ядро, корона, большое свечение на всё небо и медленные лучи */
  function sun(parent, x, y, r = 46) {
    light.x = x; light.y = y;
    const { W, H } = size(), big = Math.max(W, H);
    const bloom = el("div", "sunbloom", parent); Object.assign(bloom.style, { left: x + "px", top: y + "px", width: big * 1.25 + "px", height: big * 1.25 + "px" });
    const rays = el("div", "godrays" + (reduced || lite ? " still" : ""), parent); Object.assign(rays.style, { left: x + "px", top: y + "px", width: big * 1.7 + "px", height: big * 1.7 + "px" });
    const g = id("sun");
    const core = el("div", "suncore", parent, `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>
      <radialGradient id="${g}c" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#FFFDF0"/><stop offset=".5" stop-color="#FFE9A6"/><stop offset="1" stop-color="#FFC94D"/></radialGradient>
      <radialGradient id="${g}h" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#FFF4C8" stop-opacity=".9"/><stop offset=".75" stop-color="#FFE59A" stop-opacity=".35"/><stop offset="1" stop-color="#FFE59A" stop-opacity="0"/></radialGradient></defs>
      <circle cx="50" cy="50" r="50" fill="url(#${g}h)"/><circle cx="50" cy="50" r="27" fill="url(#${g}c)"/><circle cx="50" cy="50" r="26" fill="none" stroke="#FFFBE6" stroke-width="1.5" opacity=".8"/></svg>`);
    Object.assign(core.style, { left: x + "px", top: y + "px", width: r * 3.4 + "px", height: r * 3.4 + "px" });
    return { bloom, rays, core, brighten(k = 1.3, ms = 2000) { [bloom, rays].forEach(e => e.animate([{ opacity: getComputedStyle(e).opacity }, { opacity: Math.min(1, k * 0.75) }], { duration: ms, fill: "forwards" })); } };
  }

  /* ---------- облака ---------- */
  /* Объёмное облако: тень снизу, тело, светлые бока к солнцу, мягкий ореол. seed — форма */
  function cloudSVG(seed = 1, lit = 1) {
    const r = seeded(seed * 7919 + 13), g = id("cl"), W = 200, base = 82;
    const n = 5 + Math.floor(r() * 3), puffs = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, rad = 16 + 22 * Math.sin(Math.PI * t) * (0.75 + r() * 0.5);
      puffs.push([18 + t * (W - 36) + (r() - 0.5) * 10, base - rad * (0.55 + r() * 0.25), rad]);
    }
    const lx = light.x && light.x < size().W / 2 ? -1 : 1;   // с какой стороны солнце
    const circles = (dx, dy, k, fill, op = 1) => puffs.map(([x, y, rr]) => `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${(rr * k).toFixed(1)}" fill="${fill}" opacity="${op}"/>`).join("");
    return `<svg viewBox="0 0 ${W} 100" aria-hidden="true"><defs>
      <linearGradient id="${g}b" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="${base + 6}"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F1F6FA"/><stop offset="1" stop-color="#C9DAEA"/></linearGradient>
      <linearGradient id="${g}s" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="${base + 10}"><stop offset="0" stop-color="#B7CBE0"/><stop offset="1" stop-color="#9DB5CF"/></linearGradient></defs>
      <g opacity=".35">${circles(0, 0, 1.08, "#FFFFFF")}</g>
      <g>${circles(0, 7, 1, `url(#${g}s)`)}<rect x="22" y="${base - 18}" width="${W - 44}" height="24" rx="12" fill="url(#${g}s)"/></g>
      <g>${circles(0, 0, 1, `url(#${g}b)`)}<rect x="24" y="${base - 22}" width="${W - 48}" height="22" rx="11" fill="url(#${g}b)"/></g>
      <g opacity="${(0.9 * lit).toFixed(2)}">${circles(lx * 5, -5, 0.72, "#FFFDF4")}</g></svg>`;
  }
  /* Облако на плане: depth 0..1 — чем дальше, тем меньше, бледнее и медленнее плывёт */
  function cloud(parent, x, y, w, { seed = 1, depth = 0.5, drift = true, lit = 1 } = {}) {
    const c = sprite("cloud2", cloudSVG(seed, lit), parent);
    Object.assign(c.style, { left: x + "px", top: y + "px", width: w + "px", height: w / 2 + "px", opacity: (0.55 + 0.45 * depth).toFixed(2) });
    if (drift && !reduced) c.animate([{ transform: "translateX(0)" }, { transform: `translateX(${(18 + 40 * depth).toFixed(0)}px)` }], { duration: 9000 + rnd(0, 6000), direction: "alternate", iterations: Infinity, easing: "ease-in-out" });
    return c;
  }

  /* ---------- горы, холмы, деревья ---------- */
  /* Хребет: силуэт с воздушной перспективой (цвет ближе к небу) и светлой кромкой со стороны солнца */
  function range(parent, { top = 0.5, bottom = 0.8, color = ["#B9CFE2", "#D3E2EE"], peaks = 5, seed = 3, rim = "#FFF6DE", round = false, snow = false } = {}) {
    const { W, H } = size(), r = seeded(seed), g = id("rg");
    const y0 = H * top, y1 = H * bottom, pts = [[-20, y1]];
    const n = peaks * 2 + 1;
    for (let i = 0; i <= n; i++) { const x = -20 + (W + 40) * i / n, hi = i % 2 === 1; pts.push([x + (r() - 0.5) * W / n * 0.5, hi ? y0 + (y1 - y0) * r() * 0.45 : y0 + (y1 - y0) * (0.45 + r() * 0.35)]); }
    pts.push([W + 20, y1]);
    let d = `M${pts[0][0]} ${H}L${pts[0][0]} ${pts[0][1]}`;
    if (round) for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [x, y] = pts[i]; d += ` Q${px.toFixed(0)} ${py.toFixed(0)} ${((px + x) / 2).toFixed(0)} ${((py + y) / 2).toFixed(0)}`; }
    else d += pts.slice(1).map(([x, y]) => ` L${x.toFixed(0)} ${y.toFixed(0)}`).join("");
    d += ` L${W + 20} ${H} Z`;
    const lx = (light.x / W) || 0.7;
    // снег на высоких вершинах: шапка с неровным краем, освещённая сторона ярче
    let caps = "";
    if (snow) for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], [ax, ay] = pts[i - 1], [bx, by] = pts[i + 1];
      if (y > ay || y > by || y > y0 + (y1 - y0) * 0.35) continue;
      const k = 0.22, l = [x + (ax - x) * k, y + (ay - y) * k], rr = [x + (bx - x) * k, y + (by - y) * k];
      caps += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} L${rr[0].toFixed(0)} ${rr[1].toFixed(0)} L${(x + (rr[0] - x) * 0.55).toFixed(0)} ${(rr[1] - 4).toFixed(0)} L${x.toFixed(0)} ${(Math.max(l[1], rr[1]) + 2).toFixed(0)} L${(x + (l[0] - x) * 0.5).toFixed(0)} ${(l[1] - 3).toFixed(0)} L${l[0].toFixed(0)} ${l[1].toFixed(0)}Z" fill="#F4F8FC" opacity=".92"/>`;
    }
    return el("div", "range", parent, `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs>
      <linearGradient id="${g}" x1="0" y1="${y0}" x2="0" y2="${y1}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${color[0]}"/><stop offset="1" stop-color="${color[1]}"/></linearGradient>
      <linearGradient id="${g}r" x1="0" y1="0" x2="1" y2="0"><stop offset="${Math.max(0, lx - 0.55).toFixed(2)}" stop-color="${rim}" stop-opacity="0"/><stop offset="${lx.toFixed(2)}" stop-color="${rim}" stop-opacity=".75"/><stop offset="${Math.min(1, lx + 0.4).toFixed(2)}" stop-color="${rim}" stop-opacity=".15"/></linearGradient></defs>
      <path d="${d}" fill="url(#${g})"/>${caps}<path d="${d}" fill="none" stroke="url(#${g}r)" stroke-width="1.6" stroke-linejoin="round" opacity=".7"/></svg>`);
  }
  /* Деревья по кромке холма (растения можно): круглые кроны и кипарисы, светлый бок к солнцу */
  function trees(parent, list, { color = "#5E9A55", dark = "#3F7A44", hi = "#9CCB7C" } = {}) {
    const lx = light.x > size().W / 2 ? 1 : -1;
    return list.map(([x, y, h, kind]) => {
      const t = sprite("tree2", kind === "c"
        ? `<svg viewBox="0 0 40 100" aria-hidden="true"><rect x="18" y="80" width="4" height="20" fill="#6B4A2E"/><path d="M20 2 C34 26 32 62 20 86 C8 62 6 26 20 2Z" fill="${dark}"/><path d="M20 4 C${20 + 12 * lx} 28 ${20 + 11 * lx} 60 20 84 C${20 + 5 * lx} 60 ${20 + 6 * lx} 30 20 4Z" fill="${hi}" opacity=".55"/></svg>`
        : `<svg viewBox="0 0 80 100" aria-hidden="true"><rect x="37" y="60" width="6" height="40" rx="2" fill="#6B4A2E"/><circle cx="40" cy="40" r="32" fill="${color}"/><circle cx="${40 + 12 * lx}" cy="30" r="18" fill="${hi}" opacity=".55"/><circle cx="${40 - 12 * lx}" cy="52" r="20" fill="${dark}" opacity=".45"/></svg>`, parent);
      Object.assign(t.style, { left: x + "px", top: y + "px", height: h + "px", width: h * (kind === "c" ? 0.4 : 0.8) + "px" });
      if (!reduced && !lite) t.style.animationDelay = (-rnd(0, 5)).toFixed(2) + "s";
      return t;
    });
  }
  /* Луг на переднем плане: земля с волной по верху, трава и цветы колышутся */
  function meadow(parent, y, { c = ["#8CC86A", "#5EA24B", "#3F8341"], seed = 5, flowers = 14 } = {}) {
    const { W, H } = size(), g = id("md"), r = seeded(seed);
    const wave = `M0 ${y} C${W * 0.25} ${y - 18} ${W * 0.55} ${y + 14} ${W * 0.8} ${y - 6} S${W} ${y - 10} ${W} ${y} V${H} H0Z`;
    const m = el("div", "meadow", parent, `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs>
      <linearGradient id="${g}" x1="0" y1="${y - 20}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c[0]}"/><stop offset=".35" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
      <linearGradient id="${g}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6D8" stop-opacity="0"/><stop offset="${((light.x / W) || 0.7).toFixed(2)}" stop-color="#FFF6D8" stop-opacity=".5"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></linearGradient></defs>
      <path d="${wave}" fill="url(#${g})"/><path d="M0 ${y} C${W * 0.25} ${y - 18} ${W * 0.55} ${y + 14} ${W * 0.8} ${y - 6} S${W} ${y - 10} ${W} ${y}" fill="none" stroke="url(#${g}l)" stroke-width="3"/></svg>`);
    // кустики травы и цветы по лугу: ближе к низу — крупнее
    for (let i = 0; i < (lite ? 8 : 16); i++) tuft(parent, r() * W, y + 6 + r() * (H - y) * 0.8, 14 + r() * 22, c, r);
    const fc = ["#FFFFFF", "#FFE07A", "#F7A9C4", "#B9A6F2"];
    for (let i = 0; i < (lite ? flowers / 2 : flowers); i++) flower(parent, r() * W, y + 10 + r() * (H - y) * 0.75, 10 + r() * 10, fc[i % fc.length]);
    return m;
  }
  function tuft(parent, x, y, h, c = ["#8CC86A", "#5EA24B", "#3F8341"], r = Math.random) {
    const blades = Array.from({ length: 5 }, (_, i) => { const a = -0.6 + i * 0.3 + (r() - 0.5) * 0.2, L = 0.6 + r() * 0.4; return `<path d="M${20 + i * 2 - 4} 40 Q${(20 + a * 20).toFixed(1)} ${(40 - 20 * L).toFixed(1)} ${(20 + a * 34).toFixed(1)} ${(40 - 38 * L).toFixed(1)} Q${(22 + a * 18).toFixed(1)} ${(40 - 18 * L).toFixed(1)} ${22 + i * 2 - 4} 40Z" fill="${i % 2 ? c[1] : c[0]}"/>`; }).join("");
    const t = sprite("tuft", `<svg viewBox="0 0 40 40" width="80" height="80">${blades}</svg>`, parent);
    Object.assign(t.style, { left: x + "px", top: y + "px", width: h + "px", height: h + "px", animationDelay: (-r() * 4).toFixed(2) + "s" });
    if (h < 40) t.classList.add("still");   // мелкая трава стоит: качание дорого на слабых телефонах, а глаз его не заметит
    return t;
  }
  function flower(parent, x, y, h, col) {
    const f = sprite("flower", `<svg viewBox="0 0 20 40" width="40" height="80"><path d="M10 40 Q9 26 10 14" stroke="#4E8F45" stroke-width="1.6" fill="none"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="10" cy="9" rx="3.2" ry="5" fill="${col}" transform="rotate(${a} 10 13)"/>`).join("")}<circle cx="10" cy="13" r="2.6" fill="#F2B33D"/></svg>`, parent);
    Object.assign(f.style, { left: x + "px", top: y + "px", width: h / 2 + "px", height: h + "px", animationDelay: (-rnd(0, 4)).toFixed(2) + "s" });
    return f;
  }
  /* Тени облаков: мягкие пятна медленно плывут по земле — сцена дышит */
  function cloudShadows(parent, y0, y1, n = 2) {
    const { W } = size();
    for (let i = 0; i < n; i++) {
      const s = el("div", "cloudshadow", parent), w = W * rnd(0.35, 0.55);
      Object.assign(s.style, { top: rnd(y0, y1) + "px", width: w + "px", height: w * 0.16 + "px", left: "0px" });
      if (!reduced) s.animate([{ transform: `translateX(${-w}px)` }, { transform: `translateX(${W + w}px)` }], { duration: rnd(38000, 60000), iterations: Infinity, delay: -rnd(0, 50000) });
      else s.style.transform = `translateX(${rnd(0, W)}px)`;
    }
  }
  /* Рамка переднего плана: крупная трава в нижних углах, чуть размыта — кадр глубже */
  function frame(parent, c) {
    const { W, H } = size(), s = Math.min(W, H) * 0.3;
    [[s * 0.25, H - s * 0.32], [W - s * 0.25, H - s * 0.3]].forEach(([x, y], i) => { const t = tuft(parent, x, y, s, c); t.classList.add("near"); t.style.transform = i ? "scaleX(-1)" : ""; });
  }

  /* ---------- тени ---------- */
  /* Контактная тень под предметом: мягкий эллипс на земле, сдвинут от света */
  function shadow(parent, x, groundY, w) {
    const s = el("div", "cshadow", parent); s._w = w;
    const off = light.x > size().W / 2 ? -1 : 1;
    s.set = (xx, h = 0) => { const k = Math.max(0.35, 1 - h / 420); Object.assign(s.style, { left: (xx + off * h * 0.12) + "px", width: (s._w * (1.15 - 0.3 * (1 - k))) + "px", opacity: (0.55 * k).toFixed(2) }); };
    Object.assign(s.style, { top: groundY + "px", height: Math.max(10, w * 0.16) + "px" }); s.set(x, 0);
    return s;
  }

  /* ---------- частицы: один canvas на сцену ---------- */
  let cv = null, cx = null, parts = [], motes = [], running = false, dpr = 1;
  function canvas() {
    if (cv && cv.isConnected) return;
    cv = el("canvas", "fxcanvas", stage); dpr = 1;   // частицы мягкие — хватает обычного разрешения, холст в 4 раза легче на ретине
    const { W, H } = size(); cv.width = W * dpr; cv.height = H * dpr; cx = cv.getContext("2d"); cx.scale(dpr, dpr);
    parts = []; motes = [];
  }
  function loop(t) {
    if (!cv || !cv.isConnected) { running = false; return; }
    const { W, H } = size(); cx.clearRect(0, 0, W, H);
    for (const m of motes) {
      m.x += m.vx; m.y += m.vy + Math.sin(t / 1400 + m.ph) * 0.12;
      if (m.y < -10) { m.y = H + 10; m.x = rnd(0, W); } if (m.x > W + 10) m.x = -10;
      const near = light.x ? Math.max(0, 1 - Math.hypot(m.x - light.x, m.y - light.y) / (Math.max(W, H) * 0.8)) : 0.5;
      const a = m.a * (0.35 + 0.65 * near) * (0.6 + 0.4 * Math.sin(t / 600 + m.ph));
      cx.fillStyle = `rgba(255,246,214,${a.toFixed(3)})`; cx.beginPath(); cx.arc(m.x, m.y, m.r, 0, 6.283); cx.fill();
    }
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.life -= 1 / 60; p.rot += p.vr;
      const k = Math.max(0, p.life / p.max);
      cx.globalAlpha = Math.min(1, k * 1.6) * p.alpha; cx.fillStyle = p.c;
      if (p.kind === "dust") { cx.globalAlpha *= 0.55 * k; cx.beginPath(); cx.arc(p.x, p.y, p.r * (2.6 - k * 1.6), 0, 6.283); cx.fill(); cx.globalAlpha = p.alpha; cx.beginPath(); cx.arc(p.x, p.y, p.r * (1.6 - k * 0.8) * 0.6, 0, 6.283); cx.globalAlpha *= 0.35 * k; cx.fill(); }
      else if (p.kind === "star") { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); const s = p.r * (0.5 + k * 0.5); cx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? s * 0.38 : s; cx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } cx.closePath(); cx.fill(); cx.restore(); }
      else { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); cx.restore(); }
    }
    cx.globalAlpha = 1;
    if (parts.length || motes.length) requestAnimationFrame(loop); else running = false;
  }
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  /* Пыльца в лучах: медленно плывёт вверх, ярче у солнца */
  function pollen(n = 28) {
    canvas(); const { W, H } = size();
    for (let i = 0; i < (lite ? n / 2 : n); i++) motes.push({ x: rnd(0, W), y: rnd(0, H), vx: rnd(0.05, 0.25), vy: -rnd(0.08, 0.3), r: rnd(0.8, 2.4), a: rnd(0.35, 0.9), ph: rnd(0, 6) });
    if (!reduced) kick();
  }
  /* Взрыв частиц: kind "star" — праздник, "dust" — пыль от удара, "chip" — щепки/конфетти */
  function burst(x, y, { n = 40, colors = ["#FFE08A", "#FFFFFF", "#F5C451", "#FFF3C4"], kind = "star", speed = 7, g = 0.12, life = 1.2, size: sz = 6, up = 0, alpha = 1 } = {}) {
    canvas(); if (reduced) n = Math.min(n, 8);
    for (let i = 0; i < (lite ? n / 2 : n); i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(0.3, 1) * speed;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * (kind === "dust" ? 0.35 : 1) - up, g, drag: kind === "dust" ? 0.93 : 0.975, life, max: life, c: colors[i % colors.length], r: rnd(0.5, 1) * sz, rot: rnd(0, 6), vr: rnd(-0.2, 0.2), kind, alpha });
    }
    kick();
  }
  /* Волна света от точки (правильный ответ, удача) */
  function glow(x, y, sz = 420, color = "rgba(255,226,140,.75)") {
    const g = el("div", "lightwave", app); Object.assign(g.style, { left: x + "px", top: y + "px", width: sz + "px", height: sz + "px", background: `radial-gradient(circle, ${color} 0, rgba(255,226,140,0) 65%)` });
    g.animate([{ transform: "translate(-50%,-50%) scale(.2)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(1.6)", opacity: 0 }], { duration: 900, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => g.remove();
  }
  /* Моушн входа в сцену: rise — поднимается из-под низа, pop — вырастает (растения, предметы), fall — опускается сверху */
  function rise(e, delay = 0, dy = 40, ms = 1400) { if (!reduced) e.animate([{ transform: `translateY(${dy}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: ms, delay, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }); return e; }
  function pop(e, delay = 0, ms = 650) { if (!reduced) e.animate([{ scale: "0" }, { scale: "1.08", offset: 0.7 }, { scale: "1" }], { duration: ms, delay, easing: "cubic-bezier(.2,.9,.3,1)", fill: "backwards" }); return e; }
  function fall(e, delay = 0, dy = -60, ms = 1100) { if (!reduced) e.animate([{ transform: `translateY(${dy}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: ms, delay, easing: "cubic-bezier(.2,1.2,.3,1)", fill: "backwards" }); return e; }
  /* ---------- указатель «куда нажать»: стилизованная кисть-перчатка без лица ----------
     Остриё пальца — в точке (x, y). Режимы: tap — нажми, hold — нажми и держи, drag — тяни (на dx, dy), swipe — води туда-сюда */
  const HAND = `<svg viewBox="-12 -12 88 88" aria-hidden="true"><g class="burst" stroke-linecap="round" stroke-width="3.4">
      <path d="M21 -9 V-2" stroke="#F5C451"/><path d="M7 -3 L11.5 1.5" stroke="#FF8A5B"/><path d="M35 -3 L30.5 1.5" stroke="#5BC3B0"/><path d="M2 9 H8" stroke="#7FB4F0"/><path d="M40 9 H34" stroke="#F5C451"/></g>
    <g stroke="#1D3B52" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <path d="M15 34 V11 a6 6 0 0 1 12 0 V26 a4.5 4.5 0 0 1 9 .5 V28 a4.5 4.5 0 0 1 8.5 1.5 V31 a4 4 0 0 1 7.5 2 V46 c0 8 -6 14 -14 14 H31 c-4.5 0 -7.5 -1.8 -10 -5 L8.5 44 c-1.8 -2.5 -.5 -6 2.6 -6.2 c1.8 -.1 3.2 .8 3.9 2.2 Z" fill="#FFFFFF"/>
      <path d="M31 31.5 V36 M39.5 33 V37.5 M47.5 35.5 V39" stroke-width="2.2" fill="none"/>
      <path d="M17 13 V22" stroke="#E7EEF3" stroke-width="3" fill="none"/></g>
    <path d="M24 57.5 H46 a3 3 0 0 1 3 3 V64 H21 V60.5 a3 3 0 0 1 3 -3Z" fill="#F5C451" stroke="#1D3B52" stroke-width="2.6" stroke-linejoin="round"/></svg>`;
  function pointer(x, y, mode = "tap", dx = 0, dy = 0) {
    const p = el("div", "pointer " + mode, app, `<div class="ph">${HAND}</div>`);
    Object.assign(p.style, { left: x + "px", top: y + "px" });
    p.style.setProperty("--dx", dx.toFixed(0) + "px"); p.style.setProperty("--dy", dy.toFixed(0) + "px");
    return p;
  }
  /* Подсказка-указатель для действия: появляется через delay, прячется при любом касании, снова — после idle мс без касаний.
     where() → { x, y, dx?, dy? } (координаты сцены). Одновременно на экране — только один указатель */
  const coaches = new Set();
  function coach(where, mode = "tap", { delay = 1200, idle = 5000 } = {}) {
    let p = null, t = null, live = true;
    const show = () => {
      if (!live || p) return;
      if (document.querySelector(".pointer")) { t = setTimeout(show, 1500); return; }
      const q = where(); if (!q) return;
      p = pointer(q.x, q.y, mode, q.dx || 0, q.dy || 0);
    };
    const hide = () => { if (!p) return; const e = p; p = null; e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).onfinish = () => e.remove(); };
    const kick = () => { hide(); clearTimeout(t); if (live) t = setTimeout(show, idle); };
    app.addEventListener("pointerdown", kick, true);
    t = setTimeout(show, delay);
    const c = { stop() { live = false; clearTimeout(t); hide(); app.removeEventListener("pointerdown", kick, true); coaches.delete(c); }, kick };
    coaches.add(c); return c;
  }

  /* Отклик касания: кольцо в точке нажатия + короткая вибрация */
  function ripple(x, y) {
    const r = el("div", "ripple", app); Object.assign(r.style, { left: x + "px", top: y + "px" });
    r.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: .8 }, { transform: "translate(-50%,-50%) scale(1.5)", opacity: 0 }], { duration: 480, easing: "ease-out" }).onfinish = () => r.remove();
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) {}
  }

  /* Качество под устройство: через 1,5 с после входа меряем кадры; медленно — выключаем лучи, качание, пыльцу.
     ?fx=full — всегда полное (для записи видео) */
  function autoQuality() {
    if (full) return;
    setTimeout(() => {
      let n = 0, t0 = 0;
      const f = t => { if (!t0) t0 = t; if (++n < 45) return requestAnimationFrame(f); if ((t - t0) / n > 30) { document.body.classList.add("lowfx"); motes = []; } };
      requestAnimationFrame(f);
    }, 1500);
  }
  if (lite) document.body.classList.add("lowfx");

  return { light, lite, reduced, autoQuality, plane, pan, enter, shake, sky, sun, cloud, range, trees, meadow, tuft, flower, frame, shadow, cloudShadows, rise, pop, fall, pointer, coach, pollen, burst, glow, ripple, seeded,
    reset() { planes.length = 0; cv = null; parts = []; motes = []; [...coaches].forEach(c => c.stop()); document.querySelectorAll(".pointer").forEach(e => e.remove()); } };
})();
