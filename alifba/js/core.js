"use strict";
/* «Алиф-Ба»: уровни, арабский звук, общие механики (обвести букву), вступление и финал.
   Подключается после ../js/chapters.js — оттуда levelDone/certificate.
   Свои WORLDS/ITEMS/chIntro/chFinal заменяют «Аяты вокруг нас». Главы — курс «Муаллим сани», ms.js. */

/* ============ УРОВНИ ============ */
WORLDS.length = 0;
[
  { t: "Первые буквы", s: "«Муаллим сани», уроки 1–6: Алиф, Ро, Зай, Мим, Та, Нун, Йа, Ба, Каф, Лям, Уау, Ха", ch: [] },
  { t: "Новые звуки", s: "Уроки 7–11: Фа, Коф, Шин, Син, Са, Сод, То, Джим, Хо", ch: [] },
  { t: "Звуки горла и долгие буквы", s: "Уроки 12–16: Ха, Гойн, Айн, Даль, Дод, Заль, Зо и мадд", ch: [] }
].forEach(w => WORLDS.push(w));
for (const k in REG) delete REG[k];

/* Копилка букв вместо сокровищ: каждая буква — карточка */
const glyphSvg = (ch, fill = "#1F5B74") => `<rect x="6" y="6" width="88" height="88" rx="22" fill="#FFF6DA" stroke="#E2C77E" stroke-width="3"/><text x="50" y="68" text-anchor="middle" font-family="Amiri, serif" font-size="58" font-weight="700" fill="${fill}">${ch}</text>`;
ITEMS.length = 0;
LETTERS.forEach(l => ITEMS.push({ id: "L_" + l.id, name: l.ru, svg: glyphSvg(l.ch) }));
/* Значок главы: буква в кружке (svg 48×48 без тега svg) */
const chIcon = ch => `<circle cx="24" cy="24" r="21" fill="#FFF6DA" stroke="#E2C77E" stroke-width="2"/><text x="24" y="33" text-anchor="middle" font-family="Amiri, serif" font-size="28" font-weight="700" fill="#1F5B74">${ch}</text>`;

/* Несколько букв в копилку разом, одной всплывашкой */
async function awardLetters(ids) {
  const fresh = ids.filter(id => !Save.d.items.includes("L_" + id));
  fresh.forEach(id => Save.d.items.push("L_" + id)); Save.save(); updateBag(true);
  if (!fresh.length) return;
  Snd.chirp && Snd.chirp(); celebrate();
  await toast(`<div class="al-tl">${fresh.map(id => `<span>${LET[id].ch}</span>`).join("")}</div><b>${fresh.length > 1 ? "Новые буквы" : "Новая буква"}</b><i>${GAME.award}</i>`, 2400);
}

/* ============ АРАБСКИЙ ЗВУК ============ */
/* voice/ar/<id>.mp3: названия букв, слоги, слова. Сейчас синтез-заглушка, перед запуском — живые записи с теми же id */
const AR = {
  have: new Set(), ready: null,
  load() { return this.ready || (this.ready = fetch(ROOT + "voice/ar/manifest.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : []).catch(() => []).then(a => { this.have = new Set(a); })); },
  /* Промис — когда звук договорён (или его нет/звук выключен) */
  say(id) {
    return new Promise(async res => {
      Voice.stop(); const my = Voice.seq;
      await this.load();
      if (!Voice.on || !Snd.ac || !this.have.has(id)) return setTimeout(res, 350);
      try {
        const b = await Voice.buffer("ar", id);
        if (my !== Voice.seq) return res();
        cap.classList.add("talk");
        Voice.play(b, () => { if (my === Voice.seq) cap.classList.remove("talk"); res(); });
      } catch (e) { res(); }
    });
  }
};
AR.load();

/* Буква Йа с точками. Шрифт мусхафа рисует одиночную и конечную ي без точек (так в Коране), в азбуке это путает.
   Короткие надписи (буква, слог) с такой Йа переводим на Amiri; слова и аяты остаются шрифтом мусхафа */
const YA_ISO = /ي[\u064B-\u0652\u0670]*(?![\u064B-\u0652\u0670]*[\u0620-\u064A\u200D\u0640])/;
function yaFix(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.nodeValue, base = t.replace(/[^\u0620-\u064A]/g, "");
    if (base.length && base.length <= 3 && YA_ISO.test(t) && n.parentElement) n.parentElement.style.fontFamily = '"Amiri Letters", "Amiri", serif';
  }
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(nd => nd.nodeType === 1 ? yaFix(nd) : nd.nodeType === 3 && nd.parentElement && yaFix(nd.parentElement)))).observe(document.body, { childList: true, subtree: true });

/* Реплика рассказчика, а за ней арабский звук (дважды — лучше запоминается). Кнопка «Дальше», автонажатие как у say */
async function sayAr(id, arId, opt = {}) {
  showCap(id, opt.note, opt.named); capLine.ar = arId;
  const p = Voice.speak(id, opt.named).then(() => sleep(200)).then(() => AR.say(arId)).then(() => opt.once ? null : sleep(350).then(() => AR.say(arId)));
  await sleep(500);
  const b = button(opt.btn || "Дальше");
  p.then(() => b.classList.add("glow"));
  autoNext(b, p, L(id));
  await clicked(b);
  Voice.stop(); capBtns.innerHTML = "";
}

/* ============ СЦЕНА ============ */
addCSS(`
.al-glyph { display: grid; place-items: center; border-radius: 28px; background: linear-gradient(180deg, #FFFDF5, #FFF1CF);
  box-shadow: 0 6px 0 #E2C77E, 0 18px 30px -14px rgba(0,0,0,.45); font-family: "Amiri", serif; font-weight: 700; color: #1F5B74;
  line-height: 1; cursor: pointer; transition: transform .15s; user-select: none; -webkit-user-select: none; }
.al-glyph span { display: block; transform: translateY(6%); }
.al-glyph svg { width: 100%; height: 100%; display: block; }
.al-glyph:active { transform: scale(.94); }
.al-glyph.hl { box-shadow: 0 6px 0 #E2C77E, 0 0 0 5px rgba(245,196,81,.9), 0 18px 30px -14px rgba(0,0,0,.45); }
.al-glyph.ok { background: linear-gradient(180deg, #F2FFF6, #D6F2E1); box-shadow: 0 6px 0 #A9D9BC, 0 0 0 4px rgba(70,185,122,.7); }
.al-glyph.no { animation: shake .42s; opacity: .55; }
.al-trace { position: absolute; transform: translate(-50%, -50%); border-radius: 28px; background: rgba(10,30,45,.35); box-shadow: inset 0 0 0 2px rgba(255,236,180,.35); }
.al-start { position: absolute; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%; background: #FFD66B; box-shadow: 0 0 0 6px rgba(255,214,107,.35); animation: al-pulse 1.1s ease-in-out infinite; pointer-events: none; }
@keyframes al-pulse { 50% { transform: scale(1.35); } }
.al-shine { animation: al-shine 1s ease-out; }
@keyframes al-shine { 30% { box-shadow: 0 0 0 10px rgba(255,214,107,.5); } }
.al-tl { display: flex; gap: 8px; justify-content: center; direction: rtl; font-family: "Amiri", serif; font-size: 40px; font-weight: 700; color: #1F5B74; margin-bottom: 4px; }
`);

/* Буква или слог по центру карточки — по реальным границам начертания (у Ро и Мим хвост уходит под строку, у Алифа — вверх).
   SVG 100×100: самая длинная сторона рисунка — box, но не крупнее 80 */
function inkSVG(text, fill = "#1F5B74", box = 62) {
  const fam = YA_ISO.test(text) ? '"Amiri Letters", "Amiri", serif' : '"Amiri", serif';
  const fit = () => {
    const g = inkSVG.g || (inkSVG.g = document.createElement("canvas").getContext("2d"));
    g.font = `700 100px ${fam}`; g.textAlign = "center"; g.direction = "rtl";
    const m = g.measureText(text), up = m.actualBoundingBoxAscent, dn = m.actualBoundingBoxDescent, l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight;
    const k = Math.min(0.8, box / Math.max(up + dn, l + r, 1));
    return { s: (100 * k).toFixed(1), x: (50 - (r - l) / 2 * k).toFixed(1), y: (50 + (up - dn) / 2 * k).toFixed(1) };
  };
  const id = "ink" + Math.random().toString(36).slice(2, 9), f = fit();
  if (!document.fonts.check(`700 100px ${fam}`, text)) document.fonts.load(`700 100px ${fam}`, text).then(() => {
    const t = document.getElementById(id); if (!t) return; const q = fit(); t.setAttribute("x", q.x); t.setAttribute("y", q.y); t.setAttribute("font-size", q.s);
  }).catch(() => {});
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><text id="${id}" x="${f.x}" y="${f.y}" font-size="${f.s}" text-anchor="middle" direction="rtl" font-family='${fam}' font-weight="700" fill="${fill}">${text}</text></svg>`;
}
/* Большая буква-карточка; нажали — звучит её название */
function bigGlyph(l, x, y, sz, text) {
  const e = obj("al-glyph", inkSVG(text || l.ch), x, y, sz, sz); e.style.zIndex = 6;
  e.onclick = () => { Snd.tap(); AR.say("ar_name_" + l.id); };
  return e;
}

/* ============ МЕХАНИКИ ============ */
/* Таймер бездействия с потолком (касания не могут откладывать автоход бесконечно) */
function alIdle(ms, fn) {
  const end = Date.now() + ms * 4; let t = setTimeout(fn, ms);
  return { poke() { clearTimeout(t); t = setTimeout(fn, Math.max(0, Math.min(ms, end - Date.now()))); }, stop() { clearTimeout(t); } };
}

/* Обвести букву: палец «прокрашивает» её золотом; готово на 70%. host — элемент-холст */
function alTrace(host, text, idleMs = 18000) {
  return new Promise(async res => {
    try { await Promise.race([Promise.all([document.fonts.load('700 120px "Amiri"', text), document.fonts.load('700 120px "Amiri Letters"', text)]), sleep(2500)]); } catch (e) {}
    const w = host.clientWidth, h = host.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    const mk = () => { const c = document.createElement("canvas"); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); const x = c.getContext("2d"); x.scale(dpr, dpr); return [c, x]; };
    const [cv, ctx] = mk(); cv.style.cssText = `width:${w}px;height:${h}px;display:block;touch-action:none`; host.appendChild(cv);
    const [gold, gx] = mk();
    let fs = h * 0.72;
    const fam = YA_ISO.test(text) ? '"Amiri Letters"' : "Amiri";
    const setF = x => { x.font = `700 ${fs}px ${fam}, "Times New Roman", serif`; x.direction = "rtl"; x.textAlign = "center"; x.textBaseline = "alphabetic"; };
    setF(gx); const tw = gx.measureText(text).width; if (tw > w * 0.8) { fs *= w * 0.8 / tw; setF(gx); }
    const m = gx.measureText(text), asc = m.actualBoundingBoxAscent || fs * 0.7, desc = m.actualBoundingBoxDescent || fs * 0.25;
    const by = h / 2 + (asc - desc) / 2;
    const gr = gx.createLinearGradient(0, by - asc, 0, by + desc); gr.addColorStop(0, "#FFF4C2"); gr.addColorStop(1, "#F0B43C");
    gx.fillStyle = gr; gx.fillText(text, w / 2, by);
    setF(ctx); ctx.fillStyle = "rgba(255,240,200,.14)"; ctx.fillText(text, w / 2, by);
    ctx.setLineDash([7, 6]); ctx.lineWidth = 2.4; ctx.strokeStyle = "rgba(255,236,180,.95)"; ctx.strokeText(text, w / 2, by); ctx.setLineDash([]);
    const data = gx.getImageData(0, 0, gold.width, gold.height).data;
    let left = [];
    for (let y = 2; y < h; y += 4) for (let x = 2; x < w; x += 4) { const i = (Math.round(y * dpr) * gold.width + Math.round(x * dpr)) * 4 + 3; if (data[i] > 120) left.push({ x, y }); }
    const total = left.length || 1; let done = 0, fin = false, down = false, last = null;
    const R = Math.max(16, fs * 0.09);
    const sc = p => p.x - p.y * 0.6;   // начало — сверху справа: так начинают писать арабские буквы (у Алифа — верх)
    const st = left.reduce((a, p) => (sc(p) > sc(a) ? p : a), left[0] || { x: w * 0.8, y: h / 2 });
    const dot = el("div", "al-start", host); dot.style.left = st.x + "px"; dot.style.top = st.y + "px";
    const paintAt = (x, y) => {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(gold, 0, 0, w, h); ctx.restore();
      const r2 = R * R, before = left.length;
      left = left.filter(p => (p.x - x) ** 2 + (p.y - y) ** 2 > r2);
      const n = before - left.length;
      if (n) { done += n; if (Math.random() < 0.3) Snd.noise({ f: rnd(2200, 3200), q: 8, dur: 0.08, gain: 0.05 }); }
      if (done / total >= 0.7) finish();
    };
    const pos = ev => { const r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    const stroke = p => {
      if (last) { const d = Math.hypot(p.x - last.x, p.y - last.y), n = Math.max(1, Math.ceil(d / (R * 0.5))); for (let i = 1; i <= n && !fin; i++) paintAt(last.x + (p.x - last.x) * i / n, last.y + (p.y - last.y) * i / n); }
      else paintAt(p.x, p.y);
      last = p;
    };
    const dn = ev => { ev.preventDefault(); if (fin) return; down = true; last = null; dot.style.display = "none"; idle.poke(); stroke(pos(ev)); };
    const mv = ev => { if (!down || fin) return; idle.poke(); stroke(pos(ev)); };
    const up = () => { down = false; last = null; };
    cv.addEventListener("pointerdown", dn); window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    const auto = async () => { if (fin) return; dot.style.display = "none"; left.sort((a, b) => sc(b) - sc(a)); while (!fin && left.length) { const p = left[0]; paintAt(p.x, p.y); await sleep(20); } };
    const idle = alIdle(idleMs, auto);
    function finish() {
      if (fin) return; fin = true; idle.stop();
      cv.removeEventListener("pointerdown", dn); window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      dot.remove(); ctx.drawImage(gold, 0, 0, w, h);
      host.classList.add("al-shine"); Snd.sparkle(); setTimeout(res, 800);
    }
  });
}
/* Обвести букву на сцене (рамка по центру) */
async function traceLetter(text, line = "a_trace") {
  const { W, H } = size();
  const s = Math.min(W * 0.78, H * 0.4, 340);
  const host = el("div", "al-trace", stage); Object.assign(host.style, { left: W / 2 + "px", top: H * 0.58 + "px", width: s + "px", height: s + "px", zIndex: 7 });
  cue(line);
  await alTrace(host, text);
  Snd.chirp && Snd.chirp(); capNote.textContent = L("a_trace_ok");
  await sleep(700); capNote.textContent = ""; fadeOut(host, 400);
}

/* ============ ВСТУПЛЕНИЕ И ФИНАЛ ============ */
async function chIntro() {
  await toDark(); clearStage(); const { W, H } = msScene(0); Snd.amb("meadow", 0.6); fromDark(); Art.enter(); Art.autoQuality(); await sleep(500);
  const g = obj("al-glyph", `<span>ا ب ت</span>`, W / 2, H * 0.6, Math.min(W * 0.8, 320), Math.min(H * 0.22, 150)); g.style.fontSize = Math.min(72, W * 0.16) + "px"; g.style.direction = "rtl"; Art.pop(g, 300, 800);
  await say("ms_intro1", { named: true });
  await say("ms_intro2");
  await say("a_intro3", { btn: "Бисмиллях" });
}
async function chFinal() {
  await toDark(); clearStage(); msScene(2); Snd.amb("meadow", 0.6); fromDark(); Art.enter(); await sleep(400);
  const row = el("div", "items-row many", stage, ITEMS.filter(i => Save.d.items.includes(i.id)).map(i => `<svg viewBox="0 0 100 100" aria-hidden="true">${i.svg}</svg>`).join(""));
  celebrate();
  await say("a_fin1", { named: true });
  await say("ms_fin2");
  hideCap(); await certificate();
  await say("a_fin3", { btn: "В меню" });
  hideCap();
}
