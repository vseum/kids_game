"use strict";
/* Где рождается звук (махрадж): схема рта в разрезе, как в книгах по таджвиду — без лица, только то, что внутри.
   Язык — плавная кривая через 6 точек (кончик → корень), точки едут к позе буквы; губы смыкаются/округляются;
   место звука светится, воздух бежит изо рта или через нос. Общий модуль для детского курса и курса для взрослых.
   Mouth.create(host, ширина, inline) → { el, set(id), neutral(), show(id, sound), stop() } */
const Mouth = (() => {
  /* Позы языка: [кончик, лопатка, перед, середина, спинка, корень] в координатах viewBox 340×260 (губы слева, горло справа) */
  const P = {
    rest: [[70, 146], [86, 134], [110, 126], [150, 122], [192, 130], [222, 164]],
    t:    [[69, 106], [80, 104], [104, 114], [148, 120], [192, 130], [222, 164]],   // кончик к основанию верхних зубов
    n:    [[81, 97], [94, 101], [114, 112], [150, 120], [192, 130], [222, 164]],    // к дёснам
    r:    [[89, 95], [101, 101], [119, 111], [152, 120], [192, 130], [222, 164]],   // к передней части нёба
    l:    [[95, 93], [107, 95], [125, 103], [156, 116], [192, 130], [222, 164]],
    s:    [[64, 138], [78, 106], [102, 108], [148, 116], [192, 128], [222, 164]],   // кончик у нижних зубов, щель у верхних
    th:   [[54, 131], [70, 126], [98, 120], [148, 120], [192, 130], [222, 164]],    // кончик между зубами
    j:    [[72, 148], [90, 132], [118, 94], [158, 67], [196, 96], [222, 164]],      // середина к середине нёба
    sh:   [[72, 148], [90, 132], [118, 99], [158, 73], [196, 100], [222, 164]],
    y:    [[72, 148], [90, 132], [118, 101], [158, 77], [196, 102], [222, 164]],
    k:    [[72, 148], [88, 136], [112, 126], [156, 106], [197, 73], [224, 150]],    // спинка к нёбу
    q:    [[72, 148], [88, 138], [112, 130], [160, 114], [225, 95], [233, 140]],    // самая задняя часть — к язычку
    d:    [[70, 140], [90, 112], [122, 90], [154, 90], [198, 92], [224, 152]],      // край языка к коренным зубам
    w:    [[70, 146], [86, 136], [110, 128], [152, 118], [196, 102], [222, 160]]
  };
  const HEAVY_BACK = [198, 91];   // толстые буквы: спинка языка поднята к мягкому нёбу
  /* Буквы: поза, губы, где светится, куда идёт воздух (m — рот, n — нос), толстая ли */
  const LT = {
    alif: { p: "rest", spot: [246, 234], z: "lo" }, hamza: { p: "rest", spot: [246, 234], z: "lo" }, ha: { p: "rest", spot: [246, 234], z: "lo" },
    ain: { p: "rest", spot: [251, 186], z: "mid" }, hha: { p: "rest", spot: [251, 186], z: "mid" },
    ghain: { p: "rest", spot: [248, 136], z: "up", heavy: 1 }, kha: { p: "rest", spot: [248, 136], z: "up", heavy: 1 },
    qaf: { p: "q", spot: [229, 96], heavy: 1 }, kaf: { p: "k", spot: [197, 70] },
    jim: { p: "j", spot: [158, 64] }, shin: { p: "sh", spot: [158, 66] }, ya: { p: "y", spot: [158, 66] },
    dad: { p: "d", spot: [126, 84], heavy: 1, molar: 1 }, lam: { p: "l", spot: [96, 90] }, nun: { p: "n", spot: [83, 93], air: "n" },
    ra: { p: "r", spot: [90, 92], flap: 1 },
    ta: { p: "t", spot: [69, 103] }, dal: { p: "t", spot: [69, 103] }, tta: { p: "t", spot: [69, 103], heavy: 1 },
    sin: { p: "s", spot: [65, 131] }, zay: { p: "s", spot: [65, 131] }, sad: { p: "s", spot: [65, 131], heavy: 1 },
    tha: { p: "th", spot: [60, 128] }, dhal: { p: "th", spot: [60, 128] }, zza: { p: "th", spot: [60, 128], heavy: 1 },
    fa: { p: "rest", lips: "fa", spot: [61, 124] }, ba: { p: "rest", lips: "shut", spot: [32, 130] },
    mim: { p: "rest", lips: "shut", spot: [32, 130], air: "n" }, waw: { p: "w", lips: "round", spot: [26, 130] }
  };
  const LIPS = { open: ["0px,0px", "0px,0px"], shut: ["0px,10px", "0px,-10px"], round: ["-7px,7px", "-7px,-7px"], fa: ["0px,0px", "9px,-16px"] };
  const AIR = {
    m: "M246 252 C250 210 252 170 244 140 C236 112 214 104 186 100 C150 96 118 100 96 110 C74 120 50 128 4 130",
    n: "M246 252 C250 210 252 170 248 130 C246 96 244 74 232 60 C214 48 180 44 140 42 C100 40 62 44 4 50"
  };

  const css = `
.mouth { position: absolute; transform: translate(-50%, -50%); border-radius: 30px; overflow: hidden; z-index: 7;
  background: radial-gradient(120% 90% at 30% 20%, #FFF8EC, #F6E6CF); box-shadow: 0 0 0 4px #E8C77A, 0 0 0 7px rgba(255,255,255,.55), 0 26px 40px -18px rgba(0,0,0,.55); }
.mouth svg { display: block; width: 100%; height: 100%; }
.mouth .lip { transition: transform .45s cubic-bezier(.45,0,.2,1); }
.mouth .lbl { font: 700 10.5px Nunito, system-ui, sans-serif; fill: #9A5C52; letter-spacing: .02em; }
.mouth .lbl.w { fill: rgba(255,255,255,.9); }
.mouth .spot { transition: opacity .3s; }
.mouth .ring { transform-box: fill-box; transform-origin: center; }
.mouth .zone { fill: rgba(255,214,107,.0); transition: fill .4s; }
.mouth .zone.on { fill: rgba(255,214,107,.28); }
.mouth .molar { opacity: .28; transition: opacity .4s; }
.mouth .molar.on { opacity: .85; }
.mouth .heavy { opacity: 0; transition: opacity .4s; }
.mouth .heavy.on { opacity: 1; }
.mouth.inline { position: relative; transform: none; flex: none; }
.mx-book { max-width: min(92%, 460px); text-align: center;
  font: 600 clamp(13.5px, 1.25vw, 16px)/1.35 Nunito, system-ui, sans-serif; color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,.45); }
.mx-book b { color: #FFE29A; }
`;
  let cssDone = false;

  /* Кривая Катмулла — Рома через точки → безье */
  function smooth(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  const tonguePath = pts => smooth([[70, 162], ...pts, [232, 214]]) + " L214 218 Q150 208 96 184 Q76 172 70 162Z";

  function svg() {
    const molars = [104, 118, 132, 146].map(x => `<rect x="${x}" y="${(78 - (x - 104) * 0.12).toFixed(1)}" width="12" height="11" rx="3.5" fill="#FFFFFF" stroke="#E2D7C6" stroke-width="1"/>`).join("");
    return `<svg viewBox="0 0 340 260" aria-hidden="true">
<defs>
  <linearGradient id="mxT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7A0A6"/><stop offset=".55" stop-color="#E8707E"/><stop offset="1" stop-color="#C9566A"/></linearGradient>
  <linearGradient id="mxC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B3550"/><stop offset="1" stop-color="#3B2440"/></linearGradient>
  <linearGradient id="mxS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7CDBE"/><stop offset="1" stop-color="#EDB09F"/></linearGradient>
  <radialGradient id="mxG"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".45" stop-color="#FFD66B" stop-opacity=".95"/><stop offset="1" stop-color="#FFB938" stop-opacity="0"/></radialGradient>
  <linearGradient id="mxL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D96A72"/><stop offset="1" stop-color="#E98C8E"/></linearGradient>
</defs>
<rect x="22" y="0" width="318" height="260" fill="url(#mxS)"/>
<path d="M246 62 C224 48 186 42 140 40 C100 39 64 42 22 50 L22 58 C64 51 100 48 140 49 C184 51 220 56 238 70Z" fill="url(#mxC)" opacity=".8"/>
<path d="M28 118 L46 118 C56 119 62 114 68 104 C72 98 80 95 92 92 C112 78 134 66 158 64 C184 63 206 70 222 82 L232 92 C236 80 238 70 240 62 C252 74 258 92 261 120 C263 160 263 210 262 262 L232 262 C230 246 230 232 228 222 C222 214 214 212 204 210 C160 204 118 190 92 176 C80 170 72 162 66 152 C62 146 54 141 46 141 L28 141Z" fill="url(#mxC)"/>
<path d="M226 84 C233 90 238 100 239 112 C240 120 236 124 232 122 C228 120 228 108 226 98Z" fill="#E9A394"/>
<rect class="zone" data-z="up" x="238" y="118" width="26" height="36" rx="12"/>
<rect class="zone" data-z="mid" x="238" y="168" width="26" height="36" rx="12"/>
<rect class="zone" data-z="lo" x="236" y="216" width="28" height="36" rx="12"/>
<g class="molar">${molars}</g>
<path class="tongue" d="${tonguePath(P.rest)}" fill="url(#mxT)"/>
<path class="tline" d="" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/>
<path d="M228 222 C232 210 236 202 240 198 C240 206 236 216 232 224Z" fill="#E9A394"/>
<path d="M57 95 H69 C70 104 69 114 65 125 C61 126 58 124 56 121 C55 112 55 103 57 95Z" fill="#FFFFFF" stroke="#E2D7C6" stroke-width="1.2"/>
<path d="M59 166 H71 C72 158 71 148 67 138 C63 137 60 139 58 142 C57 150 57 158 59 166Z" fill="#FFFFFF" stroke="#E2D7C6" stroke-width="1.2"/>
<g class="air"></g>
<g class="lip up"><path d="M6 90 H50 C60 92 63 100 61 108 C59 117 52 121 44 121 C30 122 16 120 6 117Z" fill="url(#mxL)"/><path d="M14 112 C26 116 40 116 52 113" stroke="rgba(255,255,255,.4)" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g class="lip lo"><path d="M6 143 C18 139 32 139 46 140 C57 142 63 149 62 157 C61 166 54 172 46 172 H6Z" fill="url(#mxL)"/><path d="M14 148 C26 145 40 145 52 148" stroke="rgba(255,255,255,.4)" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g class="spot" opacity="0"><circle class="halo" r="22" fill="url(#mxG)"/><circle class="ring" r="9" fill="none" stroke="#FFE08A" stroke-width="2.5"/><circle r="4.5" fill="#FFF8DC"/></g>
<g class="heavy"><path d="M198 112 V96 M192 102 L198 95 L204 102" stroke="#FFE08A" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
<text class="lbl" x="108" y="62">нёбо</text><text class="lbl" x="64" y="90" text-anchor="middle">зубы</text>
<path d="M239 106 L266 66" stroke="#C98A7E" stroke-width="1.2"/><text class="lbl" x="262" y="60">язычок</text><text class="lbl" x="296" y="196" text-anchor="middle" transform="rotate(90 296 196)">горло</text>
<text class="lbl" x="150" y="34">нос</text><text class="lbl w" x="134" y="170">язык</text><text class="lbl" x="30" y="186" text-anchor="middle">губы</text>
</svg>`;
  }

  function create(host, w, inline) {
    if (!cssDone) { addCSS(css); cssDone = true; }
    const box = el("div", "mouth" + (inline ? " inline" : ""), host, svg());
    box.style.width = w + "px"; box.style.height = (w * 260 / 340) + "px";
    const $ = s => box.querySelector(s), $$ = s => [...box.querySelectorAll(s)];
    const tongue = $(".tongue"), tline = $(".tline"), spot = $(".spot"), ring = $(".ring"), upLip = $(".lip.up"), loLip = $(".lip.lo"), air = $(".air");
    let cur = P.rest.map(p => p.slice()), raf = 0, airT = 0, live = true, flapA = null;
    const draw = pts => { tongue.setAttribute("d", tonguePath(pts)); tline.setAttribute("d", smooth(pts.slice(1, 5).map(([x, y]) => [x + 2, y + 9]))); };
    const ease = t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    function tween(to, ms) {
      cancelAnimationFrame(raf);
      const from = cur.map(p => p.slice()), t0 = performance.now();
      return new Promise(res => {
        const f = t => {
          if (!live) return res();
          const k = Math.min(1, (t - t0) / ms), e = ease(k);
          cur = from.map((p, i) => [p[0] + (to[i][0] - p[0]) * e, p[1] + (to[i][1] - p[1]) * e]);
          draw(cur);
          if (k < 1) raf = requestAnimationFrame(f); else res();
        };
        raf = requestAnimationFrame(f);
      });
    }
    function poseOf(id) {
      const L = LT[id] || LT.alif, pts = P[L.p].map(p => p.slice());
      if (L.heavy && L.p !== "q" && L.p !== "d") { pts[4] = HEAVY_BACK.slice(); pts[3][1] -= 4; }
      return pts;
    }
    function lips(kind) { const [u, l] = LIPS[kind || "open"]; upLip.style.transform = `translate(${u})`; loLip.style.transform = `translate(${l})`; }
    function flow(kind) {
      clearInterval(airT); air.innerHTML = "";
      if (!kind || Art.reduced) return;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", AIR[kind]);
      const len = path.getTotalLength();
      airT = setInterval(() => {
        if (!live) return clearInterval(airT);
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("r", (2 + Math.random() * 1.8).toFixed(1)); c.setAttribute("fill", "rgba(200,236,255,.85)"); air.appendChild(c);
        const t0 = performance.now(), dur = 1500 + Math.random() * 400, jit = (Math.random() - 0.5) * 6;
        const f = t => {
          const k = (t - t0) / dur; if (k >= 1 || !live) return c.remove();
          const p = path.getPointAtLength(len * k); c.setAttribute("cx", p.x.toFixed(1)); c.setAttribute("cy", (p.y + jit).toFixed(1)); c.setAttribute("opacity", Math.min(1, (1 - k) * 2).toFixed(2));
          requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }, 110);
    }
    let ringA = null;
    function mark(id) {
      const L = LT[id] || LT.alif;
      spot.setAttribute("transform", `translate(${L.spot[0]} ${L.spot[1]})`); spot.setAttribute("opacity", "1");
      ringA && ringA.cancel();
      if (!Art.reduced) ringA = ring.animate([{ transform: "scale(.6)", opacity: 1 }, { transform: "scale(2.4)", opacity: 0 }], { duration: 1100, iterations: Infinity });
      $$(".zone").forEach(z => z.classList.toggle("on", z.dataset.z === L.z));
      $(".molar").classList.toggle("on", !!L.molar);
      $(".heavy").classList.toggle("on", !!L.heavy);
    }
    function unmark() { spot.setAttribute("opacity", "0"); ringA && ringA.cancel(); $$(".zone").forEach(z => z.classList.remove("on")); $(".heavy").classList.remove("on"); flow(null); }
    async function set(id, ms = 650) {
      const L = LT[id] || LT.alif;
      lips(L.lips); mark(id); flow(L.air || "m");
      await tween(poseOf(id), ms);
      if (L.flap && !Art.reduced) {   // Ро — кончик языка легко ударяет по нёбу
        const base = poseOf(id), down = base.map((p, i) => i < 2 ? [p[0], p[1] + 9] : p);
        for (let i = 0; i < 2 && live; i++) { await tween(down, 110); await tween(base, 110); }
      }
    }
    async function neutral(ms = 500) { lips("open"); unmark(); await tween(P.rest, ms); }
    /* Показ буквы: язык встаёт на место, звучит слог, место светится; дважды */
    async function show(id, sound) {
      for (let i = 0; i < 2 && live; i++) {
        await set(id, i ? 380 : 700);
        await Promise.all([sound ? sound() : sleep(900), sleep(900)]);
        if (i === 0) { await neutral(380); await sleep(250); }
      }
    }
    draw(cur);
    return { el: box, set, neutral, show, stop() { live = false; cancelAnimationFrame(raf); clearInterval(airT); ringA && ringA.cancel(); } };
  }
  return { create, LT };
})();
