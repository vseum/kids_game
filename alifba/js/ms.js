"use strict";
/* «Учусь читать» по «Муаллим сани» (Ахмадхади Максуди): урок = страница книги 10–25.
   Урок: буква → где рождается звук (схема рта, mouth.js) → обвести → строчки упражнений из книги
   (первую слушаем, потом каждую читаем сами и проверяем нажатием) → проверка на слух.
   Данные — ms_data.js (общие с будущим курсом для взрослых), звук строк — ms_audio.js (tools/ms_audio.py). */

addCSS(`
.lavh { position: absolute; left: 0; right: 0; margin: 0 auto; z-index: 6; width: min(94%, 760px); box-sizing: border-box; padding: 14px 14px 18px; border-radius: 28px 28px 18px 18px;
  background: repeating-linear-gradient(93deg, transparent 0 22px, rgba(110,62,24,.08) 22px 24px, transparent 24px 52px), linear-gradient(180deg, #DDAE70, #C38A4C 58%, #A9713A);
  box-shadow: inset 0 2px 0 rgba(255,240,210,.65), inset 0 -5px 0 rgba(88,48,18,.35), 0 26px 36px -18px rgba(0,0,0,.6); }
.lavh::before { content: ""; position: absolute; left: 50%; top: 5px; width: 18px; height: 5px; margin-left: -9px; border-radius: 4px; background: rgba(88,48,18,.35); }
.lavh .page { display: flex; flex-wrap: wrap; direction: rtl; justify-content: center; align-content: center; gap: 10px 8px; padding: 14px 10px; border-radius: 16px;
  background: linear-gradient(180deg, #FFFCF2, #FAEFD6); box-shadow: inset 0 0 0 1px rgba(160,110,50,.25), inset 0 10px 18px -14px rgba(120,80,30,.4); }
.ms-it { display: grid; place-items: center; min-width: max(54px, 1.25em); min-height: 58px; padding: 0 .3em; border-radius: 14px; direction: rtl; cursor: pointer;
  font-family: "Amiri", serif; font-weight: 700; color: #22313F; line-height: 1.55; background: #FFFFFF;
  box-shadow: 0 3px 0 #E4D3AE, 0 8px 14px -10px rgba(0,0,0,.35); transition: transform .12s, box-shadow .2s, background .25s; user-select: none; -webkit-user-select: none; }
.ms-it span { transform: translateY(5%); }
.ms-it:active { transform: scale(.93); }
.ms-it.now { background: #FFF1BE; box-shadow: 0 3px 0 #E8C35C, 0 0 0 4px rgba(245,196,81,.8); transform: translateY(-3px); }
.ms-it.done { background: #EEF8F0; box-shadow: 0 3px 0 #ADD9BE; }
.ms-it.ok { background: #DCF2E3; box-shadow: 0 3px 0 #8FCFA8, 0 0 0 4px rgba(70,185,122,.65); }
.ms-it.no { animation: shake .42s; opacity: .55; }
.ms-it.hl { box-shadow: 0 3px 0 #E8C35C, 0 0 0 5px rgba(245,196,81,.9); }
.ms-pair { position: absolute; transform: translate(-50%, -50%); z-index: 7; display: flex; gap: 18px; direction: rtl; align-items: center; }
.ms-pair .al-glyph { position: static; }
.mx-book .mxl { font-family: "Amiri", serif; font-size: 2em; vertical-align: middle; margin-left: 6px; }
.ms-bar { height: 8px; border-radius: 4px; background: linear-gradient(90deg, #F5C451, #FFE7A0); transform-origin: right center; box-shadow: 0 0 12px rgba(255,214,107,.7); }
`);

/* Небо уроков: три времени суток по кругу */
const MS_PAL = [
  { sky: ["#2F86CF", "#7EC2EC", "#D9EEF7"], far: ["#94B1CF", "#C8DAEA"], mid: ["#7FB873", "#AED6A0"], rim: "#FFF3C8", snow: true },
  { sky: ["#3778C2", "#94C8EA", "#F4EAD2"], far: ["#A6B5CE", "#D5DCE8"], mid: ["#8CBF6C", "#B9DA96"], rim: "#FFF0C0", snow: false },
  { sky: ["#3C5EA6", "#D99A84", "#F7D7A2"], far: ["#8C87AC", "#C5B3C4"], mid: ["#6D9E67", "#A7C88A"], rim: "#FFD9A0", snow: true, haze: "rgba(255,206,150,.6)" }
];
function msScene(k = 0) {
  const { W, H } = size(), port = H > W, P = MS_PAL[k % MS_PAL.length];
  const pSky = Art.plane(0, 0), pSun = Art.plane(0.04, 1), pFar = Art.plane(0.12, 2), pMid = Art.plane(0.3, 3), pNear = Art.plane(1, 4);
  const sx = W * (port ? 0.84 : 0.88), sy = H * (port ? 0.15 : 0.19);
  Art.light.x = sx; Art.light.y = sy;
  Art.sky(pSky, P.sky, P.haze);
  Art.sun(pSun, sx, sy, Math.min(W, H) * 0.055);
  [[0.1, 0.22, 0.1, 31], [0.42, 0.12, 0.08, 32], [0.7, 0.27, 0.09, 33]].forEach(([x, y, w, sd]) => Art.cloud(pFar, W * x, H * y, Math.max(70, W * w), { seed: sd + k, depth: 0.25 }));
  Art.range(pFar, { top: 0.54, bottom: 0.86, color: P.far, peaks: port ? 2 : 4, seed: 7 + k, snow: P.snow });
  Art.range(pMid, { top: 0.72, bottom: 0.95, color: P.mid, peaks: port ? 2 : 4, seed: 12 + k, round: true, rim: P.rim });
  const sc = Math.min(1.3, Math.max(0.8, H / 800));
  Art.trees(pMid, [[0.04, 0.9, 50, "o"], [0.1, 0.88, 66, "c"], [0.9, 0.88, 62, "c"], [0.96, 0.9, 46, "o"]].filter((_, i) => !port || i % 2).map(([x, y, h, t]) => [W * x, H * y, h * sc, t]));
  Art.meadow(pNear, H * 0.92, { seed: 9 + k, flowers: 8 });
  Art.frame(pNear);
  el("div", "vignette2"); el("div", "filmgrain");
  Art.pollen(14);
  return { W, H, port };
}

/* Смена сцены через затемнение */
async function msSwap(k) { hideCap(); await toDark(); clearStage(); msScene(k); Snd.amb("meadow", 0.5); fromDark(); Art.autoQuality(); await sleep(250); }
/* Где верх свободного места: под подписью */
function msTop() { return cap.classList.contains("hidden") ? 70 : cap.getBoundingClientRect().bottom - stage.getBoundingClientRect().top; }
/* Держать элемент между подписью и низом экрана, по центру свободного места */
function msKeep(e) {
  const f = () => { if (!e.isConnected) return clearInterval(t); const { H } = size(), top = msTop() + 12, h = e.offsetHeight; e.style.top = Math.max(top, Math.min(H - h - 14, (top + H - h - 14) / 2)) + "px"; };
  const t = setInterval(f, 250); f(); return f;
}
const msId = t => (window.MS_AUDIO || {})[t];
const msHas = t => { const id = msId(t); return !!id && AR.have.has(id); };
const msSay = t => msHas(t) ? AR.say(msId(t)) : sleep(700);

/* Доска-лавх со строчкой: плитки справа налево, размер шрифта — чтобы строчка влезла в 2 ряда */
function msBoard(items) {
  const b = el("div", "lavh", stage), page = el("div", "page", b);
  const tiles = items.map(t => { const e = el("div", "ms-it", page, `<span>${t}</span>`); e._t = t; return e; });
  for (let fs = items.length <= 3 ? 84 : items.length <= 5 ? 68 : 56; fs >= 24; fs -= 2) {
    tiles.forEach(e => e.style.fontSize = fs + "px");
    const tops = new Set(tiles.map(e => e.offsetTop));
    if (tops.size <= 2) break;
  }
  Art.rise(b, 0, 30, 700);
  msKeep(b);
  return { b, tiles };
}

/* Строчка из книги. listen — сначала прочитать её всю (подсветка бежит справа налево), line — что сказать перед этим */
async function msRow(items, listen, first, line = "ms_row_listen") {
  const { b, tiles } = msBoard(items);
  await sleep(500);
  if (listen) {
    const p = cue(line); await p; await sleep(250);
    for (const e of tiles) { e.classList.add("now"); await msSay(e._t); await sleep(220); e.classList.remove("now"); }
    await sleep(300);
  }
  cue(listen || first ? "ms_row_you" : "ms_row_more");
  await new Promise(res => {
    let fin = false, skipT = null;
    const next = () => tiles.find(e => !e.classList.contains("done"));
    const coach = Art.coach(() => { const e = next(); if (!e || fin) return null; const r = e.getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height * 0.6 }; }, "tap", { delay: 2500, idle: 6000 });
    const end = async () => { if (fin) return; fin = true; coach.stop(); clearTimeout(skipT); Snd.chirp && Snd.chirp(); const r = b.getBoundingClientRect(); Art.burst(r.left + r.width / 2, r.top + 20, { n: 26, speed: 4, life: 1.1, size: 5 }); await sleep(800); res(); };
    tiles.forEach(e => e.addEventListener("pointerdown", ev => {
      ev.preventDefault(); if (fin) return;
      Art.ripple(ev.clientX, ev.clientY); Snd.tap();
      tiles.forEach(x => x.classList.remove("now")); e.classList.add("now", "done");
      msSay(e._t).then(() => e.classList.remove("now"));
      if (!next()) setTimeout(end, 900);
    }));
    skipT = setTimeout(() => { if (fin) return; const bt = button("Дальше"); clicked(bt).then(() => { capBtns.innerHTML = ""; end(); }); }, 30000);
  });
  fadeOut(b, 350); await sleep(380); b.remove();
}

/* Проверка на слух: звучит слово — найди его из трёх. Возвращает число ошибок */
async function msCheck(items) {
  const pool = [...new Set(items)].filter(msHas);
  if (pool.length < 3) return 0;
  const targets = pool.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  let misses = 0;
  for (let r = 0; r < targets.length; r++) {
    const t = targets[r], others = pool.filter(x => x !== t).sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [t, ...others].sort(() => Math.random() - 0.5);
    const { b, tiles } = msBoard(opts);
    tiles.forEach(e => e.style.fontSize = Math.min(92, parseFloat(e.style.fontSize) * 1.1) + "px");
    showCap("ms_check"); capLine.ar = msId(t);
    await (r === 0 ? Voice.speak("ms_check").then(() => sleep(200)) : sleep(500));
    await new Promise(res => {
      let fin = false;
      const right = tiles[opts.indexOf(t)];
      const hl = setTimeout(() => !fin && right.classList.add("hl"), 15000);
      const auto = setTimeout(() => { if (!fin) { misses++; pick(right); } }, 32000);
      const pick = async e => {
        if (fin || e.classList.contains("no")) return;
        if (e === right) {
          fin = true; clearTimeout(hl); clearTimeout(auto); e.classList.add("ok"); celebrate(); capNote.textContent = L("a_right");
          await msSay(t); await sleep(500); capNote.textContent = ""; res();
        } else {
          misses++; e.classList.add("no"); Snd.thud(0.3); capNote.textContent = L("ms_wrong");
          await msSay(e._t); await sleep(300); msSay(t);
        }
      };
      tiles.forEach(e => e.addEventListener("pointerdown", ev => { ev.preventDefault(); Art.ripple(ev.clientX, ev.clientY); pick(e); }));
      msSay(t);
    });
    fadeOut(b, 300); await sleep(330); b.remove();
  }
  hideCap();
  return misses;
}

/* Слог для показа места звука: «أَ + буква с сукуном» (так ищут махрадж), иначе первое слово строки со звуком */
function msSound(l, g) {
  const sk = l.id === "alif" ? "أَ" : "أَ" + l.ch + "ْ";
  if (msHas(sk)) return sk;
  return g.rows.flat().find(msHas) || null;
}

/* Знакомство с буквой: название, на что похожа, где рождается звук, обвести */
async function msMeet(l, g) {
  const { W, H } = size(), port = H > W;
  const gs = Math.min(W * 0.5, H * 0.3, 230);
  const glyph = bigGlyph(l, W / 2, H * 0.56, gs); Art.pop(glyph, 0, 700); Snd.sparkle();
  await sayAr(`a_${l.id}_name`, `ar_name_${l.id}`);
  glyph.classList.add("hl"); await say(`a_${l.id}_pic`); glyph.classList.remove("hl");
  /* место звука: схема рта и строка из книги одним блоком под подписью; буква — слева (в портрете уходит) */
  const mw = Math.min(W * (port ? 0.9 : 0.5), (H - 370) * 340 / 260, 460);
  if (port) fadeOut(glyph, 300);
  else move(glyph, W * 0.17, H * 0.56, 500);
  const wrap = el("div", "ms-mx", stage); wrap.style.cssText = `position:absolute;left:${port ? 0 : W * 0.34}px;right:0;z-index:7;display:flex;flex-direction:column;align-items:center;gap:12px`;
  const m = Mouth.create(wrap, mw, true); Art.pop(m.el, 0, 600);
  const book = el("div", "mx-book", wrap, `<b class="mxl">${l.ch}</b> <b>По книге:</b> ${g.mx}`);
  msKeep(wrap);
  const snd = msSound(l, g), line = `ms_mx_${l.id}`;
  showCap(line); capLine.ar = snd ? msId(snd) : null;
  m.set(l.id);
  const p = Voice.speak(line).then(() => sleep(300)).then(() => m.show(l.id, snd ? () => msSay(snd) : null));
  await sleep(500);
  const b = button("Дальше"); p.then(() => b.classList.add("glow")); autoNext(b, p, L(line));
  await clicked(b); Voice.stop(); capBtns.innerHTML = ""; m.stop();
  [glyph, wrap].forEach(e => e.isConnected && fadeOut(e, 400)); await sleep(450);
  await traceLetter(l.ch);
}

/* Урок 1: огласовки на Алифе (хамзе) */
async function msHarakat() {
  const { W, H } = size();
  const sz = Math.min(W * 0.42, H * 0.28, 200);
  for (const [t, line, snd] of [["أَ", "ms_h_fatha", "أَ"], ["إِ", "ms_h_kasra", "إِ"], ["أُ", "ms_h_damma", "أُ"], ["إِأْ", "ms_h_sukun", "إِأْ"]]) {
    const g = obj("al-glyph", inkSVG(t, "#1F5B74", 70), W / 2, Math.max(msTop() + sz / 2 + 30, H * 0.58), sz, sz);
    g.style.zIndex = 6; Art.pop(g, 0, 600); Snd.sparkle();
    await sayAr(line, msHas(snd) ? msId(snd) : null);
    fadeOut(g, 300); await sleep(330); g.remove();
  }
}

/* Урок 16: долгие буквы — короткий слог против длинного, полоска тянется */
async function msMadd() {
  const { W, H } = size();
  for (const [s, l, line] of [["بَ", "بَا", "ms_madd_a"], ["بِ", "بِي", "ms_madd_i"], ["بُ", "بُو", "ms_madd_u"]]) {
    const sz = Math.min(W * 0.3, H * 0.2, 150);
    const pair = el("div", "ms-pair", stage, `<div class="al-glyph" style="width:${sz}px;height:${sz}px">${inkSVG(s, "#1F5B74", 56)}</div><div class="ms-bar" style="width:${sz * 0.7}px"></div><div class="al-glyph" style="width:${sz}px;height:${sz}px">${inkSVG(l, "#1F5B74", 70)}</div>`);
    put(pair, W / 2, Math.max(msTop() + sz / 2 + 30, H * 0.6)); Art.pop(pair, 0, 600);
    pair.querySelector(".ms-bar").animate([{ transform: "scaleX(.15)" }, { transform: "scaleX(1)" }], { duration: 1400, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
    await sayAr(line, msHas(l) ? msId(l) : null);
    fadeOut(pair, 300); await sleep(330); pair.remove();
  }
}

/* Урок целиком. Возвращает число ошибок (звёзды) */
async function chMS(k) {
  const les = MS_LESSONS[k];
  await toDark(); clearStage(); msScene(k); Snd.amb("meadow", 0.6); fromDark(); Art.enter(); Art.autoQuality(); await sleep(300);
  await chapterTitle(null, les.title, `${les.id}_0`);
  await say(`${les.id}_1`);
  let misses = 0, firstRow = true;
  if (les.madd) await msMadd();
  for (const g of les.groups) {
    const l = LET[g.l];
    if (!les.madd) { await msSwap(LETTERS.indexOf(l)); await msMeet(l, g); await msSwap(k + 1); }
    if (les.id === "ms1") await msHarakat();
    for (let r = 0; r < g.rows.length; r++) { await msRow(g.rows[r], r === 0, firstRow); firstRow = false; }
    if (g.pairs) await msRow(g.pairs, true, false, "ms_pairs");   // «Обратите внимание»: похожие звуки — разные слова
  }
  await msSwap(k + 2);
  misses += await msCheck(les.groups.flatMap(g => [...g.rows.flat(), ...(g.pairs || [])]));
  await say("a_g_end", { named: true });
  hideCap(); await awardLetters(les.letters);
  return misses;
}

MS_LESSONS.forEach((les, k) => {
  const w = k < 6 ? 0 : k < 11 ? 1 : 2;
  const ch = les.madd ? "ا" : LET[les.letters[0]].ch;
  regChapter(w, { id: les.id, name: les.title, icon: chIcon(les.id === "ms1" ? "أ" : ch), fn: () => chMS(k), lines: les.id + "_" });
});
