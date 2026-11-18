// Catalogue of objects. `h` is the real height in metres; `svg` is drawn in any
// coordinate system with y pointing down: the client measures each drawing's
// bounding box and maps its bottom edge onto the ground line.
// Shared by the server (heights, pair selection) and the client (drawing).

const HOLE = 'fill="#fff" fill-opacity=".38"';

/** A thick straight segment, as a polygon (keeps the drawing fill-only). */
function bar(x1, y1, x2, y2, w) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / len) * (w / 2);
  const ny = ((x2 - x1) / len) * (w / 2);
  const p = [
    [x1 + nx, y1 + ny],
    [x2 + nx, y2 + ny],
    [x2 - nx, y2 - ny],
    [x1 - nx, y1 - ny],
  ];
  return `<polygon points="${p.map((q) => q.map((v) => v.toFixed(2)).join(',')).join(' ')}"/>`;
}

/** A ring (wheel, rim) as an even-odd path. */
function ring(cx, cy, r, t) {
  const ri = r - t;
  return `<path fill-rule="evenodd" d="M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z M${cx - ri} ${cy}a${ri} ${ri} 0 1 0 ${2 * ri} 0a${ri} ${ri} 0 1 0 ${-2 * ri} 0Z"/>`;
}

function windowsGrid(x0, y0, cols, rows, w, h, gx, gy = 0) {
  let s = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      s += `<rect ${HOLE} x="${x0 + c * (w + gx)}" y="${y0 + r * (h + gy)}" width="${w}" height="${h}" rx="1"/>`;
    }
  }
  return s;
}

export const OBJECTS = [
  {
    id: 'person',
    name: 'Une personne',
    h: 1.75,
    svg: `<circle cx="20" cy="9" r="8"/><path d="M9 20 Q20 15 31 20 L36 56 L31 57 L28 36 L28 100 L21.5 100 L20.5 62 L19.5 62 L18.5 100 L12 100 L12 36 L9 57 L4 56 Z"/>`,
  },
  {
    id: 'child',
    name: 'Un enfant de 6 ans',
    h: 1.15,
    svg: `<circle cx="20" cy="13" r="12"/><path d="M8 28 Q20 24 32 28 L36 60 L31 61 L28 42 L28 100 L21.5 100 L20.5 70 L19.5 70 L18.5 100 L12 100 L12 42 L9 61 L4 60 Z"/>`,
  },
  {
    id: 'giraffe',
    name: 'Une girafe',
    h: 5.3,
    svg: `<ellipse cx="62" cy="58" rx="26" ry="13"/><rect x="40" y="60" width="5" height="40"/><rect x="48" y="62" width="5" height="38"/><rect x="72" y="60" width="5" height="40"/><rect x="80" y="60" width="5" height="40"/><path d="M38 56 L50 50 L26 12 L17 15 Z"/><ellipse cx="17" cy="12" rx="11" ry="5.5" transform="rotate(-20 17 12)"/><rect x="18" y="0" width="2.5" height="8"/><rect x="23" y="1" width="2.5" height="7"/>${bar(86, 54, 93, 76, 2)}`,
  },
  {
    id: 'elephant',
    name: 'Un éléphant d’Afrique',
    h: 3.3,
    svg: `<ellipse cx="72" cy="42" rx="44" ry="38"/><rect x="40" y="62" width="15" height="38" rx="3"/><rect x="58" y="66" width="13" height="34" rx="3"/><rect x="86" y="62" width="15" height="38" rx="3"/><rect x="100" y="66" width="12" height="34" rx="3"/><circle cx="30" cy="34" r="24"/><path d="M10 38 Q2 60 6 92 L14 92 Q12 64 20 46 Z"/>${bar(114, 32, 121, 60, 2.5)}`,
  },
  {
    id: 'cat',
    name: 'Un chat',
    h: 0.3,
    svg: `<ellipse cx="55" cy="52" rx="30" ry="14"/><rect x="30" y="56" width="6" height="34" rx="2"/><rect x="40" y="58" width="6" height="32" rx="2"/><rect x="66" y="56" width="6" height="34" rx="2"/><rect x="76" y="56" width="6" height="34" rx="2"/><circle cx="22" cy="36" r="13"/><path d="M11 30 L12 14 L20 25 Z"/><path d="M24 24 L32 12 L33 28 Z"/>${bar(84, 48, 94, 26, 5)}`,
  },
  {
    id: 'dog',
    name: 'Un labrador',
    h: 0.75,
    svg: `<ellipse cx="55" cy="50" rx="32" ry="14"/><rect x="28" y="52" width="7" height="40" rx="2"/><rect x="38" y="54" width="7" height="38" rx="2"/><rect x="68" y="52" width="7" height="40" rx="2"/><rect x="78" y="52" width="7" height="40" rx="2"/><path d="M30 46 L22 22 L32 18 L40 40 Z"/><ellipse cx="22" cy="20" rx="13" ry="10"/><ellipse cx="8" cy="24" rx="8" ry="5"/><ellipse cx="28" cy="22" rx="5" ry="11" transform="rotate(15 28 22)"/>${bar(86, 44, 98, 26, 5)}`,
  },
  {
    id: 'horse',
    name: 'Un cheval',
    h: 2.3,
    svg: `<ellipse cx="70" cy="45" rx="36" ry="16"/><rect x="40" y="50" width="7" height="50" rx="2"/><rect x="50" y="52" width="7" height="48" rx="2"/><rect x="86" y="50" width="7" height="50" rx="2"/><rect x="96" y="50" width="7" height="50" rx="2"/><polygon points="38,44 54,40 32,6 22,10"/><polygon points="22,4 34,8 14,30 4,26"/><polygon points="26,6 28,0 31,7"/>${bar(105, 40, 112, 70, 5)}`,
  },
  {
    id: 'hen',
    name: 'Une poule',
    h: 0.45,
    svg: `<ellipse cx="50" cy="52" rx="30" ry="22"/><path d="M72 40 L92 24 L86 52 Z"/><circle cx="28" cy="28" r="12"/><path d="M18 26 L8 30 L18 33 Z"/><path d="M22 16 Q26 8 30 16 Q34 8 37 18 Z"/>${bar(46, 70, 44, 100, 3)}${bar(58, 70, 60, 100, 3)}`,
  },
  {
    id: 'ostrich',
    name: 'Une autruche',
    h: 2.6,
    svg: `<ellipse cx="62" cy="42" rx="30" ry="16"/><path d="M84 34 Q102 30 98 52 Z"/>${bar(40, 38, 30, 4, 5)}<ellipse cx="29" cy="4" rx="7" ry="4"/>${bar(56, 52, 50, 100, 3.5)}${bar(68, 52, 74, 100, 3.5)}`,
  },
  {
    id: 'penguin',
    name: 'Un manchot empereur',
    h: 1.15,
    svg: `<ellipse cx="30" cy="58" rx="24" ry="40"/><circle cx="30" cy="16" r="14"/><path d="M42 18 L56 22 L42 24 Z"/><ellipse ${HOLE} cx="34" cy="62" rx="14" ry="30"/><ellipse cx="22" cy="97" rx="8" ry="3"/><ellipse cx="38" cy="97" rx="8" ry="3"/>`,
  },
  {
    id: 'trex',
    name: 'Un tyrannosaure',
    h: 4,
    svg: `<path d="M0 40 Q0 20 30 18 L60 22 Q70 26 66 38 L56 44 Q90 40 120 34 Q170 30 222 52 Q170 50 140 58 L132 64 L140 100 L124 100 L118 70 L100 72 L106 100 L90 100 L86 66 Q70 60 60 52 L40 52 Q24 56 10 52 Z"/>${bar(64, 54, 70, 64, 3)}`,
  },
  {
    id: 'car',
    name: 'Une citadine',
    h: 1.45,
    svg: `<path d="M2 70 Q2 54 14 52 L44 48 L62 28 Q66 24 74 24 L128 24 Q136 24 142 30 L160 50 Q178 52 180 62 L180 76 L2 76 Z"/><path ${HOLE} d="M68 32 L54 47 L96 47 L96 31 L74 31 Z"/><path ${HOLE} d="M102 31 L102 47 L150 47 L136 33 Q132 31 128 31 Z"/><circle cx="40" cy="80" r="18"/><circle cx="146" cy="80" r="18"/>`,
  },
  {
    id: 'bus',
    name: 'Un bus à impériale',
    h: 4.4,
    svg: `<rect x="0" y="0" width="250" height="88" rx="10"/>${windowsGrid(14, 10, 7, 1, 26, 20, 6)}${windowsGrid(14, 46, 6, 1, 26, 20, 6)}<rect ${HOLE} x="210" y="46" width="22" height="36" rx="2"/><circle cx="50" cy="90" r="12"/><circle cx="200" cy="90" r="12"/>`,
  },
  {
    id: 'bike',
    name: 'Un vélo',
    h: 1.05,
    svg: `${ring(30, 72, 28, 5)}${ring(122, 72, 28, 5)}${bar(30, 72, 62, 72, 4)}${bar(62, 72, 55, 34, 4)}${bar(55, 34, 30, 72, 4)}${bar(55, 34, 106, 34, 4)}${bar(106, 34, 62, 72, 4)}${bar(106, 34, 122, 72, 4)}${bar(55, 34, 52, 22, 4)}<rect x="40" y="16" width="22" height="6" rx="3"/>${bar(106, 34, 100, 14, 4)}${bar(98, 14, 114, 12, 4)}`,
  },
  {
    id: 'door',
    name: 'Une porte d’entrée',
    h: 2.1,
    svg: `<rect width="46" height="104" rx="1"/><rect ${HOLE} x="6" y="8" width="34" height="38" rx="1"/><rect ${HOLE} x="6" y="56" width="34" height="40" rx="1"/><circle cx="38" cy="52" r="2.5"/>`,
  },
  {
    id: 'fridge',
    name: 'Un frigo américain',
    h: 1.8,
    svg: `<rect width="90" height="180" rx="5"/><rect ${HOLE} x="44" y="4" width="2" height="172"/>${bar(36, 50, 36, 90, 4)}${bar(54, 50, 54, 90, 4)}`,
  },
  {
    id: 'chair',
    name: 'Une chaise',
    h: 0.9,
    svg: `<rect x="0" y="0" width="8" height="100"/><rect x="0" y="48" width="48" height="7"/>${bar(44, 52, 44, 100, 7)}<rect x="0" y="8" width="8" height="34"/><rect ${HOLE} x="2" y="12" width="4" height="26"/>`,
  },
  {
    id: 'bottle',
    name: 'Une bouteille d’eau 1,5 L',
    h: 0.33,
    svg: `<path d="M15 0 L25 0 L25 8 Q36 16 36 30 L36 100 Q36 104 32 104 L8 104 Q4 104 4 100 L4 30 Q4 16 15 8 Z"/><rect ${HOLE} x="4" y="46" width="32" height="24"/>`,
  },
  {
    id: 'can',
    name: 'Une canette',
    h: 0.122,
    svg: `<path d="M8 0 L46 0 L52 10 L52 90 L46 100 L8 100 L2 90 L2 10 Z"/><rect ${HOLE} x="2" y="30" width="50" height="34"/>`,
  },
  {
    id: 'mug',
    name: 'Une tasse à café',
    h: 0.095,
    svg: `<path d="M0 0 L70 0 L66 92 Q65 100 56 100 L14 100 Q5 100 4 92 Z"/>${ring(74, 40, 18, 7)}`,
  },
  {
    id: 'phone',
    name: 'Un smartphone',
    h: 0.15,
    svg: `<rect width="72" height="150" rx="12"/><rect ${HOLE} x="6" y="14" width="60" height="122" rx="4"/>`,
  },
  {
    id: 'ball',
    name: 'Un ballon de foot',
    h: 0.22,
    svg: `<circle cx="50" cy="50" r="50"/><polygon ${HOLE} points="50,32 67,44 61,64 39,64 33,44"/>`,
  },
  {
    id: 'hoop',
    name: 'Un panier de basket',
    h: 3.95,
    svg: `<rect x="0" y="0" width="7" height="100"/>${bar(4, 18, 30, 18, 4)}<rect x="28" y="0" width="5" height="30"/><rect x="33" y="22" width="16" height="2.5"/>${bar(36, 24.5, 39, 32, 1.2)}${bar(46, 24.5, 43, 32, 1.2)}`,
  },
  {
    id: 'lamp',
    name: 'Un lampadaire',
    h: 6,
    svg: `<rect x="18" y="8" width="4" height="92"/><path d="M18 9 Q18 0 34 0 L42 0 L42 4 L34 4 Q22 4 22 10 Z"/><path d="M36 3 L48 3 L46 9 L38 9 Z"/><rect x="12" y="94" width="16" height="6"/>`,
  },
  {
    id: 'tree',
    name: 'Un chêne',
    h: 20,
    svg: `<rect x="44" y="60" width="12" height="40"/><circle cx="50" cy="30" r="26"/><circle cx="30" cy="48" r="20"/><circle cx="70" cy="48" r="20"/><circle cx="50" cy="52" r="18"/>`,
  },
  {
    id: 'house',
    name: 'Une maison',
    h: 8,
    svg: `<path d="M10 45 L60 5 L110 45 Z"/><rect x="18" y="42" width="84" height="58"/><rect x="80" y="10" width="10" height="24"/><rect ${HOLE} x="30" y="54" width="18" height="16"/><rect ${HOLE} x="72" y="54" width="18" height="16"/><rect ${HOLE} x="52" y="74" width="16" height="26"/>`,
  },
  {
    id: 'building',
    name: 'Un immeuble de 10 étages',
    h: 31,
    svg: `<rect x="0" y="0" width="70" height="100"/>${windowsGrid(6, 4, 4, 10, 10, 6, 6, 3.6)}`,
  },
  {
    id: 'lighthouse',
    name: 'Un phare',
    h: 33,
    svg: `<path d="M16 100 L22 28 L42 28 L48 100 Z"/><rect x="18" y="20" width="28" height="8"/><rect ${HOLE} x="24" y="10" width="16" height="10"/><rect x="22" y="10" width="2" height="10"/><rect x="40" y="10" width="2" height="10"/><path d="M20 10 L32 0 L44 10 Z"/><rect ${HOLE} x="20" y="50" width="24" height="8"/><rect ${HOLE} x="18" y="76" width="28" height="8"/>`,
  },
  {
    id: 'turbine',
    name: 'Une éolienne',
    h: 140,
    svg: `<polygon points="48,40 52,40 54,140 46,140"/><circle cx="50" cy="40" r="3.5"/><polygon points="48.5,40 51.5,40 50.6,0 49.4,0"/><polygon points="51,38.5 49.6,41.6 84,60 84.6,59"/><polygon points="49,38.5 50.4,41.6 16,60 15.4,59"/>`,
  },
  {
    id: 'eiffel',
    name: 'La tour Eiffel',
    h: 330,
    svg: `<path d="M0 300 Q40 200 54 120 L57 40 L59 6 L60 0 L61 6 L63 40 L66 120 Q80 200 120 300 L96 300 Q78 252 60 252 Q42 252 24 300 Z"/><rect x="20" y="196" width="80" height="8"/><rect x="44" y="114" width="32" height="6"/><rect x="54" y="38" width="12" height="4"/>`,
  },
  {
    id: 'pyramid',
    name: 'La pyramide de Khéops',
    h: 139,
    svg: `<polygon points="0,139 115,0 230,139"/>`,
  },
];

export const OBJECTS_BY_ID = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));

/** Points for a guess, out of 100: 100 at the exact size, ~80 at 10 % off, ~50 at 30 % off. */
export function scoreGuess(guessRatio, trueRatio) {
  if (!(guessRatio > 0) || !(trueRatio > 0)) return 0;
  const err = Math.abs(Math.log(guessRatio / trueRatio));
  return Math.round(100 * Math.exp(-2.4 * err));
}

export const RATIO_MIN = 0.04;
export const RATIO_MAX = 25;
