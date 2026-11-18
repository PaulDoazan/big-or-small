// Catalogue of objects. `h` is the real height in metres; `svg` is drawn in any
// coordinate system with y pointing down: the client measures each drawing's
// bounding box and maps its bottom edge onto the ground line.
// Shared by the server (heights, pair selection) and the client (drawing).

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

// Photo-realistic silhouettes (CC0, see CREDITS.md) carry `src` + `aspect` (width / height of the
// cropped drawing); the few geometric objects keep an inline `svg` drawing.
export const OBJECTS = [
  { id: 'person', name: 'Un homme', h: 1.78, src: 'silhouettes/person.svg', aspect: 0.3268 },
  { id: 'woman', name: 'Une femme', h: 1.65, src: 'silhouettes/woman.svg', aspect: 0.3902 },
  { id: 'giraffe', name: 'Une girafe', h: 5.3, src: 'silhouettes/giraffe.svg', aspect: 0.7611 },
  { id: 'elephant', name: 'Un éléphant d’Afrique', h: 3.3, src: 'silhouettes/elephant.svg', aspect: 1.5515 },
  { id: 'cat', name: 'Un chat', h: 0.3, src: 'silhouettes/cat.svg', aspect: 1.2181 },
  { id: 'dog', name: 'Un golden retriever', h: 0.8, src: 'silhouettes/dog.svg', aspect: 1.622 },
  { id: 'horse', name: 'Un cheval', h: 1.65, src: 'silhouettes/horse.svg', aspect: 1.7798 },
  { id: 'hen', name: 'Une poule', h: 0.4, src: 'silhouettes/hen.svg', aspect: 0.7044 },
  { id: 'ostrich', name: 'Une autruche', h: 2.5, src: 'silhouettes/ostrich.svg', aspect: 0.8667 },
  { id: 'penguin', name: 'Un manchot empereur', h: 1.15, src: 'silhouettes/penguin.svg', aspect: 0.638 },
  { id: 'trex', name: 'Un tyrannosaure', h: 4, src: 'silhouettes/trex.svg', aspect: 2.0157 },
  { id: 'car', name: 'Une berline', h: 1.45, src: 'silhouettes/car.svg', aspect: 2.946 },
  { id: 'bus', name: 'Un bus à impériale', h: 4.4, src: 'silhouettes/bus.svg', aspect: 1.5381 },
  { id: 'bike', name: 'Un vélo', h: 1.0, src: 'silhouettes/bike.svg', aspect: 1.1935 },
  {
    id: 'door',
    name: 'Une porte d’entrée',
    h: 2.1,
    svg: `<rect width="46" height="104" rx="1"/>`,
  },
  { id: 'fridge', name: 'Un réfrigérateur', h: 1.75, src: 'silhouettes/fridge.svg', aspect: 0.4706 },
  { id: 'chair', name: 'Une chaise', h: 0.9, src: 'silhouettes/chair.svg', aspect: 0.5319 },
  { id: 'bottle', name: 'Une bouteille d’eau 1,5 L', h: 0.33, src: 'silhouettes/bottle.svg', aspect: 0.3419 },
  { id: 'can', name: 'Une canette', h: 0.122, src: 'silhouettes/can.svg', aspect: 0.5385 },
  { id: 'mug', name: 'Un mug', h: 0.095, src: 'silhouettes/mug.svg', aspect: 1.0971 },
  { id: 'phone', name: 'Un smartphone', h: 0.15, src: 'silhouettes/phone.svg', aspect: 0.5615 },
  { id: 'ball', name: 'Un ballon de foot', h: 0.22, src: 'silhouettes/ball.svg', aspect: 1 },
  {
    id: 'hoop',
    name: 'Un panier de basket',
    h: 3.95,
    svg: `<rect x="0" y="0" width="7" height="100"/>${bar(4, 18, 30, 18, 4)}<rect x="28" y="0" width="5" height="30"/><rect x="33" y="22" width="16" height="2.5"/>${bar(36, 24.5, 39, 32, 1.2)}${bar(46, 24.5, 43, 32, 1.2)}`,
  },
  { id: 'lamp', name: 'Un réverbère', h: 4.2, src: 'silhouettes/lamp.svg', aspect: 0.1676 },
  { id: 'tree', name: 'Un chêne', h: 20, src: 'silhouettes/tree.svg', aspect: 1.0907 },
  { id: 'house', name: 'Une maison', h: 9, src: 'silhouettes/house.svg', aspect: 0.8459 },
  { id: 'building', name: 'Un immeuble haussmannien', h: 20, src: 'silhouettes/building.svg', aspect: 1.7064 },
  { id: 'lighthouse', name: 'Un phare', h: 30, src: 'silhouettes/lighthouse.svg', aspect: 0.4688 },
  { id: 'turbine', name: 'Une éolienne', h: 120, src: 'silhouettes/turbine.svg', aspect: 0.4002 },
  { id: 'eiffel', name: 'La tour Eiffel', h: 330, src: 'silhouettes/eiffel.svg', aspect: 0.3827 },
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
