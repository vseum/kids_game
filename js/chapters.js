"use strict";
/* ============ РИСУНКИ (в игре нет изображений живых существ) ============ */
const ART = {
  sun: `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="gSun" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#FFF8D2"/><stop offset=".55" stop-color="#FFD66B"/><stop offset="1" stop-color="#F7B32B"/></radialGradient>
    <radialGradient id="gSunHalo" cx=".5" cy=".5" r=".5"><stop offset=".45" stop-color="#FFE7A0" stop-opacity=".7"/><stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient></defs>
    <circle cx="60" cy="60" r="60" fill="url(#gSunHalo)"/>
    <g class="rays" stroke="#FFE08A" stroke-width="4" stroke-linecap="round" opacity=".8">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${(60 + 36 * Math.cos(a)).toFixed(1)}" y1="${(60 + 36 * Math.sin(a)).toFixed(1)}" x2="${(60 + 46 * Math.cos(a)).toFixed(1)}" y2="${(60 + 46 * Math.sin(a)).toFixed(1)}"/>`; }).join("")}</g>
    <circle cx="60" cy="60" r="28" fill="url(#gSun)"/></svg>`,
  cloud: `<svg viewBox="0 0 160 80" aria-hidden="true"><defs><linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCEAF2"/></linearGradient></defs>
    <path d="M30 72 Q8 72 10 54 Q12 38 32 40 Q34 18 58 16 Q78 4 96 20 Q118 12 128 34 Q152 34 150 54 Q150 72 128 72 Z" fill="url(#gCloud)"/></svg>`,
  plane: `<svg viewBox="0 0 100 60" aria-hidden="true">
    <path d="M4 30 L96 8 L40 40 Z" fill="#FFFFFF" stroke="#B6C7CF" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M40 40 L96 8 L52 52 Z" fill="#E4EDF1" stroke="#B6C7CF" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M40 40 L46 56 L52 52 Z" fill="#C9D8DF" stroke="#B6C7CF" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  pillar: `<svg viewBox="0 0 40 140" aria-hidden="true"><defs><linearGradient id="gStone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9DCC2"/><stop offset=".5" stop-color="#FFF6E3"/><stop offset="1" stop-color="#CDBB98"/></linearGradient></defs>
    <rect x="2" y="0" width="36" height="12" rx="3" fill="#D8C7A4"/><rect x="7" y="12" width="26" height="114" fill="url(#gStone)"/>
    <path d="M14 14 V124 M20 14 V124 M26 14 V124" stroke="#D8C7A4" stroke-width="1.5"/><rect x="0" y="126" width="40" height="14" rx="3" fill="#C8B590"/></svg>`,
  roof: `<svg viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98B52"/><stop offset="1" stop-color="#8E5A2E"/></linearGradient></defs>
    <rect x="0" y="4" width="200" height="22" rx="6" fill="url(#gWood)"/><path d="M8 12 H120 M60 19 H192" stroke="#7A4A24" stroke-width="2" opacity=".5"/></svg>`,
  balloon: `<svg viewBox="0 0 60 130" aria-hidden="true"><defs><radialGradient id="gBal" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FF9C8F"/><stop offset=".6" stop-color="#F25C4F"/><stop offset="1" stop-color="#C73E33"/></radialGradient></defs>
    <path d="M30 66 Q22 86 30 100 Q38 114 30 130" stroke="#48606B" stroke-width="1.6" fill="none"/>
    <ellipse cx="30" cy="32" rx="25" ry="31" fill="url(#gBal)"/><ellipse cx="21" cy="19" rx="6" ry="10" fill="#fff" opacity=".5"/><path d="M26 62 L34 62 L30 68Z" fill="#C73E33"/></svg>`,
  fan: `<svg viewBox="0 0 100 80" aria-hidden="true"><defs><linearGradient id="gFan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB38F"/><stop offset="1" stop-color="#F07A55"/></linearGradient></defs>
    <path d="M50 76 L4 32 A64 64 0 0 1 96 32 Z" fill="url(#gFan)"/>
    <g stroke="#D9603F" stroke-width="2">${[-60, -40, -20, 0, 20, 40, 60].map(a => { const r = Math.PI * (a - 90) / 180; return `<line x1="50" y1="76" x2="${(50 + 64 * Math.cos(r)).toFixed(1)}" y2="${(76 + 64 * Math.sin(r)).toFixed(1)}"/>`; }).join("")}</g>
    <path d="M14 26 A60 60 0 0 1 86 26" stroke="#F5C451" stroke-width="5" fill="none"/><circle cx="50" cy="74" r="6" fill="#7A4A24"/></svg>`,
  jug: `<svg viewBox="0 0 90 100" aria-hidden="true"><defs><linearGradient id="gClay" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A9542F"/><stop offset=".45" stop-color="#D98552"/><stop offset="1" stop-color="#8C3F20"/></linearGradient></defs>
    <path d="M24 34 Q10 36 12 52 Q14 64 26 64" fill="none" stroke="#9A4A28" stroke-width="7" stroke-linecap="round"/>
    <path d="M34 10 H58 L56 22 Q80 34 78 62 Q76 94 46 94 Q16 94 14 62 Q12 34 36 22 Z" fill="url(#gClay)"/>
    <path d="M58 12 L76 4 L72 14 Z" fill="#B9603A"/><path d="M20 58 Q46 66 72 58" stroke="#F5C451" stroke-width="3" fill="none" opacity=".8"/>
    <ellipse cx="34" cy="48" rx="5" ry="12" fill="#fff" opacity=".18"/></svg>`,
  glass: `<svg viewBox="0 0 80 110" aria-hidden="true"><defs><linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE6F7" stop-opacity=".9"/><stop offset="1" stop-color="#6BC0E6" stop-opacity=".9"/></linearGradient></defs>
    <g class="spoon"><path d="M58 0 L40 76" stroke="#A9B6BC" stroke-width="4" stroke-linecap="round"/><ellipse cx="39" cy="80" rx="6" ry="9" fill="#A9B6BC"/></g>
    <path d="M12 20 L68 20 L62 104 L18 104 Z" fill="rgba(255,255,255,.35)" stroke="#9EB4BE" stroke-width="3" stroke-linejoin="round"/>
    <path class="water" d="M15 46 L65 46 L62 101 L18 101 Z" fill="url(#gWater)"/>
    <path d="M20 28 L24 96" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/></svg>`,
  apple: `<svg viewBox="0 0 120 170" aria-hidden="true"><defs><linearGradient id="gTrunk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A4A24"/><stop offset=".5" stop-color="#A26A3A"/><stop offset="1" stop-color="#6A3E1C"/></linearGradient>
    <radialGradient id="gLeaf" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#9BDB7E"/><stop offset="1" stop-color="#4E9D45"/></radialGradient></defs>
    <path d="M54 170 Q52 120 56 92 L64 92 Q68 120 66 170 Z" fill="url(#gTrunk)"/><path d="M58 108 Q44 98 38 84 M62 104 Q76 96 80 84" stroke="#7A4A24" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="60" cy="52" r="40" fill="url(#gLeaf)"/><circle cx="30" cy="70" r="26" fill="url(#gLeaf)"/><circle cx="90" cy="68" r="26" fill="url(#gLeaf)"/><circle cx="60" cy="80" r="26" fill="url(#gLeaf)"/>
    <g class="fruit">${[[38, 58], [64, 40], [84, 64], [52, 80], [74, 86], [28, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#E8463C"/><circle cx="${x - 2.5}" cy="${y - 2.5}" r="2.2" fill="#fff" opacity=".6"/>`).join("")}</g></svg>`,
  palm: `<svg viewBox="0 0 120 170" aria-hidden="true">
    <path d="M56 170 Q50 120 58 60 L66 60 Q60 120 66 170 Z" fill="#A87A4A"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${55 + i * 0.3} ${160 - i * 11} Q62 ${156 - i * 11} ${68 - i * 0.2} ${160 - i * 11}" stroke="#7E5630" stroke-width="2" fill="none"/>`).join("")}
    <g class="fruit">${[[50, 66], [56, 72], [62, 68], [68, 74], [74, 66], [46, 74], [60, 78]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="6" fill="#8A4B1F"/>`).join("")}</g>
    <g fill="#5DAE4F" stroke="#3F8A3B" stroke-width="1.5">${[[-160, 52], [-130, 58], [-95, 50], [-60, 58], [-25, 52], [-178, 40], [-2, 40]].map(([a, l]) => { const r = a * Math.PI / 180, x2 = 62 + l * Math.cos(r), y2 = 58 + l * Math.sin(r) + 14; return `<path d="M62 58 Q${(62 + l * 0.5 * Math.cos(r)).toFixed(1)} ${(58 + l * 0.5 * Math.sin(r) - 12).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} Q${(62 + l * 0.55 * Math.cos(r)).toFixed(1)} ${(58 + l * 0.55 * Math.sin(r)).toFixed(1)} 62 62Z"/>`; }).join("")}</g></svg>`,
  vine: `<svg viewBox="0 0 120 170" aria-hidden="true">
    <rect x="16" y="50" width="8" height="120" rx="3" fill="#8E5A2E"/><rect x="96" y="50" width="8" height="120" rx="3" fill="#8E5A2E"/><rect x="8" y="46" width="104" height="10" rx="4" fill="#A26A3A"/>
    <path d="M60 170 Q54 130 62 100 Q70 76 52 56" stroke="#6A3E1C" stroke-width="6" fill="none" stroke-linecap="round"/>
    <g fill="#6DBE59" stroke="#418C3C" stroke-width="1.5">${[[22, 44], [42, 38], [62, 42], [84, 38], [102, 46], [34, 62], [76, 60], [56, 70]].map(([x, y]) => `<path d="M${x} ${y} q-10 -6 -6 -14 q6 2 6 -6 q4 6 10 2 q0 10 -10 18z"/>`).join("")}</g>
    <g class="fruit">${[[36, 66], [86, 66]].map(([x, y]) => [[0, 0], [8, 0], [16, 0], [4, 7], [12, 7], [8, 14], [-4, 7]].map(([dx, dy]) => `<circle cx="${x + dx - 6}" cy="${y + dy}" r="4.6" fill="#7B4FA0"/><circle cx="${x + dx - 7.5}" cy="${y + dy - 1.5}" r="1.3" fill="#fff" opacity=".5"/>`).join("")).join("")}</g></svg>`,
  ship: `<svg viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="gHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A86A3C"/><stop offset="1" stop-color="#6A3E1F"/></linearGradient>
    <linearGradient id="gSail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFDF5"/><stop offset="1" stop-color="#EADFC4"/></linearGradient></defs>
    <path d="M83 14 L106 8 L83 2Z" fill="#F5C451"/><rect x="79" y="2" width="5" height="110" rx="2" fill="#5D3B22"/>
    <path class="sail-full" d="M84 16 Q152 58 84 104 Z" fill="url(#gSail)" stroke="#D9CBA8" stroke-width="2"/>
    <path class="sail-full" d="M78 24 Q38 66 78 100 Z" fill="url(#gSail)" stroke="#D9CBA8" stroke-width="2"/>
    <path class="sail-slack" d="M84 16 Q94 60 87 104 L84 104 Z" fill="url(#gSail)" stroke="#D9CBA8" stroke-width="2"/>
    <path class="sail-slack" d="M78 24 Q71 66 78 100 Z" fill="url(#gSail)" stroke="#D9CBA8" stroke-width="2"/>
    <path d="M10 108 L150 108 L130 142 L30 142 Z" fill="url(#gHull)"/><path d="M14 115 L146 115" stroke="#F5C451" stroke-width="4"/>
    ${[52, 80, 108].map(x => `<circle cx="${x}" cy="128" r="5" fill="#2C1A0E"/><circle cx="${x}" cy="128" r="5" fill="none" stroke="#F5C451" stroke-width="1.5"/>`).join("")}</svg>`,
  efan: `<svg viewBox="0 0 100 140" aria-hidden="true">
    <rect x="46" y="70" width="8" height="52" fill="#9FB7C0"/><rect x="20" y="116" width="60" height="18" rx="9" fill="#4F6F7C"/><circle cx="66" cy="125" r="5" fill="#E35D52"/>
    <circle cx="50" cy="46" r="40" fill="rgba(255,255,255,.35)" stroke="#8FA9B4" stroke-width="4"/>
    <g class="fanblades">${[0, 120, 240].map(a => `<ellipse cx="50" cy="26" rx="10" ry="19" fill="#3FA2CF" transform="rotate(${a} 50 46)"/>`).join("")}</g><circle cx="50" cy="46" r="7" fill="#4F6F7C"/></svg>`,
  sand: `<svg viewBox="0 0 120 70" aria-hidden="true"><defs><radialGradient id="gSand" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#F3D9A4"/><stop offset="1" stop-color="#C9A064"/></radialGradient></defs>
    <path d="M4 68 Q30 20 60 10 Q90 20 116 68Z" fill="url(#gSand)"/>${[[40, 50], [62, 34], [80, 54], [54, 58], [30, 62], [92, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#B08852"/>`).join("")}</svg>`,
  tent: `<svg viewBox="0 0 160 120" aria-hidden="true"><defs><linearGradient id="gTent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8754F"/><stop offset=".5" stop-color="#F59A6B"/><stop offset="1" stop-color="#D2603D"/></linearGradient></defs>
    <path d="M14 118 L80 10 L146 118Z" fill="url(#gTent)"/><path d="M80 10 L64 118 H96Z" fill="#9C4128"/><path d="M80 10 V118" stroke="#7E3320" stroke-width="2"/>
    <path d="M80 10 L2 118 M80 10 L158 118" stroke="#8E6A43" stroke-width="1.6" stroke-dasharray="4 3" fill="none"/></svg>`,
  stake: `<svg viewBox="0 0 24 50" aria-hidden="true"><rect x="8" y="2" width="8" height="34" rx="2" fill="#A26A3A"/><path d="M8 36 L12 48 L16 36Z" fill="#8E5A2E"/><rect x="5" y="2" width="14" height="5" rx="2" fill="#7A4A24"/></svg>`,
  lantern: `<svg viewBox="0 0 50 74" aria-hidden="true"><path d="M15 12 Q25 0 35 12" fill="none" stroke="#4F6F7C" stroke-width="3"/>
    <rect x="12" y="12" width="26" height="6" rx="2" fill="#4F6F7C"/><rect x="14" y="18" width="22" height="40" rx="5" fill="rgba(255,240,200,.35)" stroke="#4F6F7C" stroke-width="3"/>
    <path class="flamel" d="M25 26 Q32 36 28 44 Q25 48 22 44 Q18 36 25 26Z" fill="#FFC94A" opacity=".25"/><rect x="10" y="58" width="30" height="8" rx="3" fill="#4F6F7C"/></svg>`,
  heater: `<svg viewBox="0 0 90 80" aria-hidden="true"><rect x="6" y="10" width="78" height="56" rx="10" fill="#E7EEF1" stroke="#9FB2BA" stroke-width="3"/>
    <g class="coils" stroke="#B9C6CC" stroke-width="5" stroke-linecap="round">${[22, 36, 50, 64].map(x => `<path d="M${x} 20 V56"/>`).join("")}</g>
    <rect x="16" y="66" width="10" height="10" rx="2" fill="#7E9099"/><rect x="64" y="66" width="10" height="10" rx="2" fill="#7E9099"/><circle cx="76" cy="18" r="3" fill="#E35D52"/></svg>`,
  lighthouse: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M0 110 Q40 86 70 94 Q100 86 120 110Z" fill="#2E4B4F"/>
    <path d="M50 96 L56 30 H72 L78 96Z" fill="#F3EDE0"/><path d="M52 74 H76 L77 84 H51Z M54 50 H74 L75 60 H53Z" fill="#E35D52"/>
    <rect x="54" y="20" width="20" height="12" rx="2" fill="#FFE29A" class="lhlamp"/><path d="M52 20 L64 10 L76 20Z" fill="#4F6F7C"/></svg>`,
  island: `<svg viewBox="0 0 200 80" aria-hidden="true"><path d="M0 70 Q60 40 110 52 Q160 40 200 70Z" fill="#7FAF7A"/>
    <rect x="140" y="18" width="12" height="38" fill="#F3EDE0"/><rect x="140" y="28" width="12" height="6" fill="#E35D52"/><rect x="140" y="42" width="12" height="6" fill="#E35D52"/><path d="M136 18 L146 8 L156 18Z" fill="#4F6F7C"/>
    <path d="M60 52 Q58 34 64 22" stroke="#7E5630" stroke-width="3" fill="none"/><path d="M64 22 q-14 -2 -20 6 M64 22 q14 -4 20 4 M64 22 q-6 -10 -16 -10 M64 22 q8 -10 16 -8" stroke="#4E9D45" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`
};
/* Иконки для вариантов ответа и глав (viewBox 48×48) */
const ICON = {
  pillar: '<rect x="15" y="6" width="18" height="5" rx="2" fill="#C8B590"/><rect x="18" y="11" width="12" height="27" fill="#F1E6CF"/><path d="M22 12v25M26 12v25" stroke="#D8C7A4" stroke-width="1.4"/><rect x="13" y="38" width="22" height="5" rx="2" fill="#C8B590"/>',
  cloud: '<path d="M12 36 Q4 36 5 28 Q6 21 13 22 Q14 12 25 12 Q34 10 37 19 Q45 19 44 28 Q44 36 36 36Z" fill="#fff" stroke="#9FC3D4" stroke-width="2"/>',
  drop: '<path d="M24 6 Q36 22 36 30 A12 12 0 0 1 12 30 Q12 22 24 6Z" fill="#6BC0E6"/><path d="M18 30 a6 6 0 0 0 5 6" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  soil: '<path d="M4 38 Q24 20 44 38Z" fill="#9C6B3F"/><path d="M4 38 H44 V42 H4Z" fill="#7A4F2B"/><circle cx="18" cy="32" r="1.6" fill="#7A4F2B"/><circle cx="28" cy="29" r="1.6" fill="#7A4F2B"/><circle cx="32" cy="35" r="1.4" fill="#7A4F2B"/>',
  sail: '<path d="M24 6 V40" stroke="#5D3B22" stroke-width="2.5"/><path d="M25 8 Q42 22 25 36Z" fill="#FFFDF5" stroke="#CDBF9F" stroke-width="1.5"/><path d="M8 40 H40 L35 45 H13Z" fill="#8E5A2E"/>',
  fan: '<circle cx="24" cy="20" r="14" fill="#E7F3F8" stroke="#8FA9B4" stroke-width="2"/><g fill="#3FA2CF"><ellipse cx="24" cy="12" rx="4" ry="7"/><ellipse cx="24" cy="12" rx="4" ry="7" transform="rotate(120 24 20)"/><ellipse cx="24" cy="12" rx="4" ry="7" transform="rotate(240 24 20)"/></g><rect x="22" y="33" width="4" height="8" fill="#8FA9B4"/><rect x="14" y="40" width="20" height="5" rx="2.5" fill="#4F6F7C"/>',
  sky: '<circle cx="31" cy="17" r="8" fill="#F7B32B"/><path d="M10 36 Q4 36 5 30 Q6 25 11 26 Q12 18 21 18 Q28 17 30 24 Q37 24 37 30 Q37 36 31 36Z" fill="#fff" stroke="#9FC3D4" stroke-width="2"/>',
  fruitc: '<circle cx="24" cy="27" r="14" fill="#E8463C"/><path d="M24 14 Q25 8 29 6" stroke="#6A3E1C" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M26 11 Q33 7 37 12 Q31 15 26 11Z" fill="#5DAE4F"/><circle cx="19" cy="22" r="3.5" fill="#fff" opacity=".5"/>',
  sand: '<path d="M6 40 Q24 10 42 40Z" fill="#E2BF84"/><path d="M30 10 L36 22 M33 9 L39 21" stroke="#8E5A2E" stroke-width="2.5" stroke-linecap="round"/><path d="M28 22 H44 L42 30 H30Z" fill="#4F9BC7"/>',
  wind: '<path d="M6 18 H30 a6 6 0 1 0 -6 -6 M6 28 H38 a6 6 0 1 1 -6 6 M6 38 H24" stroke="#5FA7C9" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
  lantern: '<path d="M18 10 Q24 3 30 10" fill="none" stroke="#4F6F7C" stroke-width="2.5"/><rect x="15" y="10" width="18" height="4" rx="1.5" fill="#4F6F7C"/><rect x="16" y="14" width="16" height="22" rx="3" fill="#FFE7A0" stroke="#4F6F7C" stroke-width="2.5"/><path d="M24 19 Q28 25 25 30 Q24 32 23 30 Q20 25 24 19Z" fill="#F5A623"/><rect x="14" y="36" width="20" height="5" rx="2" fill="#4F6F7C"/>',
  heater: '<rect x="6" y="10" width="36" height="26" rx="6" fill="#E7EEF1" stroke="#9FB2BA" stroke-width="2.5"/><path d="M15 15 V31 M22 15 V31 M29 15 V31 M36 15 V31" stroke="#F07A55" stroke-width="3" stroke-linecap="round"/><rect x="11" y="36" width="5" height="6" fill="#7E9099"/><rect x="32" y="36" width="5" height="6" fill="#7E9099"/>',
  wheel: '<circle cx="24" cy="24" r="12" fill="none" stroke="#8E5A2E" stroke-width="4"/><circle cx="24" cy="24" r="4" fill="#8E5A2E"/>' + [0, 45, 90, 135].map(a => `<path d="M24 4 V44" stroke="#8E5A2E" stroke-width="3.5" stroke-linecap="round" transform="rotate(${a} 24 24)"/>`).join(""),
  mountain: '<path d="M2 42 L18 14 L26 26 L32 18 L46 42Z" fill="#7B93A3"/><path d="M18 14 L13 23 L17 21 L20 24 L23 21Z M32 18 L29 23 L32 22 L35 24Z" fill="#fff"/>',
  sunc: '<circle cx="24" cy="24" r="9" fill="#F7B32B"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M24 6 V10" stroke="#F7B32B" stroke-width="3" stroke-linecap="round" transform="rotate(${a} 24 24)"/>`).join(""),
  star: '<path d="M24 5 L29 18 L43 19 L32 28 L36 42 L24 34 L12 42 L16 28 L5 19 L19 18Z" fill="#F5C451" stroke="#B9802A" stroke-width="1.5" stroke-linejoin="round"/>',
  ship: '<path d="M24 5 V34" stroke="#5D3B22" stroke-width="2.5"/><path d="M25 7 Q40 20 25 32Z" fill="#FFFDF5" stroke="#CDBF9F" stroke-width="1.5"/><path d="M23 10 Q12 21 23 31Z" fill="#F4EEDD" stroke="#CDBF9F" stroke-width="1.5"/><path d="M6 34 H42 L36 42 H12Z" fill="#8E5A2E"/><path d="M4 45 q5 -3 10 0 t10 0 t10 0 t10 0" stroke="#3FA2CF" stroke-width="2.5" fill="none"/>'
};

/* Сокровища за главы */
const ITEMS = [
  { id: "cloud", name: "Облачко", svg: '<path d="M22 76 Q4 76 6 60 Q8 46 24 48 Q26 28 48 26 Q66 18 76 34 Q94 32 96 52 Q98 76 78 76Z" fill="#fff" stroke="#9FC3D4" stroke-width="3"/><path d="M24 66 Q50 72 80 64" stroke="#DCEAF2" stroke-width="4" fill="none" stroke-linecap="round"/>' },
  { id: "date", name: "Финик", svg: '<path d="M50 12 Q50 6 56 4" stroke="#6A3E1C" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="54" rx="22" ry="38" fill="#8A4B1F"/><ellipse cx="42" cy="40" rx="6" ry="14" fill="#C27A45" opacity=".6"/><path d="M38 22 Q50 14 62 22" stroke="#5E3112" stroke-width="3" fill="none"/>' },
  { id: "stone", name: "Горный камень", svg: '<path d="M14 78 Q8 50 30 36 Q50 20 72 32 Q94 44 88 70 Q80 90 50 88 Q22 88 14 78Z" fill="#8FA3AE"/><path d="M30 44 Q50 32 70 40" stroke="#B9C7CE" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M40 66 L52 58 L62 70" stroke="#71848E" stroke-width="3" fill="none"/>' },
  { id: "sunray", name: "Солнечный лучик", svg: '<circle cx="50" cy="50" r="20" fill="#F7B32B"/><circle cx="44" cy="44" r="7" fill="#FFE8A3"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M50 10 V22" stroke="#F7B32B" stroke-width="6" stroke-linecap="round" transform="rotate(${a} 50 50)"/>`).join("") },
  { id: "star", name: "Путеводная звезда", svg: '<path d="M50 8 L61 36 L91 38 L68 57 L76 87 L50 70 L24 87 L32 57 L9 38 L39 36Z" fill="#F5C451" stroke="#B9802A" stroke-width="3" stroke-linejoin="round"/><circle cx="42" cy="40" r="5" fill="#FFF3CC"/>' },
  { id: "anchor", name: "Якорь", svg: '<circle cx="50" cy="18" r="9" fill="none" stroke="#4F6F7C" stroke-width="6"/><path d="M50 27 V86" stroke="#4F6F7C" stroke-width="8" stroke-linecap="round"/><path d="M34 42 H66" stroke="#4F6F7C" stroke-width="7" stroke-linecap="round"/><path d="M16 60 Q20 88 50 88 Q80 88 84 60" stroke="#4F6F7C" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M10 64 L16 54 L24 64Z M76 64 L84 54 L90 64Z" fill="#4F6F7C"/>' }
];

/* ============ ДЕКОРАЦИИ ============ */
function sky(bg) { const s = el("div", "sky"); s.style.background = bg; return s; }
function sunAt(x, y, sz = 120) { const s = el("div", "sunwrap", stage, ART.sun); s.style.width = s.style.height = sz + "px"; s.style.left = x + "px"; s.style.top = y + "px"; return s; }
function clouds(n, top = 0.2, bottom = 0.46) {
  const { H } = size();
  for (let i = 0; i < n; i++) {
    const c = el("div", "cloud", stage, ART.cloud); const w = rnd(110, 170);
    c.style.width = w + "px"; c.style.height = (w / 2) + "px"; c.style.top = (H * rnd(top, bottom)) + "px";
    c.style.opacity = rnd(.75, .95).toFixed(2); c.style.animationDuration = rnd(50, 80) + "s"; c.style.animationDelay = (-rnd(0, 70)) + "s";
  }
}
/* Три слоя холмов с градиентами: дальний, средний, ближний */
function hills(h = 0.3, pal = ["#A8D99A", "#7DC46D", "#5AAE57"]) {
  const g = el("div", "layer", stage, `<svg viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true"><defs>
    <linearGradient id="gH1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient>
    <linearGradient id="gH2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[1]}"/><stop offset="1" stop-color="${pal[2]}"/></linearGradient>
    <linearGradient id="gH3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[2]}"/><stop offset="1" stop-color="#3F8E46"/></linearGradient></defs>
    <path d="M0 40 Q70 8 150 30 T300 22 T400 30 V160 H0Z" fill="url(#gH1)" opacity=".85"/>
    <path d="M0 70 Q110 36 210 62 T400 56 V160 H0Z" fill="url(#gH2)"/>
    <path d="M0 100 Q130 76 250 96 T400 92 V160 H0Z" fill="url(#gH3)"/></svg>`);
  g.style.bottom = "0"; g.style.height = (h * 100) + "%";
  return g;
}
function vignette() { el("div", "vignette"); }
function puffs(x, y, n = 5, dx = 60) {
  for (let i = 0; i < n; i++) {
    const p = el("div", "puff"); p.style.left = x + "px"; p.style.top = y + "px";
    p.animate([{ transform: "translate(0,0) scale(.6)", opacity: .9 }, { transform: `translate(${dx + rnd(-15, 25)}px, ${rnd(-25, 25)}px) scale(1.6)`, opacity: 0 }], { duration: rnd(500, 900), easing: "ease-out" }).onfinish = () => p.remove();
  }
}
const fadeOut = (e, ms = 500) => e.animate([{ opacity: getComputedStyle(e).opacity }, { opacity: 0 }], { duration: ms, fill: "forwards" }).finished.then(() => e.remove()).catch(() => {});
const fadeIn = (e, ms = 500) => e.animate([{ opacity: 0, transform: "scale(.85)" }, { opacity: 1, transform: "scale(1)" }], { duration: ms, easing: "cubic-bezier(.2,1.4,.4,1)" });

/* Полёт по простой физике: подброс вверх с силой k (0..1) или падение с места, если k = 0 */
function flight(e, groundY, k) {
  const { W, H } = size();
  return new Promise(res => {
    const g = H * 2.0, top = e._y - k * (groundY - H * 0.3);
    let x = e._x, y = e._y, vy = k ? -Math.sqrt(2 * g * Math.max(10, e._y - top)) : 0, vx = rnd(-70, 70), t0 = performance.now(), last = t0, fell = false;
    if (k) Snd.whoosh(0.15 + 0.2 * k);
    const step = t => {
      const dt = Math.min(0.04, (t - last) / 1000); last = t;
      vy += g * dt * (vy > 0 ? 0.55 : 1);
      x = Math.max(50, Math.min(W - 50, x + vx * dt)); y += vy * dt;
      if (vy > 0 && !fell) { fell = true; Snd.fall(); }
      const wob = vy > 0 ? Math.sin((t - t0) / 90) * 14 : 0;
      e.style.transform = `rotate(${(vy * 0.03 + wob).toFixed(1)}deg)`;
      put(e, x + (vy > 0 ? Math.sin((t - t0) / 160) * 10 : 0), y);
      if (y >= groundY && vy > 0) { put(e, x, groundY); e.style.transform = "rotate(6deg)"; Snd.thud(0.35); return res(); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
/* Ждём, пока ребёнок смахнёт предмет вверх. Сила броска зависит от длины движения пальцем */
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

/* ============ ВСТУПЛЕНИЕ ============ */
async function chIntro() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#5FB4E6 0%,#A9DDF4 55%,#F6E7C4 100%)");
  const { W, H } = size(); sunAt(W * 0.74, H * 0.42, 150); clouds(3, 0.28, 0.46); hills(0.32); vignette();
  Snd.amb("wind", 0.7); fromDark(); await sleep(500);
  await say("intro1");
  await say("intro2");
  await say("intro3", { btn: "Бисмиллях" });
}

/* ============ ГЛАВА 1: НЕБО БЕЗ ОПОР ============ */
async function chSky() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#4FA8E0 0%,#9AD5F2 55%,#E6F6FC 100%)");
  const { W, H } = size(); sunAt(W * 0.8, H * 0.38, 140); clouds(3, 0.26, 0.44); hills(0.27); vignette();
  const groundY = H * 0.86;
  Snd.amb("wind"); fromDark(); await sleep(300);
  await chapterTitle(1, "Небо без опор", "k0");
  await say("k1");

  /* бумажный самолётик: всё, что подбросили, падает */
  const pl = obj("plane", ART.plane, W * 0.5, groundY, 96, 58); pl.style.zIndex = 5;
  fadeIn(pl);
  for (let i = 1; i <= 3; i++) {
    cue(i === 1 ? "k2" : i === 2 ? "k3" : "k4");
    const k = await swipeUp(pl);
    capNote.textContent = `Попытка ${i} из 3`;
    await flight(pl, groundY, k);
    await sleep(300);
  }
  await say("k5");
  fadeOut(pl);

  /* крыша на столбах */
  const ph = Math.min(H * 0.2, 150), pw = ph * 0.29, roofW = W * 0.5, top = groundY - ph;
  const pL = obj("pillar", ART.pillar, W * 0.32, groundY - ph / 2, pw, ph), pR = obj("pillar", ART.pillar, W * 0.68, groundY - ph / 2, pw, ph);
  const roof = obj("roof", ART.roof, W * 0.5, top - 10, roofW, 28);
  [pL, pR, roof].forEach(e => { e.style.zIndex = 5; fadeIn(e); });
  await sleep(400);
  cue("k6");
  await tapOnce(pL); Snd.whoosh(0.2);
  move(pL, -60, pL._y, 600, "ease-in");
  roof.style.transformOrigin = "100% 50%"; roof.style.transition = "transform .4s"; roof.style.transform = "rotate(-12deg)"; Snd.thud(0.25);
  await tapOnce(pR); Snd.whoosh(0.2);
  move(pR, W + 60, pR._y, 600, "ease-in");
  roof.style.transform = "rotate(4deg)";
  await move(roof, roof._x, groundY - 14, 520, "ease-in"); Snd.thud(0.8);
  roof.style.transform = "rotate(0deg)";
  await say("k7");

  /* верёвка к облаку проскакивает насквозь */
  const cl = obj("bigcloud", ART.cloud, W * 0.32, H * 0.4, 170, 85); cl.style.zIndex = 4; fadeIn(cl);
  cue("k8"); await tapOnce(cl);
  const svg = el("div", "layer", stage, `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="" stroke="#8E6A43" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`);
  svg.style.inset = "0"; svg.style.zIndex = 4;
  const rope = svg.querySelector("path");
  Snd.whoosh(0.25);
  const t0 = performance.now();
  await new Promise(r => { const f = t => { const k = Math.min(1, (t - t0) / 700), y = roof._y - (roof._y - cl._y) * k; rope.setAttribute("d", `M${roof._x} ${roof._y} Q${(roof._x + cl._x) / 2 + 20} ${(roof._y + y) / 2} ${roof._x + (cl._x - roof._x) * k} ${y}`); k < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); });
  puffs(cl._x, cl._y, 7, 0); Snd.noise({ kind: "pink", f: 900, dur: 0.4, gain: 0.2 });
  await sleep(250);
  const t1 = performance.now();
  await new Promise(r => { const f = t => { const k = Math.min(1, (t - t1) / 700); rope.setAttribute("d", `M${roof._x} ${roof._y} Q${(roof._x + cl._x) / 2} ${roof._y + 40} ${cl._x - 10} ${cl._y + (roof._y - cl._y) * k}`); svg.style.opacity = 1 - k * 0.8; k < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); });
  svg.remove();
  await say("k9");

  /* шарик лопается */
  const bal = obj("balloon", ART.balloon, roof._x, roof._y - 85, 56, 122); bal.style.zIndex = 4; fadeIn(bal);
  cue("k10"); await tapOnce(bal);
  Snd.whoosh(0.15);
  const riseY = H * 0.5;
  await Promise.all([move(bal, roof._x, riseY - 85, 2400, "ease-out"), move(roof, roof._x, riseY, 2400, "ease-out")]);
  await sleep(250);
  Snd.pop(); puffs(bal._x, bal._y - 25, 9, 0); bal.remove();
  roof.style.transition = "none";
  await flight(roof, groundY - 14, 0); roof.style.transform = "rotate(0deg)";
  await say("k11");

  /* огромное небо без опор */
  fadeOut(roof); fadeOut(cl);
  stage.querySelector(".sky").style.background = "linear-gradient(180deg,#2E86C9 0%,#7CC6EE 55%,#E6F6FC 100%)";
  Snd.gust(3);
  await say("k12");
  const misses = await choice("kq", [{ id: "kqa", icon: ICON.pillar }, { id: "kqc", ar: true, ok: true }, { id: "kqb", icon: ICON.cloud }], "kq_ok");
  await say("k_quran");
  await ayahCard("35:41");
  await say("k_end", { btn: "Субханаллах" });
  hideCap(); await award("cloud");
  return misses;
}

/* ============ ГЛАВА 2: РАЗНЫЕ ПЛОДЫ ============ */
async function chFruit() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#6CC0EA 0%,#B7E3F6 55%,#F4F0D8 100%)");
  const { W, H } = size(); const sun = sunAt(W * 0.8, H * 0.4, 130); clouds(2, 0.3, 0.42); hills(0.34, ["#B5DE98", "#8CCB72", "#69B65E"]); vignette();
  const groundY = H * 0.8;
  Snd.amb("wind", 0.8); fromDark(); await sleep(300);
  await chapterTitle(2, "Разные плоды", "f0");

  const tw = Math.min(W * 0.32, 160), th = tw * 1.42;
  const trees = [["apple", 0.2], ["palm", 0.5], ["vine", 0.8]].map(([k, fx]) => { const t = obj("tree", ART[k], W * fx, groundY - th / 2, tw, th); t.style.zIndex = 3; return t; });
  await say("f1");

  const jug = obj("jug", ART.jug, W * 0.5, H * 0.9, 84, 94); jug.style.zIndex = 8; fadeIn(jug);
  cue("f2"); await tapOnce(jug);
  jug.style.transition = "transform .4s"; jug.style.transform = "rotate(-30deg)";
  Snd.splash();
  for (const t of trees) {
    for (let i = 0; i < 6; i++) {
      const d = el("div", "drop"); d.style.zIndex = 7; put(d, jug._x - 20, jug._y - 40);
      d.animate([{ left: (jug._x - 20) + "px", top: (jug._y - 40) + "px" }, { left: (t._x + rnd(-10, 10)) + "px", top: (groundY - 6) + "px" }], { duration: 650, delay: i * 70, easing: "ease-in", fill: "forwards" }).onfinish = () => d.remove();
    }
    Snd.splash(); await sleep(550);
  }
  jug.style.transform = "rotate(0deg)"; await sleep(500); fadeOut(jug);
  for (const t of trees) { t.classList.add("grown"); Snd.sparkle(); await sleep(600); }
  await say("f3");
  await say("f4");

  /* стакан воды: из воды яблоко не сделать */
  const gl = obj("glass", ART.glass, W * 0.5, H * 0.87, 84, 115); gl.style.zIndex = 8; fadeIn(gl);
  const spoon = gl.querySelector(".spoon"); spoon.style.transformBox = "fill-box"; spoon.style.transformOrigin = "50% 0%";
  cue("f5");
  await taps(gl, 4, () => { Snd.splash(); spoon.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-16deg)" }, { transform: "rotate(12deg)" }, { transform: "rotate(0deg)" }], { duration: 450 }); });
  await say("f6");
  sun.style.zIndex = 9;
  cue("f7"); await tapOnce(sun);
  sun.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1.15)" }], { duration: 1200, fill: "forwards" });
  Snd.sparkle();
  gl.querySelector(".water").setAttribute("fill", "#9FD3EA");
  for (let i = 0; i < 8; i++) {
    const s = el("div", "steam"); s.style.zIndex = 9; put(s, gl._x + rnd(-18, 18), gl._y - 30);
    s.animate([{ transform: "translateY(0) scale(.6)", opacity: .8 }, { transform: "translateY(-70px) scale(1.7)", opacity: 0 }], { duration: 1500, delay: i * 200 }).onfinish = () => s.remove();
  }
  await sleep(1400);
  await say("f8");
  await say("f9");
  fadeOut(gl);
  const misses = await choice("fq", [{ id: "fqc", ar: true, ok: true }, { id: "fqa", icon: ICON.drop }, { id: "fqb", icon: ICON.soil }], "fq_ok");
  await say("f_quran");
  await ayahCard("13:4");
  await say("f_end", { btn: "Альхамдулиллях" });
  hideCap(); await award("date");
  return misses;
}

/* ============ ГЛАВА 3: КОРАБЛЬ И ВЕТЕР ============ */
function windLines(n, top, bottom) {
  const { H } = size();
  for (let i = 0; i < n; i++) {
    const w = el("div", "windline"); w.style.top = (H * rnd(top, bottom)) + "px"; w.style.left = "0px"; w.style.width = rnd(50, 120) + "px"; w.style.zIndex = 6;
    w.style.animationDelay = (i * rnd(0.08, 0.2)) + "s"; w.style.animationDuration = rnd(0.9, 1.4) + "s";
    setTimeout(() => w.remove(), 2500 + i * 200);
  }
}
async function chShip() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#5AB2E4 0%,#A9DCF3 60%,#E9F6FB 100%)");
  const { W, H } = size(); sunAt(W * 0.8, H * 0.36, 140); clouds(3, 0.26, 0.42);
  const seaTop = H * 0.58;
  const isl = obj("island", ART.island, W * 0.2, seaTop - 18, 180, 72); isl.style.opacity = .85;
  const wave = (cls, top, fill, flip) => `<svg class="wave ${cls}" viewBox="0 0 800 44" preserveAspectRatio="none" style="top:${top}"><path d="M0 22 ${Array.from({ length: 16 }, (_, i) => `Q${i * 50 + 25} ${(i % 2) ^ flip ? 38 : 6} ${i * 50 + 50} 22`).join(" ")} V44 H0Z" fill="${fill}"/></svg>`;
  const sea = el("div", "sea", stage, wave("", "-22px", "#4DB0D8", 0) + wave("w2", "18%", "#3C9CC8", 1) + wave("w3", "52%", "#2C80AE", 0));
  sea.style.top = seaTop + "px";
  for (let i = 0; i < 9; i++) { const g = el("div", "glint", sea); g.style.left = rnd(5, 92) + "%"; g.style.top = rnd(12, 80) + "%"; g.style.animationDelay = rnd(0, 3) + "s"; }
  const sz = Math.min(W * 0.5, 220);
  const ship = obj("ship", `<div class="bob" style="width:100%;height:100%">${ART.ship}</div>`, -sz, seaTop - sz * 0.2, sz, sz);
  ship.style.zIndex = 5; vignette();
  Snd.amb("sea"); fromDark(); await sleep(300);
  await chapterTitle(3, "Корабль и ветер", "s0");

  Snd.gust(4); windLines(10, 0.25, 0.55);
  const sail = move(ship, W * 0.62, ship._y, 4200, "ease-out");
  await say("s1"); await sail;

  ship.classList.add("slack");
  await say("s2");

  cue("s3");
  await taps(ship, 4, () => {
    Snd.whoosh(0.12); puffs(ship._x - sz * 0.3, ship._y - sz * 0.1, 3, 30);
    ship.animate([{ translate: "-50% -50%" }, { translate: "calc(-50% + 6px) -50%" }, { translate: "-50% -50%" }], { duration: 500 });
  });
  await say("s4");

  const fan = obj("fan", ART.fan, W * 0.2, seaTop - 80, 92, 74);
  fan.style.zIndex = 6; fan.style.rotate = "70deg"; fadeIn(fan);
  cue("s5");
  await taps(fan, 5, () => { Snd.whoosh(0.2); puffs(fan._x + 30, fan._y, 4, ship._x - fan._x - 60); });
  ship.animate([{ rotate: "0deg" }, { rotate: "1.5deg" }, { rotate: "0deg" }], { duration: 600 });
  await say("s6");
  fadeOut(fan);

  const efan = obj("efan", ART.efan, W * 0.18, seaTop - 46, 92, 129);
  efan.style.zIndex = 6; fadeIn(efan);
  const blades = efan.querySelector(".fanblades");
  cue("s7"); await tapOnce(efan);
  blades.classList.add("spin"); Snd.hum(4.5);
  const blow = setInterval(() => puffs(efan._x + 40, efan._y - 18, 2, ship._x - efan._x - 70), 300);
  ship.animate([{ translate: "-50% -50%" }, { translate: "calc(-50% + 4px) -50%" }, { translate: "-50% -50%" }], { duration: 900, iterations: 2 });
  await sleep(2600); blades.classList.replace("spin", "slow"); await sleep(1600);
  clearInterval(blow); blades.classList.remove("slow");
  await say("s8");
  fadeOut(efan);

  await say("s9", { btn: "Попросить Аллаха" });
  hideCap(); await sleep(600);
  Snd.gust(5); windLines(18, 0.2, 0.6);
  await sleep(500); ship.classList.remove("slack");
  const go = move(ship, W + sz, ship._y, 5200, "ease-in");
  setTimeout(() => windLines(14, 0.2, 0.6), 1500);
  await say("s10"); await go;

  const misses = await choice("sq", [{ id: "sqa", icon: ICON.sail }, { id: "sqb", icon: ICON.fan }, { id: "sqc", ar: true, ok: true }], "sq_ok");
  await say("s_quran");
  await ayahCard("42:32-33");
  await say("s_end");
  hideCap(); await award("anchor");
  return misses;
}

/* ============ ГЛАВА 4: ГОРЫ ============ */
function mountainsLayer(h = 0.42) {
  const g = el("div", "layer", stage, `<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>
    <linearGradient id="gMt1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DB4C2"/><stop offset="1" stop-color="#7F98A8"/></linearGradient>
    <linearGradient id="gMt2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7D93A2"/><stop offset="1" stop-color="#5F7889"/></linearGradient></defs>
    <path d="M-20 200 L60 70 L110 120 L170 40 L240 130 L300 60 L420 200Z" fill="url(#gMt1)" opacity=".8"/>
    <path d="M60 70 L46 93 L58 88 L66 98 L74 86Z M170 40 L152 70 L166 63 L176 74 L186 62Z M300 60 L284 86 L298 80 L306 90 L316 79Z" fill="#fff" opacity=".9"/>
    <path d="M-20 200 L90 110 L150 150 L230 90 L330 160 L420 120 L420 200Z" fill="url(#gMt2)"/>
    <path d="M230 90 L216 106 L228 102 L236 110 L245 101Z" fill="#fff" opacity=".85"/></svg>`);
  g.style.bottom = "18%"; g.style.height = (h * 100) + "%";
  return g;
}
async function chMountain() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#5AAEE0 0%,#A6D8F2 60%,#E6F5FB 100%)");
  const { W, H } = size(); sunAt(W * 0.2, H * 0.34, 120); clouds(2, 0.26, 0.4); mountainsLayer(); hills(0.26, ["#B9D98F", "#94C46E", "#73AE57"]); vignette();
  const groundY = H * 0.86;
  Snd.amb("wind"); fromDark(); await sleep(300);
  await chapterTitle(4, "Горы", "m0");
  await say("m1");

  /* куча песка рассыпается */
  const pile = obj("pile", ART.sand, W * 0.5, groundY - 20, 120, 70); pile.style.zIndex = 5; pile.style.transformOrigin = "50% 100%";
  let k = 0.6; pile.style.transform = `scale(${k})`; fadeIn(pile);
  cue("m2");
  await taps(pile, 5, () => { k = Math.min(1.5, k + 0.18); pile.style.transform = `scale(${k})`; Snd.noise({ kind: "pink", type: "highpass", f: 2500, dur: 0.25, gain: 0.15 }); });
  await sleep(400);
  Snd.gust(2.5);
  for (let i = 0; i < 4; i++) { puffs(pile._x + rnd(-30, 30), pile._y - 20 * k, 6, 140); await sleep(250); }
  pile.style.transition = "transform 1.2s ease-in, opacity 1.2s"; pile.style.transform = "scale(1.4, .25)"; pile.style.opacity = ".5";
  await sleep(900);
  await say("m3");
  fadeOut(pile);

  /* палатка и колышки */
  const tw = Math.min(W * 0.52, 220);
  const tent = obj("tent", ART.tent, W * 0.5, groundY - tw * 0.36, tw, tw * 0.75); tent.style.zIndex = 5; tent.style.transformOrigin = "50% 100%";
  fadeIn(tent);
  const sway = tent.animate([{ rotate: "-5deg" }, { rotate: "6deg" }, { rotate: "-5deg" }], { duration: 900, iterations: Infinity, easing: "ease-in-out" });
  Snd.gust(3);
  const stakes = [-1, 1].map(d => { const st = obj("stake", ART.stake, W * 0.5 + d * tw * 0.56, groundY - 34, 26, 54); st.style.zIndex = 6; fadeIn(st); return st; });
  cue("m4");
  for (const st of stakes) {
    await tapOnce(st);
    for (let i = 0; i < 3; i++) { Snd.thud(0.5); Snd.noise({ f: 1600, q: 3, dur: 0.05, gain: 0.25, attack: 0.002 }); await move(st, st._x, st._y + 6, 120, "ease-in"); await sleep(120); }
  }
  sway.cancel(); tent.animate([{ rotate: "2deg" }, { rotate: "0deg" }], { duration: 400 });
  await say("m5");
  await say("m6");
  const misses = await choice("mq", [{ id: "mqa", icon: ICON.sand }, { id: "mqb", icon: ICON.wind }, { id: "mqc", ar: true, ok: true }], "mq_ok");
  await say("m_quran");
  await ayahCard("78:6-7");
  await say("m_end", { btn: "Аллаху Акбар" });
  hideCap(); await award("stone");
  return misses;
}

/* ============ ГЛАВА 5: СОЛНЦЕ-СВЕТИЛЬНИК ============ */
function glowSpot(x, y, r, color = "255,214,130") {
  const g = el("div", "glowspot");
  Object.assign(g.style, { left: (x - r) + "px", top: (y - r) + "px", width: 2 * r + "px", height: 2 * r + "px", background: `radial-gradient(circle, rgba(${color},.75) 0%, rgba(${color},.3) 45%, rgba(${color},0) 70%)` });
  g.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)" }], { duration: 600, easing: "ease-out" });
  return g;
}
async function chSunLamp() {
  await toDark(); clearStage();
  const sk = sky("linear-gradient(180deg,#0E2238 0%,#1D3D5C 60%,#35577A 100%)");
  const { W, H } = size(); hills(0.34, ["#5D7F6A", "#4C6E5A", "#3B5C4A"]);
  const stars = el("div", "layer", stage, `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="twinkle" fill="#FFF6DD">${Array.from({ length: 40 }, () => `<circle cx="${rnd(0, 400).toFixed(0)}" cy="${rnd(0, 260).toFixed(0)}" r="${rnd(0.6, 1.6).toFixed(1)}"/>`).join("")}</g></svg>`);
  stars.style.inset = "0 0 40% 0";
  const frost = el("div", "layer", stage, Array.from({ length: 26 }, () => `<i class="frost" style="left:${rnd(2, 98).toFixed(1)}%;top:${rnd(10, 90).toFixed(1)}%"></i>`).join(""));
  frost.style.bottom = "0"; frost.style.height = "30%";
  const night = el("div", "nightveil"); vignette();
  const groundY = H * 0.84;
  Snd.amb("wind", 0.6); fromDark(); await sleep(300);
  await chapterTitle(5, "Солнце-светильник", "l0");
  await say("l1");

  const lamp = obj("lamp", ART.lantern, W * 0.28, groundY - 30, 50, 74); lamp.style.zIndex = 8; fadeIn(lamp);
  cue("l2"); await tapOnce(lamp);
  lamp.querySelector(".flamel").setAttribute("opacity", "1"); Snd.noise({ type: "highpass", f: 2500, dur: 0.08, gain: 0.3, attack: 0.002 });
  const g1 = glowSpot(lamp._x, lamp._y, 110); g1.style.zIndex = 7;
  await say("l3");

  const heat = obj("heater", ART.heater, W * 0.72, groundY - 24, 80, 72); heat.style.zIndex = 8; fadeIn(heat);
  cue("l4"); await tapOnce(heat);
  heat.querySelectorAll(".coils path").forEach(c => c.setAttribute("stroke", "#F07A55")); Snd.hum(1.2);
  const g2 = glowSpot(heat._x, heat._y, 100, "255,150,90"); g2.style.zIndex = 7;
  await say("l5");

  cue("l6");
  const field = el("div", "tapfield"); field.style.zIndex = 6;
  let placed = 0;
  await new Promise(r => {
    const end = () => { field.remove(); r(); };
    field.addEventListener("pointerdown", ev => {
      const p = local(ev); if (p.y < H * 0.45 || placed >= 5) return;
      placed++; Snd.tap();
      const l = obj("lamp", ART.lantern, p.x, p.y, 34, 50); l.style.zIndex = 8; l.querySelector(".flamel").setAttribute("opacity", "1"); fadeIn(l);
      const g = glowSpot(p.x, p.y, 70); g.style.zIndex = 7;
      if (placed >= 5) setTimeout(end, 600);
    });
    setTimeout(end, 15000);
  });
  await say("l7");
  await say("l8", { btn: "Смотрю" });
  hideCap();

  /* восход: светло и тепло сразу везде */
  const sun = sunAt(W * 0.5, H * 0.75, 170); stage.insertBefore(sun, sk.nextSibling);   // за холмами
  sun.animate([{ top: (H * 0.75) + "px" }, { top: (H * 0.3) + "px" }], { duration: 3500, easing: "ease-out", fill: "forwards" });
  sk.style.transition = "background 3s"; sk.style.background = "linear-gradient(180deg,#5AB2E4 0%,#A9DCF3 60%,#F3E8C4 100%)";
  [night, stars, frost].forEach(e => { e.style.transition = "opacity 3s"; e.style.opacity = "0"; });
  stage.querySelectorAll(".glowspot").forEach(g => { g.style.transition = "opacity 2s"; g.style.opacity = "0"; });
  Snd.amb("meadow", 0.8); Snd.sparkle();
  await sleep(3200);
  await say("l9");
  const misses = await choice("lq", [{ id: "lqa", icon: ICON.lantern }, { id: "lqc", ar: true, ok: true }, { id: "lqb", icon: ICON.heater }], "lq_ok");
  await say("l_quran");
  await ayahCard("71:15-16");
  await say("l_end", { btn: "Альхамдулиллях" });
  hideCap(); await award("sunray");
  return misses;
}

/* ============ ГЛАВА 6: ЗВЁЗДЫ ============ */
async function chStars() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#081A2C 0%,#12304A 60%,#1D4462 100%)");
  const { W, H } = size();
  const seaTop = H * 0.6;
  const stars = el("div", "layer", stage, `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="twinkle" fill="#FFF6DD">${Array.from({ length: 70 }, () => `<circle cx="${rnd(0, 400).toFixed(0)}" cy="${rnd(0, 280).toFixed(0)}" r="${rnd(0.6, 1.8).toFixed(1)}"/>`).join("")}</g></svg>`);
  stars.style.inset = "0 0 40% 0"; stars.style.opacity = "0";
  const guide = obj("guide", `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="28" fill="rgba(255,236,170,.25)"/><path d="M30 6 L34 26 L54 30 L34 34 L30 54 L26 34 L6 30 L26 26Z" fill="#FFF3C4"/></svg>`, W * 0.78, H * 0.2, 60, 60);
  guide.style.opacity = "0"; guide.style.zIndex = 2;
  const wave = (cls, top, fill, flip) => `<svg class="wave ${cls}" viewBox="0 0 800 44" preserveAspectRatio="none" style="top:${top}"><path d="M0 22 ${Array.from({ length: 16 }, (_, i) => `Q${i * 50 + 25} ${(i % 2) ^ flip ? 38 : 6} ${i * 50 + 50} 22`).join(" ")} V44 H0Z" fill="${fill}"/></svg>`;
  const lh = obj("lighthouse", ART.lighthouse, W * 0.86, seaTop - 40, 110, 110); lh.style.zIndex = 2;
  const sea = el("div", "sea night", stage, wave("", "-22px", "#1F4E6E", 0) + wave("w2", "18%", "#183F5A", 1) + wave("w3", "52%", "#123349", 0));
  sea.style.top = seaTop + "px";
  const cl = [0.15, 0.45, 0.78].map((fx, i) => { const c = el("div", "cloud dark", stage, ART.cloud); Object.assign(c.style, { left: (W * fx - 110) + "px", top: (H * (0.12 + i * 0.05)) + "px", width: "240px", height: "120px", animation: "none", zIndex: 3 }); return c; });
  const sz = Math.min(W * 0.42, 190);
  const ship = obj("ship", `<div class="bob" style="width:100%;height:100%">${ART.ship}</div>`, W * 0.3, seaTop - sz * 0.2, sz, sz); ship.style.zIndex = 5;
  vignette();
  Snd.amb("sea", 0.7); fromDark(); await sleep(300);
  await chapterTitle(6, "Звёзды", "z0");
  await say("z1");

  const lamp = obj("lamp", ART.lantern, ship._x + sz * 0.42, ship._y + sz * 0.05, 34, 50); lamp.style.zIndex = 6;
  cue("z2"); await tapOnce(lamp);
  lamp.querySelector(".flamel").setAttribute("opacity", "1");
  const g = glowSpot(lamp._x, lamp._y + 20, 90); g.style.zIndex = 5;
  await say("z3");

  cue("z4");
  const field = el("div", "tapfield"); field.style.zIndex = 4;
  await new Promise(r => {
    let fin = false; const end = () => { if (fin) return; fin = true; field.remove(); r(); };
    field.addEventListener("pointerdown", ev => {
      const p = local(ev); if (p.y > seaTop - 20) return;
      Snd.sparkle();
      const st = obj("mystar", `<svg viewBox="0 0 48 48" aria-hidden="true">${ICON.star}</svg>`, p.x, p.y, 40, 40); st.style.zIndex = 4;
      st.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 1, transform: "scale(1.1)", offset: .3 }, { opacity: 0, transform: "scale(.2) translateY(60px)" }], { duration: 1800, easing: "ease-in", fill: "forwards" });
      setTimeout(end, 1900);
    });
    setTimeout(end, 15000);
  });
  await say("z5");
  await say("z6", { btn: "Смотрю" });
  hideCap();

  cl.forEach((c, i) => c.animate([{ transform: "translateX(0)", opacity: 1 }, { transform: `translateX(${(i % 2 ? 1 : -1) * W * 0.8}px)`, opacity: 0 }], { duration: 3000, easing: "ease-in", fill: "forwards" }));
  Snd.gust(3);
  stars.style.transition = "opacity 3s"; stars.style.opacity = "1";
  guide.style.transition = "opacity 3s"; guide.style.opacity = "1";
  await sleep(2600);
  const path = el("div", "layer", stage, `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="M${guide._x} ${guide._y + 26} L${lh._x} ${lh._y - 40}" stroke="#FFF3C4" stroke-width="2.5" stroke-dasharray="6 7" fill="none" opacity=".8"/></svg>`);
  path.style.inset = "0"; path.style.zIndex = 2; fadeIn(path, 900);
  Snd.sparkle();
  await say("z7");
  cue("z8"); await tapOnce(ship);
  Snd.gust(3);
  await move(ship, lh._x - sz * 0.95, ship._y, 4200, "ease-in-out");
  lh.querySelector(".lhlamp").setAttribute("fill", "#FFF6C9"); const lg = glowSpot(lh._x, lh._y - 38, 70); lg.style.zIndex = 3;
  await say("z9");
  const misses = await choice("zq", [{ id: "zqa", icon: ICON.lantern }, { id: "zqb", icon: ICON.wheel }, { id: "zqc", ar: true, ok: true }], "zq_ok");
  await say("z_quran");
  await ayahCard("16:16");
  await say("z_end");
  hideCap(); await award("star");
  return misses;
}

/* ============ ФИНАЛ ============ */
async function chFinal() {
  await toDark(); clearStage();
  sky("linear-gradient(180deg,#24557A 0%,#C98A6B 55%,#F6D79A 100%)");
  const { W, H } = size(); sunAt(W * 0.5, H * 0.44, 170); hills(0.3, ["#7E9E78", "#5E8A64", "#3F6E52"]); vignette();
  el("div", "items-row", stage, ITEMS.filter(i => Save.d.items.includes(i.id)).map(i => `<svg viewBox="0 0 100 100" aria-hidden="true">${i.svg}</svg>`).join(""));
  Snd.amb("wind", 0.6); fromDark(); await sleep(500);
  celebrate();
  await say("fin1");
  await say("fin2");
  await say("fin3", { btn: "В меню" });
  hideCap();
}

/* ============ ГЛАВЫ И МИРЫ ============ */
const CHAPTERS = [
  { id: "sky", name: "Небо без опор", icon: ICON.sky, fn: chSky },
  { id: "fruit", name: "Разные плоды", icon: ICON.fruitc, fn: chFruit },
  { id: "ship", name: "Корабль и ветер", icon: ICON.ship, fn: chShip },
  { id: "mountain", name: "Горы", icon: ICON.mountain, fn: chMountain },
  { id: "sunlamp", name: "Солнце-светильник", icon: ICON.sunc, fn: chSunLamp },
  { id: "stars", name: "Звёзды", icon: ICON.star, fn: chStars }
];
/* Главы, которых ещё нет, записаны просто названием и показываются как "скоро" */
const WORLDS = [
  { t: "Кто всё создал?", s: "Знамения Аллаха вокруг нас", ch: ["sky", "fruit", "ship", "mountain", "sunlamp", "stars", "Сладкая и солёная вода", "День и ночь"] },
  { t: "Только Аллаху", s: "Кому поклоняться и у кого просить помощи", ch: ["Дуа Юнуса", "Аллах слышит всех", "Никто, кроме Аллаха", "Защита у Аллаха"] },
  { t: "Во что верит мусульманин", s: "Шесть столпов веры", ch: ["Вера в Аллаха", "Ангелы", "Книги", "Пророки", "Судный день", "Предопределение"] },
  { t: "Как живёт мусульманин", s: "Пять столпов ислама", ch: ["Шахада", "Омовение", "Намаз", "Пост", "Закят", "Хадж"] },
  { t: "Сокровища Корана", s: "Смысл коротких сур", ch: ["Аль-Фатиха", "Аль-Ихлас", "Аль-Фаляк", "Ан-Нас"] }
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
  const any = Object.keys(Save.d.done).length > 0, next = nextUndone();
  $("#goCont").hidden = !any || next == null;
  $("#go").textContent = any ? "Начать сначала" : "Начать";
  $("#go").classList.toggle("glass", any && next != null);
  $("#start").classList.remove("off");
}
async function pickChapter() {
  const k = await chaptersSheet();
  if (k == null) return;
  if (running) { try { sessionStorage.setItem("ayaty_jump", k); } catch (e) {} location.reload(); return; }
  play(k, false);
}

Save.load(); Save.d.items = Save.d.items.filter(i => ITEMS.some(x => x.id === i)); updateBag(false);
Voice.load().then(() => { $("#goVoice b").textContent = voiceName(); });
showStart();
$("#go").onclick = () => { Snd.tap(); play(0, true); };
$("#goCont").onclick = () => { Snd.tap(); const k = nextUndone(); if (k != null) play(k, false); };
$("#goCh").onclick = () => { Snd.tap(); pickChapter(); };
$("#goVoice").onclick = async () => { Snd.tap(); await voiceSheet(); $("#goVoice b").textContent = voiceName(); };
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
