"use strict";
/* ============ РИСУНКИ ============ */
const ART = {
  bird: `<svg viewBox="0 0 100 60" aria-hidden="true">
    <path class="wing l" d="M44 30 Q30 4 10 6 Q24 22 40 34Z" fill="#2E6F8E"/>
    <path d="M30 34 L10 26 L13 42 Z" fill="#2E6F8E"/>
    <ellipse cx="52" cy="35" rx="22" ry="11" fill="#3E8FB0"/>
    <ellipse cx="54" cy="39" rx="14" ry="5" fill="#DFF3FB" opacity=".75"/>
    <circle cx="72" cy="28" r="9" fill="#3E8FB0"/>
    <circle cx="75" cy="26" r="2.2" fill="#12394A"/>
    <path d="M80 27 L91 30 L80 33Z" fill="#F2B705"/>
    <path class="wing r" d="M50 31 Q60 2 82 0 Q72 18 60 35Z" fill="#5BA9C9"/></svg>`,
  paper: `<svg viewBox="0 0 100 70" aria-hidden="true">
    <path d="M8 44 L52 34 L46 50Z" fill="#EEF3F5" stroke="#B9C7CD" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M46 50 L52 34 L92 26 L62 50Z" fill="#FFFFFF" stroke="#B9C7CD" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M30 40 L54 6 L54 38Z" fill="#E3EAEE" stroke="#B9C7CD" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 40 L66 12 L58 38Z" fill="#FFFFFF" stroke="#B9C7CD" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  balloon: `<svg viewBox="0 0 60 130" aria-hidden="true">
    <path d="M30 66 Q22 86 30 100 Q38 114 30 130" stroke="#12394A" stroke-width="1.6" fill="none"/>
    <ellipse cx="30" cy="32" rx="25" ry="31" fill="#FF6F61"/>
    <ellipse cx="21" cy="21" rx="6" ry="10" fill="#fff" opacity=".45"/>
    <path d="M26 62 L34 62 L30 68Z" fill="#E0554A"/></svg>`,
  fan: `<svg viewBox="0 0 100 80" aria-hidden="true">
    <path d="M50 76 L4 32 A64 64 0 0 1 96 32 Z" fill="#FF8A65"/>
    <g stroke="#E5684A" stroke-width="2">${[-60, -40, -20, 0, 20, 40, 60].map(a => { const r = Math.PI * (a - 90) / 180; return `<line x1="50" y1="76" x2="${(50 + 64 * Math.cos(r)).toFixed(1)}" y2="${(76 + 64 * Math.sin(r)).toFixed(1)}"/>`; }).join("")}</g>
    <path d="M14 26 A60 60 0 0 1 86 26" stroke="#FFD54F" stroke-width="5" fill="none"/>
    <circle cx="50" cy="74" r="6" fill="#8A5A36"/></svg>`,
  flower: c => `<svg viewBox="0 0 60 110" aria-hidden="true">
    <path d="M30 40 Q28 75 30 110" stroke="#4E9A3E" stroke-width="5" fill="none"/>
    <path d="M30 80 Q12 70 8 78 Q18 90 30 84Z" fill="#6BBF59"/><path d="M30 92 Q48 82 52 90 Q42 102 30 96Z" fill="#6BBF59"/>
    ${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${(30 + 13 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(30 + 13 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="10" fill="${c}"/>`).join("")}
    <circle cx="30" cy="30" r="9" fill="#FFC107"/></svg>`,
  jar: `<svg viewBox="0 0 80 100" aria-hidden="true">
    <rect x="12" y="20" width="56" height="74" rx="14" fill="rgba(255,255,255,.45)" stroke="#9FB7C0" stroke-width="3"/>
    <clipPath id="jarclip"><rect x="14" y="22" width="52" height="70" rx="12"/></clipPath>
    <rect id="liq" clip-path="url(#jarclip)" x="10" y="94" width="60" height="0" fill="#FFE9A8" opacity=".85"/>
    <rect x="16" y="10" width="48" height="12" rx="4" fill="#C9A26B"/>
    <g id="spoon"><path d="M56 4 L40 70" stroke="#A7B3B8" stroke-width="4" stroke-linecap="round"/><ellipse cx="39" cy="74" rx="6" ry="9" fill="#A7B3B8"/></g></svg>`,
  fire: `<svg viewBox="0 0 80 70" aria-hidden="true">
    <g class="flames" opacity="0"><path class="flame" d="M40 8 Q58 30 50 50 Q40 60 30 50 Q22 30 40 8Z" fill="#FF8A3D"/><path class="flame" d="M40 24 Q50 38 46 50 Q40 56 34 50 Q30 38 40 24Z" fill="#FFD54F"/></g>
    <rect x="8" y="50" width="64" height="10" rx="5" fill="#8A5A36" transform="rotate(-12 40 55)"/>
    <rect x="8" y="50" width="64" height="10" rx="5" fill="#6E4428" transform="rotate(12 40 55)"/></svg>`,
  bee: `<svg viewBox="0 0 64 50" aria-hidden="true">
    <ellipse class="bw" cx="26" cy="14" rx="10" ry="12" fill="#E3F4FF" opacity=".9"/>
    <ellipse class="bw" cx="38" cy="15" rx="9" ry="11" fill="#E3F4FF" opacity=".9"/>
    <path d="M10 33 L3 33" stroke="#3B2A14" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="31" cy="33" rx="21" ry="13" fill="#FFC107"/>
    <path d="M25 21 V45 M35 21 V45" stroke="#3B2A14" stroke-width="5"/>
    <circle cx="52" cy="30" r="9" fill="#3B2A14"/><circle cx="55" cy="27" r="2.4" fill="#fff"/>
    <path d="M54 22 Q58 12 62 12 M50 22 Q50 12 46 10" stroke="#3B2A14" stroke-width="2" fill="none"/></svg>`,
  hive: `<svg viewBox="0 0 100 120" aria-hidden="true">
    <path d="M0 8 Q50 0 100 10" stroke="#6E4428" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M50 8 V20" stroke="#6E4428" stroke-width="4"/>
    ${[[50, 30, 18], [50, 46, 28], [50, 64, 36], [50, 82, 38], [50, 100, 32]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="11" fill="#E0A63B" stroke="#B9822A" stroke-width="2"/>`).join("")}
    <ellipse cx="50" cy="96" rx="9" ry="7" fill="#5A3A14"/></svg>`,
  ship: `<svg viewBox="0 0 160 160" aria-hidden="true">
    <path d="M83 16 L104 10 L83 4Z" fill="#FF8A65"/>
    <rect x="79" y="4" width="5" height="108" rx="2" fill="#5D3B22"/>
    <path class="sail-full" d="M84 18 Q150 58 84 104 Z" fill="#FFFDF6" stroke="#D9CBA8" stroke-width="2"/>
    <path class="sail-full" d="M78 26 Q40 66 78 100 Z" fill="#F4EEDD" stroke="#D9CBA8" stroke-width="2"/>
    <path class="sail-slack" d="M84 18 Q92 60 86 104 L84 104 Z" fill="#FFFDF6" stroke="#D9CBA8" stroke-width="2"/>
    <path class="sail-slack" d="M78 26 Q72 66 78 100 Z" fill="#F4EEDD" stroke="#D9CBA8" stroke-width="2"/>
    <path d="M12 110 L148 110 L128 140 L32 140 Z" fill="#8A5A36"/>
    <path d="M18 118 L142 118" stroke="#FFD54F" stroke-width="4"/>
    <circle cx="56" cy="128" r="4" fill="#5D3B22"/><circle cx="80" cy="128" r="4" fill="#5D3B22"/><circle cx="104" cy="128" r="4" fill="#5D3B22"/></svg>`,
  efan: `<svg viewBox="0 0 100 140" aria-hidden="true">
    <rect x="46" y="70" width="8" height="52" fill="#9FB7C0"/>
    <rect x="22" y="118" width="56" height="16" rx="8" fill="#5E7F8B"/>
    <circle cx="64" cy="126" r="5" fill="#E57373"/>
    <circle cx="50" cy="46" r="40" fill="rgba(255,255,255,.35)" stroke="#9FB7C0" stroke-width="4"/>
    <g class="fanblades">${[0, 120, 240].map(a => `<ellipse cx="50" cy="26" rx="10" ry="19" fill="#4FB3D9" transform="rotate(${a} 50 46)"/>`).join("")}</g>
    <circle cx="50" cy="46" r="7" fill="#5E7F8B"/></svg>`
};
function honeycombSvg(cols, rows) {
  const r = 10, w = Math.sqrt(3) * r, cells = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const cx = 12 + i * w + (j % 2) * w / 2, cy = 12 + j * r * 1.5;
    const pts = [0, 1, 2, 3, 4, 5].map(k => { const a = Math.PI / 180 * (60 * k - 30); return (cx + r * 0.94 * Math.cos(a)).toFixed(1) + "," + (cy + r * 0.94 * Math.sin(a)).toFixed(1); }).join(" ");
    cells.push(`<polygon class="honeycell" points="${pts}" fill="#F7E7B4" stroke="#C9952E" stroke-width="1.6"/>`);
  }
  return `<svg viewBox="0 0 ${(24 + (cols - 0.5) * w).toFixed(0)} ${(24 + (rows - 1) * r * 1.5).toFixed(0)}" aria-hidden="true">${cells.join("")}</svg>`;
}

/* Сокровища за главы */
const ITEMS = [
  { id: "feather", name: "Перо", svg: '<path d="M22 84 Q28 40 78 12 Q74 52 34 80Z" fill="#5BA9C9"/><path d="M30 76 Q44 44 72 20" stroke="#DFF3FB" stroke-width="3" fill="none"/><path d="M16 92 L40 62" stroke="#2E6F8E" stroke-width="4" stroke-linecap="round"/>' },
  { id: "honey", name: "Соты с мёдом", svg: '<g transform="translate(16 22)">' + honeycombSvg(3, 3).replace(/^<svg[^>]*>|<\/svg>$/g, "").replace(/#F7E7B4/g, "#F2B705") + "</g>" },
  { id: "shell", name: "Ракушка", svg: '<path d="M50 88 L14 46 Q50 2 86 46Z" fill="#FFB199"/><g stroke="#E5866D" stroke-width="3" fill="none"><path d="M50 88 L28 30"/><path d="M50 88 L40 20"/><path d="M50 88 L60 20"/><path d="M50 88 L72 30"/></g><rect x="40" y="84" width="20" height="10" rx="4" fill="#E5866D"/>' }
];

/* ============ ДЕКОРАЦИИ ============ */
function sky(bg) { const s = el("div", "sky"); s.style.background = bg; return s; }
function sunAt(x, y) { const s = el("div", "sunball"); s.style.left = (x - 45) + "px"; s.style.top = (y - 45) + "px"; return s; }
function clouds(n, top = 0.18, bottom = 0.5) {
  const { H } = size();
  for (let i = 0; i < n; i++) {
    const c = el("div", "cloud"); c.style.top = (H * rnd(top, bottom)) + "px"; c.style.scale = rnd(0.6, 1.1).toFixed(2);
    c.style.animationDuration = rnd(40, 70) + "s"; c.style.animationDelay = (-rnd(0, 60)) + "s";
  }
}
function hills(c1, c2, h = 0.26) {
  const g = el("div", "ground", stage, `<svg viewBox="0 0 400 120" preserveAspectRatio="none" style="width:100%;height:100%;display:block">
    <path d="M0 40 Q80 0 170 30 T400 26 V120 H0Z" fill="${c2}"/><path d="M0 64 Q120 30 230 56 T400 50 V120 H0Z" fill="${c1}"/></svg>`);
  g.style.height = (h * 100) + "%";
  return g;
}
function puffs(x, y, n = 5, dx = 60) {
  for (let i = 0; i < n; i++) {
    const p = el("div", "puff"); p.style.left = x + "px"; p.style.top = y + "px";
    p.animate([{ transform: "translate(0,0) scale(.6)", opacity: .9 }, { transform: `translate(${dx + rnd(-15, 25)}px, ${rnd(-25, 25)}px) scale(1.4)`, opacity: 0 }], { duration: rnd(500, 900), easing: "ease-out" }).onfinish = () => p.remove();
  }
}
/* Название главы: звучит и уходит само */
async function title(id) { const p = cue(id); await p; await sleep(400); }

/* ============ ВСТУПЛЕНИЕ ============ */
async function chIntro() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#9AD7F2 0%,#D8F0FA 70%,#F4FBFE 100%)");
  const { W, H } = size(); sunAt(W * 0.78, H * 0.32); clouds(3); hills("#8ACF77", "#6BBF59");
  Snd.amb("meadow", 0.7); fromDark(); await sleep(500);
  await say("intro1");
  await say("intro2");
  await say("intro3", { btn: "Бисмиллях" });
}

/* ============ ГЛАВА 1: ПТИЦА В НЕБЕ ============ */
/* Полёт по простой физике: подброс вверх с силой k (0..1) или падение с места, если k = 0 */
function flight(e, groundY, k) {
  const { W, H } = size();
  return new Promise(res => {
    const g = H * 2.0, top = e._y - k * (groundY - H * 0.3);
    let x = e._x, y = e._y, vy = k ? -Math.sqrt(2 * g * Math.max(10, e._y - top)) : 0, vx = rnd(-70, 70), t0 = performance.now(), last = t0;
    if (k) Snd.whoosh(0.15 + 0.2 * k);
    let fell = false;
    const step = t => {
      const dt = Math.min(0.04, (t - last) / 1000); last = t;
      vy += g * dt * (vy > 0 ? 0.55 : 1);
      x = Math.max(50, Math.min(W - 50, x + vx * dt)); y += vy * dt;
      if (vy > 0 && !fell) { fell = true; Snd.fall(); }
      const wob = vy > 0 ? Math.sin((t - t0) / 90) * 14 : 0;
      e.style.transform = `rotate(${(vy * 0.03 + wob).toFixed(1)}deg)`;
      put(e, x + (vy > 0 ? Math.sin((t - t0) / 160) * 10 : 0), y);
      if (y >= groundY && vy > 0) { put(e, x, groundY); e.style.transform = "rotate(8deg)"; Snd.thud(0.35); return res(); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
/* Ждём, пока ребёнок смахнёт птичку вверх. Сила броска зависит от длины движения пальцем */
function swipeUp(e, timeout = 15000) {
  return new Promise(res => {
    let start = null, fin = false; e.classList.add("hint", "tapme");
    const done = k => { if (fin) return; fin = true; e.classList.remove("hint", "tapme"); e.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); res(k); };
    const down = ev => { ev.preventDefault(); start = local(ev); };
    const up = ev => { if (!start) return; const p = local(ev), dy = start.y - p.y; start = null; done(Math.max(0.35, Math.min(1, dy / (size().H * 0.3)))); };
    e.addEventListener("pointerdown", down); window.addEventListener("pointerup", up);
    setTimeout(() => done(0.6), timeout);
  });
}
async function chBird() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#7EC8EE 0%,#BFE6F7 60%,#E8F7FC 100%)");
  const { W, H } = size(); sunAt(W * 0.82, H * 0.3); clouds(3); hills("#7CC36A", "#5DAA4E");
  const groundY = H * 0.84;
  Snd.amb("meadow"); fromDark(); await sleep(400);
  await title("b0");

  const live = obj("bird", ART.bird, -90, H * 0.42, 150, 90);
  Snd.chirp(); move(live, W + 90, H * 0.36, 6500, "linear");
  await say("b1");

  const pb = obj("paper", ART.paper, W * 0.5, groundY, 96, 67);
  pb.style.zIndex = 5;
  for (let i = 1; i <= 3; i++) {
    cue(i === 1 ? "b2" : i === 2 ? "b3" : "b4");
    const k = await swipeUp(pb);
    capNote.textContent = `Попытка ${i} из 3`;
    await flight(pb, groundY, k);
    await sleep(300);
  }
  await say("b5");

  /* помощник 1: шарик */
  const bal = obj("balloon", ART.balloon, pb._x, groundY - 95, 56, 122);
  bal.style.zIndex = 4;
  cue("b6"); await tapOnce(bal);
  pb.style.transform = "rotate(0deg)";
  const riseY = H * 0.38;
  Snd.whoosh(0.15);
  await Promise.all([move(bal, pb._x, riseY - 95, 2600, "ease-out"), move(pb, pb._x, riseY, 2600, "ease-out")]);
  await sleep(300);
  Snd.pop(); puffs(bal._x, bal._y - 25, 8, 0); bal.remove();
  await flight(pb, groundY, 0);
  await say("b7");

  /* помощник 2: веер */
  const fan = obj("fan", ART.fan, W * 0.2, groundY - 30, 100, 80);
  fan.style.zIndex = 6;
  cue("b8");
  let busy = null;
  await taps(fan, 5, () => {
    Snd.whoosh(0.25); puffs(fan._x + 40, fan._y - 20, 4, pb._x - fan._x);
    if (!busy) busy = flight(pb, groundY, 0.28).then(() => { busy = null; });
  });
  if (busy) await busy;
  await say("b9");

  /* живая птица парит, раскрывает и складывает крылья */
  live.classList.add("glide"); live.style.transform = "scaleX(-1)"; put(live, W + 90, H * 0.3);
  Snd.chirp(); move(live, -90, H * 0.34, 9000, "linear");
  await say("b10");
  const misses = await choice("bq", [{ id: "bqa", icon: "🌬️" }, { id: "bqc", icon: "الله", ar: true, ok: true }, { id: "bqb", icon: "🐦" }], "bq_ok");
  await say("b_quran");
  await ayahCard("67:19");
  await say("b_end", { btn: "Субханаллах" });
  hideCap(); await award("feather");
  return misses;
}

/* ============ ГЛАВА 2: ПЧЕЛА И МЁД ============ */
async function chBee() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#A6DCF2 0%,#DDF1F8 65%,#F6FBF2 100%)");
  const { W, H } = size(); sunAt(W * 0.15, H * 0.3); clouds(2); hills("#8ACF77", "#6BBF59", 0.3);
  const groundY = H * 0.8;
  Snd.amb("meadow"); fromDark(); await sleep(400);
  await title("e0");
  await say("e1");

  const colors = ["#FF8A65", "#BA68C8", "#F06292"];
  const flowers = [0.16, 0.36, 0.56].map((fx, i) => obj("flower", ART.flower(colors[i]), W * fx, groundY - 38, 58, 106));
  const jar = obj("jar", ART.jar, W * 0.8, groundY - 30, 78, 98);
  const liq = jar.querySelector("#liq"), spoon = jar.querySelector("#spoon");
  let level = 0;
  const setLevel = v => { level = v; liq.setAttribute("y", (94 - v).toFixed(0)); liq.setAttribute("height", v.toFixed(0)); };

  cue("e2");
  for (const f of flowers) {
    await tapOnce(f);
    const d = el("div", "drop"); put(d, f._x, f._y - 30);
    Snd.tap();
    await move(d, jar._x, jar._y - 20, 700, "ease-in");
    d.remove(); Snd.splash(); setLevel(level + 14);
  }
  cue("e3");
  spoon.style.transformOrigin = "40px 70px";
  await taps(jar, 4, () => {
    Snd.splash();
    spoon.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-14deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(0deg)" }], { duration: 450 });
  });
  await say("e4");

  const fire = obj("fire", ART.fire, jar._x, groundY + 22, 70, 62);
  await move(jar, jar._x, groundY - 50, 400);
  cue("e5"); await tapOnce(fire);
  fire.querySelector(".flames").setAttribute("opacity", "1");
  for (let i = 0; i < 10; i++) {
    Snd.noise({ type: "highpass", f: rnd(1800, 4000), dur: 0.02, gain: rnd(0.08, 0.2), attack: 0.001, at: i * rnd(0.15, 0.3) });
    const s = el("div", "steam"); put(s, jar._x + rnd(-15, 15), jar._y - 50);
    s.animate([{ transform: "translateY(0) scale(.6)", opacity: .8 }, { transform: "translateY(-60px) scale(1.6)", opacity: 0 }], { duration: 1400, delay: i * 220 }).onfinish = () => s.remove();
  }
  await sleep(1500);
  await say("e6");
  await say("e7", { btn: "Смотрю" });
  hideCap();
  jar.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" }); fire.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });

  /* пчела летает по цветам и несёт сок в улей */
  const hive = obj("hive", ART.hive, W * 0.82, H * 0.4, 100, 120);
  const bee = obj("bee", ART.bee, -40, H * 0.45, 60, 47);
  bee.style.zIndex = 6;
  await sleep(500);
  cue("e8"); Snd.buzz(10, 0.05);
  for (const f of flowers) { await move(bee, f._x + 6, f._y - 62, 1300, "ease-in-out"); await sleep(500); }
  await move(bee, hive._x, hive._y + 20, 1800, "ease-in-out");
  bee.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
  await sleep(800);

  const comb = obj("comb", honeycombSvg(6, 5), W * 0.5, H * 0.58, Math.min(W * 0.8, 320), Math.min(W * 0.8, 320) * 0.72);
  comb.style.zIndex = 7; comb.animate([{ opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: "scale(1)" }], { duration: 500 });
  const cells = [...comb.querySelectorAll(".honeycell")];
  for (let i = 0; i < cells.length; i++) { await sleep(70); cells[i].setAttribute("fill", "#F2B705"); if (i % 4 === 0) Snd.sparkle(); }
  await say("e9");
  const misses = await choice("eq", [{ id: "eqc", icon: "الله", ar: true, ok: true }, { id: "eqa", icon: "🌸" }, { id: "eqb", icon: "👨‍👩‍👧" }], "eq_ok");
  await say("e_quran");
  await ayahCard("16:68-69");
  await say("e_end", { btn: "Альхамдулиллях" });
  hideCap(); await award("honey");
  return misses;
}

/* ============ ГЛАВА 3: КОРАБЛЬ И ВЕТЕР ============ */
function windLines(n, top, bottom) {
  const { W, H } = size();
  for (let i = 0; i < n; i++) {
    const w = el("div", "windline"); w.style.top = (H * rnd(top, bottom)) + "px"; w.style.left = "0px"; w.style.width = rnd(40, 110) + "px";
    w.style.animationDelay = (i * rnd(0.08, 0.2)) + "s"; w.style.animationDuration = rnd(0.9, 1.4) + "s";
    setTimeout(() => w.remove(), 2500 + i * 200);
  }
}
async function chShip() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#86CFF0 0%,#CDEBF7 70%,#EAF7FC 100%)");
  const { W, H } = size(); sunAt(W * 0.8, H * 0.28); clouds(3, 0.16, 0.4);
  const seaTop = H * 0.58;
  el("div", "sea", stage, `<svg class="wave" viewBox="0 0 800 40" preserveAspectRatio="none" style="top:-20px"><path d="M0 20 ${Array.from({ length: 16 }, (_, i) => `Q${i * 50 + 25} ${i % 2 ? 34 : 6} ${i * 50 + 50} 20`).join(" ")} V40 H0Z" fill="#4FB3D9"/></svg>
    <svg class="wave w2" viewBox="0 0 800 40" preserveAspectRatio="none" style="top:20%"><path d="M0 20 ${Array.from({ length: 16 }, (_, i) => `Q${i * 50 + 25} ${i % 2 ? 6 : 34} ${i * 50 + 50} 20`).join(" ")} V40 H0Z" fill="#3A9CC6"/></svg>`);
  const sz = Math.min(W * 0.48, 210);
  const ship = obj("ship", `<div class="bob" style="width:100%;height:100%">${ART.ship}</div>`, -sz, seaTop - sz * 0.22, sz, sz);
  ship.style.zIndex = 5;
  Snd.amb("sea"); fromDark(); await sleep(400);
  await title("s0");

  Snd.gust(4); windLines(10, 0.2, 0.55);
  const sail = move(ship, W * 0.6, ship._y, 4200, "ease-out");
  await say("s1"); await sail;

  ship.classList.add("slack");
  await say("s2");

  cue("s3");
  await taps(ship, 4, () => {
    Snd.whoosh(0.12); puffs(ship._x - sz * 0.3, ship._y - sz * 0.1, 3, 30);
    ship.animate([{ translate: "-50% -50%" }, { translate: "calc(-50% + 6px) -50%" }, { translate: "-50% -50%" }], { duration: 500 });
  });
  await say("s4");

  const fan = obj("fan", ART.fan, W * 0.2, seaTop - 70, 90, 72);
  fan.style.zIndex = 6; fan.style.rotate = "70deg";
  cue("s5");
  await taps(fan, 5, () => { Snd.whoosh(0.2); puffs(fan._x + 30, fan._y, 4, ship._x - fan._x - 60); });
  ship.animate([{ rotate: "0deg" }, { rotate: "1.5deg" }, { rotate: "0deg" }], { duration: 600 });
  await say("s6");
  fan.remove();

  const efan = obj("efan", ART.efan, W * 0.18, seaTop - 40, 92, 129);
  efan.style.zIndex = 6;
  const blades = efan.querySelector(".fanblades");
  cue("s7"); await tapOnce(efan);
  blades.classList.add("spin"); Snd.hum(4.5);
  const blow = setInterval(() => puffs(efan._x + 40, efan._y - 18, 2, ship._x - efan._x - 70), 300);
  ship.animate([{ translate: "-50% -50%" }, { translate: "calc(-50% + 4px) -50%" }, { translate: "-50% -50%" }], { duration: 900, iterations: 2 });
  await sleep(2600); blades.classList.replace("spin", "slow"); await sleep(1600);
  clearInterval(blow); blades.classList.remove("slow");
  await say("s8");
  efan.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" });

  await say("s9", { btn: "Попросить Аллаха" });
  hideCap(); await sleep(600);
  Snd.gust(5); windLines(18, 0.18, 0.6);
  await sleep(500); ship.classList.remove("slack");
  const go = move(ship, W + sz, ship._y, 5200, "ease-in");
  setTimeout(() => windLines(14, 0.18, 0.6), 1500);
  await say("s10"); await go;

  const misses = await choice("sq", [{ id: "sqa", icon: "⛵" }, { id: "sqb", icon: "🌀" }, { id: "sqc", icon: "الله", ar: true, ok: true }], "sq_ok");
  await say("s_quran");
  await ayahCard("42:32-33");
  await say("s_end");
  hideCap(); await award("shell");
  return misses;
}

/* ============ ФИНАЛ ============ */
async function chFinal() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#F6C28B 0%,#FBE3C2 55%,#FFF6E6 100%)");
  const { W, H } = size(); sunAt(W * 0.5, H * 0.62); hills("#8ACF77", "#6BBF59", 0.28);
  el("div", "items-row", stage, ITEMS.filter(i => Save.d.items.includes(i.id)).map(i => `<svg viewBox="0 0 100 100" aria-hidden="true">${i.svg}</svg>`).join(""));
  Snd.amb("meadow", 0.6); fromDark(); await sleep(500);
  celebrate();
  await say("fin1");
  await say("fin2");
  await say("fin3", { btn: "В меню" });
  hideCap();
}

/* ============ ГЛАВЫ И МИРЫ ============ */
const CHAPTERS = [
  { id: "bird", name: "Птица в небе", fn: chBird },
  { id: "bee", name: "Пчела и мёд", fn: chBee },
  { id: "ship", name: "Корабль и ветер", fn: chShip }
];
/* Главы, которых ещё нет, записаны просто названием и показываются как "скоро" */
const WORLDS = [
  { t: "Мир 1. Кто всё создал?", s: "Знамения Аллаха вокруг нас", ch: ["bird", "bee", "ship", "Молоко", "Разные плоды", "Верблюд", "Сон"] },
  { t: "Мир 2. Только Аллаху", s: "Кому поклоняться и у кого просить помощи", ch: ["Юнус в ките", "Дуа", "Аллах слышит всех", "Никто, кроме Аллаха"] },
  { t: "Мир 3. Во что верит мусульманин", s: "Шесть столпов веры", ch: ["Ангелы", "Книги", "Пророки", "Судный день", "Предопределение"] },
  { t: "Мир 4. Как живёт мусульманин", s: "Пять столпов ислама и каждый день", ch: ["Шахада", "Омовение", "Намаз", "Пост", "Закят", "Хадж"] },
  { t: "Мир 5. Сокровища Корана", s: "Смысл коротких сур", ch: ["Аль-Фатиха", "Аль-Ихлас", "Аль-Фаляк", "Ан-Нас"] }
];

/* ============ ЗАПУСК ============ */
let running = false;
function nextUndone() { const k = CHAPTERS.findIndex(c => !Save.d.done[c.id]); return k < 0 ? null : k; }
async function play(from, withIntro) {
  running = true; unlockAudio();
  $("#start").classList.add("off");
  if (withIntro) await chIntro();
  for (let k = from; k < CHAPTERS.length; k++) {
    const c = CHAPTERS[k];
    const misses = await c.fn();
    const st = misses === 0 ? 3 : misses === 1 ? 2 : 1;
    Save.d.done[c.id] = Math.max(Save.d.done[c.id] || 0, st); Save.save();
    await starsToast(st);
  }
  await chFinal();
  showStart();
}
function showStart() {
  running = false; hideCap(); clearStage(); fromDark();
  const any = Object.keys(Save.d.done).length > 0;
  $("#goCont").hidden = !any || nextUndone() == null;
  $("#go").textContent = any ? "Начать сначала" : "Начать";
  $("#go").classList.toggle("ghost", any && nextUndone() != null);
  $("#start").classList.remove("off");
}
async function pickChapter() {
  const k = await chaptersSheet();
  if (k == null) return;
  if (running) { try { sessionStorage.setItem("ayaty_jump", k); } catch (e) {} location.reload(); return; }
  play(k, false);
}

Save.load(); updateBag(false); Voice.load();
showStart();
$("#go").onclick = () => { Snd.tap(); play(0, true); };
$("#goCont").onclick = () => { Snd.tap(); const k = nextUndone(); if (k != null) play(k, false); };
$("#goCh").onclick = () => { Snd.tap(); pickChapter(); };
$("#tHome").onclick = () => { Snd.tap(); pickChapter(); };
$("#tBag").onclick = () => { Snd.tap(); bagSheet(); };
$("#tVoice").onclick = e => { Voice.on = !Voice.on; e.currentTarget.setAttribute("aria-pressed", Voice.on); if (!Voice.on) Voice.stop(); };
$("#tSfx").onclick = e => { Snd.setOn(!Snd.on); e.currentTarget.setAttribute("aria-pressed", Snd.on); };
/* После выбора главы во время игры страница перезагружается: предлагаем сразу сыграть выбранную главу */
(() => {
  let j = null; try { j = sessionStorage.getItem("ayaty_jump"); sessionStorage.removeItem("ayaty_jump"); } catch (e) {}
  if (j == null || !CHAPTERS[+j]) return;
  const b = el("button", "btn big", null, "Играть: " + CHAPTERS[+j].name);
  $(".sbtns").prepend(b);
  b.onclick = () => { Snd.tap(); play(+j, false); };
})();
