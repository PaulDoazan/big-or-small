// Catalogue of objects, shared by the server (sizes, categories, pair selection)
// and the client (drawing).
//
// Each object has a real-world `size` along one dimension `dim`:
//   'h' height in metres, 'l' horizontal extent in metres (length or wingspan),
//   'a' area in km² (countries).
// `h` (height in metres of the drawing, ground to top) is derived below and is
// what the game scales; `aspect` is width / height of the cropped drawing.
// Images (`src`) are CC0 / public domain, see CREDITS.md; countries come from
// Natural Earth, projected in a Lambert azimuthal equal-area projection centred
// on each country so that all of them share one true scale.
// A few geometric shapes keep an inline `svg` drawing instead of an image.

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

export const CATEGORIES = [
  { id: 'nature', name: 'Animaux & nature' },
  { id: 'prehistoire', name: 'Préhistoire' },
  { id: 'vehicules', name: 'Véhicules' },
  { id: 'monuments', name: 'Monuments & bâtiments' },
  { id: 'objets', name: 'Objets du quotidien' },
  { id: 'pays', name: 'Pays' },
];

export const OBJECTS = [
  // ---- Animaux & nature (62) ----
  { id: 'person', name: 'Un homme', cat: 'nature', dim: 'h', size: 1.78, src: 'person', aspect: 0.3268 },
  { id: 'woman', name: 'Une femme', cat: 'nature', dim: 'h', size: 1.65, src: 'woman', aspect: 0.3902 },
  { id: 'giraffe', name: 'Une girafe', cat: 'nature', dim: 'h', size: 5.3, src: 'giraffe', aspect: 0.7611 },
  { id: 'elephant', name: 'Un éléphant d’Afrique', cat: 'nature', dim: 'h', size: 3.3, src: 'elephant', aspect: 1.5515 },
  { id: 'cat', name: 'Un chat', cat: 'nature', dim: 'h', size: 0.3, src: 'cat', aspect: 1.2181 },
  { id: 'dog', name: 'Un golden retriever', cat: 'nature', dim: 'h', size: 0.8, src: 'dog', aspect: 1.622 },
  { id: 'horse', name: 'Un cheval', cat: 'nature', dim: 'h', size: 1.65, src: 'horse', aspect: 1.7798 },
  { id: 'hen', name: 'Une poule', cat: 'nature', dim: 'h', size: 0.4, src: 'hen', aspect: 0.7044 },
  { id: 'ostrich', name: 'Une autruche', cat: 'nature', dim: 'h', size: 2.5, src: 'ostrich', aspect: 0.8667 },
  { id: 'penguin', name: 'Un manchot empereur', cat: 'nature', dim: 'h', size: 1.15, src: 'penguin', aspect: 0.638 },
  { id: 'tree', name: 'Un chêne', cat: 'nature', dim: 'h', size: 20, src: 'tree', aspect: 1.0907 },
  { id: 'bluewhale', name: 'Une baleine bleue', cat: 'nature', dim: 'l', size: 25, src: 'bluewhale', aspect: 3.3032 },
  { id: 'orca', name: 'Un orque', cat: 'nature', dim: 'l', size: 7, src: 'orca', aspect: 1.6861 },
  { id: 'whiteshark', name: 'Un grand requin blanc', cat: 'nature', dim: 'l', size: 5, src: 'whiteshark', aspect: 2.3298 },
  { id: 'dolphin', name: 'Un grand dauphin', cat: 'nature', dim: 'l', size: 3, src: 'dolphin', aspect: 3.0905 },
  { id: 'polarbear', name: 'Un ours polaire', cat: 'nature', dim: 'l', size: 2.4, src: 'polarbear', aspect: 1.9999 },
  { id: 'brownbear', name: 'Un ours brun', cat: 'nature', dim: 'l', size: 2.1, src: 'brownbear', aspect: 1.3777 },
  { id: 'lion', name: 'Un lion', cat: 'nature', dim: 'l', size: 2.7, src: 'lion', aspect: 1.3363 },
  { id: 'tiger', name: 'Un tigre', cat: 'nature', dim: 'l', size: 3, src: 'tiger', aspect: 2.1849 },
  { id: 'gorilla', name: 'Un gorille', cat: 'nature', dim: 'h', size: 1.4, src: 'gorilla', aspect: 0.9082 },
  { id: 'chimp', name: 'Un chimpanzé', cat: 'nature', dim: 'h', size: 1, src: 'chimp', aspect: 0.776 },
  { id: 'hippo', name: 'Un hippopotame', cat: 'nature', dim: 'l', size: 4, src: 'hippo', aspect: 1.9055 },
  { id: 'rhino', name: 'Un rhinocéros blanc', cat: 'nature', dim: 'l', size: 4, src: 'rhino', aspect: 2.3415 },
  { id: 'zebra', name: 'Un zèbre', cat: 'nature', dim: 'l', size: 2.6, src: 'zebra', aspect: 1.2652 },
  { id: 'camel', name: 'Un dromadaire', cat: 'nature', dim: 'h', size: 2.2, src: 'camel', aspect: 1.2684 },
  { id: 'cow', name: 'Une vache', cat: 'nature', dim: 'l', size: 2.5, src: 'cow', aspect: 1.2977 },
  { id: 'pig', name: 'Un cochon', cat: 'nature', dim: 'l', size: 1.6, src: 'pig', aspect: 1.8756 },
  { id: 'sheep', name: 'Un mouton', cat: 'nature', dim: 'l', size: 1.3, src: 'sheep', aspect: 1.3308 },
  { id: 'rabbit', name: 'Un lapin', cat: 'nature', dim: 'l', size: 0.4, src: 'rabbit', aspect: 1.1718 },
  { id: 'mouse', name: 'Une souris (queue comprise)', cat: 'nature', dim: 'l', size: 0.17, src: 'mouse', aspect: 2.1543 },
  { id: 'rat', name: 'Un rat (queue comprise)', cat: 'nature', dim: 'l', size: 0.4, src: 'rat', aspect: 1.9819 },
  { id: 'squirrel', name: 'Un écureuil roux', cat: 'nature', dim: 'h', size: 0.25, src: 'squirrel', aspect: 1.2047 },
  { id: 'hedgehog', name: 'Un hérisson', cat: 'nature', dim: 'l', size: 0.25, src: 'hedgehog', aspect: 1.5845 },
  { id: 'fox', name: 'Un renard roux', cat: 'nature', dim: 'l', size: 1.1, src: 'fox', aspect: 1.9176 },
  { id: 'wolf', name: 'Un loup', cat: 'nature', dim: 'l', size: 1.6, src: 'wolf', aspect: 1.6714 },
  { id: 'deer', name: 'Un cerf élaphe', cat: 'nature', dim: 'h', size: 2.2, src: 'deer', aspect: 0.983 },
  { id: 'moose', name: 'Un élan', cat: 'nature', dim: 'h', size: 2.6, src: 'moose', aspect: 1.3185 },
  { id: 'kangaroo', name: 'Un kangourou roux', cat: 'nature', dim: 'h', size: 1.6, src: 'kangaroo', aspect: 0.7112 },
  { id: 'koala', name: 'Un koala', cat: 'nature', dim: 'h', size: 0.6, src: 'koala', aspect: 0.8742 },
  { id: 'panda', name: 'Un panda géant', cat: 'nature', dim: 'l', size: 1.6, src: 'panda', aspect: 1.4508 },
  { id: 'eagle', name: 'Un aigle royal', cat: 'nature', dim: 'l', size: 2.1, label: 'd’envergure', src: 'eagle', aspect: 2.5902 },
  { id: 'owl', name: 'Un hibou grand-duc', cat: 'nature', dim: 'h', size: 0.65, src: 'owl', aspect: 0.7689 },
  { id: 'flamingo', name: 'Un flamant rose', cat: 'nature', dim: 'h', size: 1.3, src: 'flamingo', aspect: 0.5788 },
  { id: 'pigeon', name: 'Un pigeon', cat: 'nature', dim: 'l', size: 0.33, src: 'pigeon', aspect: 1.4573 },
  { id: 'macaw', name: 'Un ara rouge (queue comprise)', cat: 'nature', dim: 'h', size: 0.85, src: 'macaw', aspect: 0.4759 },
  { id: 'swan', name: 'Un cygne', cat: 'nature', dim: 'l', size: 1.5, src: 'swan', aspect: 1.4048 },
  { id: 'hummingbird', name: 'Un colibri', cat: 'nature', dim: 'l', size: 0.09, src: 'hummingbird', aspect: 1.6445 },
  { id: 'crocodile', name: 'Un crocodile du Nil', cat: 'nature', dim: 'l', size: 4.5, src: 'crocodile', aspect: 1.9534 },
  { id: 'tortoise', name: 'Une tortue des Galápagos', cat: 'nature', dim: 'l', size: 1.2, src: 'tortoise', aspect: 1.6367 },
  { id: 'frog', name: 'Une grenouille', cat: 'nature', dim: 'l', size: 0.08, src: 'frog', aspect: 0.961 },
  { id: 'ant', name: 'Une fourmi', cat: 'nature', dim: 'l', size: 0.008, src: 'ant', aspect: 2.7888 },
  { id: 'bee', name: 'Une abeille', cat: 'nature', dim: 'l', size: 0.015, src: 'bee', aspect: 2.4121 },
  { id: 'butterfly', name: 'Un papillon monarque', cat: 'nature', dim: 'l', size: 0.1, label: 'd’envergure', src: 'butterfly', aspect: 1.4471 },
  { id: 'tarantula', name: 'Une mygale Goliath', cat: 'nature', dim: 'l', size: 0.28, label: 'pattes écartées', src: 'tarantula', aspect: 0.7142 },
  { id: 'snail', name: 'Un escargot de Bourgogne', cat: 'nature', dim: 'l', size: 0.09, src: 'snail', aspect: 1.2801 },
  { id: 'lobster', name: 'Un homard', cat: 'nature', dim: 'l', size: 0.6, src: 'lobster', aspect: 1.6641 },
  { id: 'goldfish', name: 'Un poisson rouge', cat: 'nature', dim: 'l', size: 0.15, src: 'goldfish', aspect: 2.087 },
  { id: 'salmon', name: 'Un saumon', cat: 'nature', dim: 'l', size: 0.9, src: 'salmon', aspect: 3.3247 },
  { id: 'walrus', name: 'Un morse', cat: 'nature', dim: 'l', size: 3.2, src: 'walrus', aspect: 1.722 },
  { id: 'llama', name: 'Un lama', cat: 'nature', dim: 'h', size: 1.8, src: 'llama', aspect: 0.8318 },
  { id: 'palm', name: 'Un palmier dattier', cat: 'nature', dim: 'h', size: 20, src: 'palm', aspect: 0.589 },
  { id: 'pine', name: 'Un épicéa', cat: 'nature', dim: 'h', size: 35, src: 'pine', aspect: 0.5817 },
  // ---- Préhistoire (19) ----
  { id: 'trex', name: 'Un tyrannosaure', cat: 'prehistoire', dim: 'h', size: 4, src: 'trex', aspect: 2.0157 },
  { id: 'triceratops', name: 'Un tricératops', cat: 'prehistoire', dim: 'l', size: 9, src: 'triceratops', aspect: 2.3415 },
  { id: 'brachiosaurus', name: 'Un brachiosaure', cat: 'prehistoire', dim: 'h', size: 12, src: 'brachiosaurus', aspect: 0.8711 },
  { id: 'diplodocus', name: 'Un diplodocus', cat: 'prehistoire', dim: 'l', size: 26, src: 'diplodocus', aspect: 3.2649 },
  { id: 'velociraptor', name: 'Un vélociraptor', cat: 'prehistoire', dim: 'l', size: 2, src: 'velociraptor', aspect: 3.2751 },
  { id: 'spinosaurus', name: 'Un spinosaure', cat: 'prehistoire', dim: 'l', size: 15, src: 'spinosaurus', aspect: 2.3044 },
  { id: 'ankylosaurus', name: 'Un ankylosaure', cat: 'prehistoire', dim: 'l', size: 7, src: 'ankylosaurus', aspect: 3.4439 },
  { id: 'parasaurolophus', name: 'Un parasaurolophus', cat: 'prehistoire', dim: 'l', size: 9.5, src: 'parasaurolophus', aspect: 2.3486 },
  { id: 'mammoth', name: 'Un mammouth laineux', cat: 'prehistoire', dim: 'h', size: 3.4, src: 'mammoth', aspect: 1.4884 },
  { id: 'smilodon', name: 'Un tigre à dents de sabre', cat: 'prehistoire', dim: 'l', size: 2, src: 'smilodon', aspect: 1.5148 },
  { id: 'megalodon', name: 'Un mégalodon', cat: 'prehistoire', dim: 'l', size: 15, src: 'megalodon', aspect: 2.2326 },
  { id: 'neanderthal', name: 'Un homme de Néandertal', cat: 'prehistoire', dim: 'h', size: 1.65, src: 'neanderthal', aspect: 0.3535 },
  { id: 'allosaurus', name: 'Un allosaure', cat: 'prehistoire', dim: 'l', size: 9.5, src: 'allosaurus', aspect: 2.9615 },
  { id: 'carnotaurus', name: 'Un carnotaure', cat: 'prehistoire', dim: 'l', size: 8, src: 'carnotaurus', aspect: 2.2279 },
  { id: 'dodo', name: 'Un dodo', cat: 'prehistoire', dim: 'h', size: 0.7, src: 'dodo', aspect: 0.7585 },
  { id: 'glyptodon', name: 'Un glyptodon', cat: 'prehistoire', dim: 'l', size: 3.3, src: 'glyptodon', aspect: 1.9129 },
  { id: 'iguanodon', name: 'Un iguanodon', cat: 'prehistoire', dim: 'l', size: 10, src: 'iguanodon', aspect: 2.4241 },
  { id: 'irishelk', name: 'Un mégacéros (bois compris)', cat: 'prehistoire', dim: 'h', size: 3, src: 'irishelk', aspect: 1.2096 },
  { id: 'stegosaurus', name: 'Un stégosaure', cat: 'prehistoire', dim: 'l', size: 9, src: 'stegosaurus', aspect: 2.2522 },
  // ---- Véhicules (23) ----
  { id: 'car', name: 'Une berline', cat: 'vehicules', dim: 'h', size: 1.45, src: 'car', aspect: 2.946 },
  { id: 'bus', name: 'Un bus à impériale', cat: 'vehicules', dim: 'h', size: 4.4, src: 'bus', aspect: 1.5381 },
  { id: 'bike', name: 'Un vélo', cat: 'vehicules', dim: 'h', size: 1, src: 'bike', aspect: 1.1935 },
  { id: 'motorbike', name: 'Une moto', cat: 'vehicules', dim: 'l', size: 2.2, src: 'motorbike', aspect: 1.9565 },
  { id: 'scooter', name: 'Un scooter', cat: 'vehicules', dim: 'l', size: 1.8, src: 'scooter', aspect: 1.6388 },
  { id: 'longboard', name: 'Un longboard', cat: 'vehicules', dim: 'l', size: 1, src: 'longboard', aspect: 2.7647 },
  { id: 'dumptruck', name: 'Un camion-benne', cat: 'vehicules', dim: 'l', size: 7.5, src: 'dumptruck', aspect: 1.6813 },
  { id: 'tractor', name: 'Un tracteur', cat: 'vehicules', dim: 'h', size: 2.8, src: 'tractor', aspect: 1.2286 },
  { id: 'firetruck', name: 'Un camion de pompiers', cat: 'vehicules', dim: 'l', size: 10, src: 'firetruck', aspect: 2.9506 },
  { id: 'tank', name: 'Un char d’assaut (canon compris)', cat: 'vehicules', dim: 'l', size: 9.8, src: 'tank', aspect: 3.3677 },
  { id: 'f1', name: 'Une Formule 1', cat: 'vehicules', dim: 'l', size: 5.6, src: 'f1', aspect: 3.8447 },
  { id: 'steamloco', name: 'Une locomotive à vapeur', cat: 'vehicules', dim: 'l', size: 12, src: 'steamloco', aspect: 1.6222 },
  { id: 'a380', name: 'Un Airbus A380 vu de face', cat: 'vehicules', dim: 'l', size: 79.8, label: 'd’envergure', src: 'a380', aspect: 3.8942 },
  { id: 'fighterjet', name: 'Un avion de chasse', cat: 'vehicules', dim: 'l', size: 19, src: 'fighterjet', aspect: 3.0043 },
  { id: 'helicopter', name: 'Un hélicoptère (rotor compris)', cat: 'vehicules', dim: 'l', size: 17.4, src: 'helicopter', aspect: 3.7102 },
  { id: 'balloon', name: 'Une montgolfière', cat: 'vehicules', dim: 'h', size: 25, src: 'balloon', aspect: 0.7266 },
  { id: 'containership', name: 'Un porte-conteneurs géant', cat: 'vehicules', dim: 'l', size: 400, src: 'containership', aspect: 5.0466 },
  { id: 'tallship', name: 'Un trois-mâts', cat: 'vehicules', dim: 'l', size: 58, src: 'tallship', aspect: 1.8224 },
  { id: 'submarine', name: 'Un sous-marin nucléaire', cat: 'vehicules', dim: 'l', size: 138, src: 'submarine', aspect: 6.042 },
  { id: 'saturnv', name: 'La fusée Saturn V', cat: 'vehicules', dim: 'h', size: 110.6, src: 'saturnv', aspect: 0.1752 },
  { id: 'shuttle', name: 'La navette spatiale au décollage', cat: 'vehicules', dim: 'h', size: 56, src: 'shuttle', aspect: 0.4553 },
  { id: 'zeppelin', name: 'Le dirigeable Hindenburg', cat: 'vehicules', dim: 'l', size: 245, src: 'zeppelin', aspect: 3.3569 },
  { id: 'campervan', name: 'Un camping-car', cat: 'vehicules', dim: 'l', size: 7, src: 'campervan', aspect: 1.7768 },
  // ---- Monuments & bâtiments (23) ----
  { id: 'house', name: 'Une maison', cat: 'monuments', dim: 'h', size: 9, src: 'house', aspect: 0.8459 },
  { id: 'building', name: 'Un immeuble haussmannien', cat: 'monuments', dim: 'h', size: 20, src: 'building', aspect: 1.7064 },
  { id: 'lighthouse', name: 'Un phare', cat: 'monuments', dim: 'h', size: 30, src: 'lighthouse', aspect: 0.4688 },
  { id: 'turbine', name: 'Une éolienne', cat: 'monuments', dim: 'h', size: 120, src: 'turbine', aspect: 0.4002 },
  { id: 'eiffel', name: 'La tour Eiffel', cat: 'monuments', dim: 'h', size: 330, src: 'eiffel', aspect: 0.3827 },
  { id: 'pyramid', name: 'La pyramide de Khéops', cat: 'monuments', dim: 'h', size: 139, svg: `<polygon points="0,139 115,0 230,139"/>` },
  { id: 'liberty', name: 'La statue de la Liberté (socle compris)', cat: 'monuments', dim: 'h', size: 93, src: 'liberty', aspect: 0.3023 },
  { id: 'bigben', name: 'Big Ben', cat: 'monuments', dim: 'h', size: 96, src: 'bigben', aspect: 0.2727 },
  { id: 'burj', name: 'Burj Khalifa', cat: 'monuments', dim: 'h', size: 828, src: 'burj', aspect: 0.2439 },
  { id: 'empire', name: 'L’Empire State Building', cat: 'monuments', dim: 'h', size: 443, src: 'empire', aspect: 0.3774 },
  { id: 'pisa', name: 'La tour de Pise', cat: 'monuments', dim: 'h', size: 56, src: 'pisa', aspect: 0.2957 },
  { id: 'arc', name: 'L’Arc de Triomphe', cat: 'monuments', dim: 'h', size: 50, src: 'arc', aspect: 1.0007 },
  { id: 'christ', name: 'Le Christ Rédempteur (socle compris)', cat: 'monuments', dim: 'h', size: 38, src: 'christ', aspect: 1.0894 },
  { id: 'towerbridge', name: 'Le Tower Bridge', cat: 'monuments', dim: 'h', size: 65, src: 'towerbridge', aspect: 2.6375 },
  { id: 'spaceneedle', name: 'La Space Needle', cat: 'monuments', dim: 'h', size: 184, src: 'spaceneedle', aspect: 0.4884 },
  { id: 'atomium', name: 'L’Atomium', cat: 'monuments', dim: 'h', size: 102, src: 'atomium', aspect: 1.0007 },
  { id: 'sphinx', name: 'Le Sphinx de Gizeh', cat: 'monuments', dim: 'h', size: 20, src: 'sphinx', aspect: 1.9862 },
  { id: 'tipi', name: 'Un tipi', cat: 'monuments', dim: 'h', size: 5, src: 'tipi', aspect: 0.8198 },
  { id: 'windmill', name: 'Un moulin à vent', cat: 'monuments', dim: 'h', size: 12, src: 'windmill', aspect: 0.8295 },
  { id: 'ferriswheel', name: 'Une grande roue (comme la London Eye)', cat: 'monuments', dim: 'h', size: 135, src: 'ferriswheel', aspect: 1.3937 },
  { id: 'petronas', name: 'Les tours Petronas', cat: 'monuments', dim: 'h', size: 452, src: 'petronas', aspect: 0.7442 },
  { id: 'castle', name: 'Un château fort', cat: 'monuments', dim: 'h', size: 25, src: 'castle', aspect: 2.2722 },
  { id: 'church', name: 'Une église de village', cat: 'monuments', dim: 'h', size: 35, src: 'church', aspect: 0.4416 },
  // ---- Objets du quotidien (33) ----
  { id: 'door', name: 'Une porte d’entrée', cat: 'objets', dim: 'h', size: 2.1, svg: `<rect width="46" height="104" rx="1"/>` },
  { id: 'fridge', name: 'Un réfrigérateur', cat: 'objets', dim: 'h', size: 1.75, src: 'fridge', aspect: 0.4706 },
  { id: 'chair', name: 'Une chaise', cat: 'objets', dim: 'h', size: 0.9, src: 'chair', aspect: 0.5319 },
  { id: 'bottle', name: 'Une bouteille d’eau 1,5 L', cat: 'objets', dim: 'h', size: 0.33, src: 'bottle', aspect: 0.3419 },
  { id: 'can', name: 'Une canette', cat: 'objets', dim: 'h', size: 0.122, src: 'can', aspect: 0.5385 },
  { id: 'mug', name: 'Un mug', cat: 'objets', dim: 'h', size: 0.095, src: 'mug', aspect: 1.0971 },
  { id: 'phone', name: 'Un smartphone', cat: 'objets', dim: 'h', size: 0.15, src: 'phone', aspect: 0.5615 },
  { id: 'ball', name: 'Un ballon de foot', cat: 'objets', dim: 'h', size: 0.22, src: 'ball', aspect: 1.0 },
  { id: 'hoop', name: 'Un panier de basket', cat: 'objets', dim: 'h', size: 3.95, svg: `<rect x="0" y="0" width="7" height="100"/>${bar(4, 18, 30, 18, 4)}<rect x="28" y="0" width="5" height="30"/><rect x="33" y="22" width="16" height="2.5"/>${bar(36, 24.5, 39, 32, 1.2)}${bar(46, 24.5, 43, 32, 1.2)}` },
  { id: 'lamp', name: 'Un réverbère', cat: 'objets', dim: 'h', size: 4.2, src: 'lamp', aspect: 0.1676 },
  { id: 'guitar', name: 'Une guitare', cat: 'objets', dim: 'h', size: 1, src: 'guitar', aspect: 0.3497 },
  { id: 'grandpiano', name: 'Un piano à queue de concert', cat: 'objets', dim: 'l', size: 2.7, src: 'grandpiano', aspect: 1.302 },
  { id: 'violin', name: 'Un violon', cat: 'objets', dim: 'h', size: 0.6, src: 'violin', aspect: 0.3706 },
  { id: 'bulb', name: 'Une ampoule', cat: 'objets', dim: 'h', size: 0.11, src: 'bulb', aspect: 0.56 },
  { id: 'banana', name: 'Une banane', cat: 'objets', dim: 'l', size: 0.2, src: 'banana', aspect: 1.3481 },
  { id: 'apple', name: 'Une pomme', cat: 'objets', dim: 'h', size: 0.08, src: 'apple', aspect: 1.045 },
  { id: 'pencil', name: 'Un crayon', cat: 'objets', dim: 'l', size: 0.18, src: 'pencil', aspect: 3.8014 },
  { id: 'scissors', name: 'Une paire de ciseaux ouverte', cat: 'objets', dim: 'l', size: 0.2, src: 'scissors', aspect: 2.8459 },
  { id: 'washer', name: 'Un lave-linge', cat: 'objets', dim: 'h', size: 0.85, src: 'washer', aspect: 0.76 },
  { id: 'toothbrush', name: 'Une brosse à dents', cat: 'objets', dim: 'l', size: 0.19, src: 'toothbrush', aspect: 7.622 },
  { id: 'fork', name: 'Une fourchette', cat: 'objets', dim: 'h', size: 0.2, src: 'fork', aspect: 0.1678 },
  { id: 'wineglass', name: 'Un verre à vin', cat: 'objets', dim: 'h', size: 0.22, src: 'wineglass', aspect: 0.4106 },
  { id: 'teapot', name: 'Une théière', cat: 'objets', dim: 'h', size: 0.17, src: 'teapot', aspect: 1.4706 },
  { id: 'clock', name: 'Une horloge comtoise', cat: 'objets', dim: 'h', size: 2.1, src: 'clock', aspect: 0.3146 },
  { id: 'sofa', name: 'Un canapé trois places', cat: 'objets', dim: 'l', size: 2.1, src: 'sofa', aspect: 2.4088 },
  { id: 'ladder', name: 'Un escabeau', cat: 'objets', dim: 'h', size: 1.6, src: 'ladder', aspect: 0.4337 },
  { id: 'trumpet', name: 'Une trompette', cat: 'objets', dim: 'l', size: 0.48, src: 'trumpet', aspect: 3.2318 },
  { id: 'tennisracket', name: 'Une raquette de tennis', cat: 'objets', dim: 'h', size: 0.685, src: 'tennisracket', aspect: 0.3722 },
  { id: 'rugbyball', name: 'Un ballon de rugby', cat: 'objets', dim: 'l', size: 0.29, src: 'rugbyball', aspect: 1.6467 },
  { id: 'surfboard', name: 'Une planche de surf', cat: 'objets', dim: 'h', size: 2, src: 'surfboard', aspect: 0.2329 },
  { id: 'laptop', name: 'Un ordinateur portable 13 pouces', cat: 'objets', dim: 'l', size: 0.31, src: 'laptop', aspect: 1.3247 },
  { id: 'desklamp', name: 'Une lampe de bureau', cat: 'objets', dim: 'h', size: 0.45, src: 'desklamp', aspect: 0.7671 },
  { id: 'bathtub', name: 'Une baignoire', cat: 'objets', dim: 'l', size: 1.7, src: 'bathtub', aspect: 1.6014 },
  // ---- Pays (55) ----
  { id: 'c_fr', name: 'La France métropolitaine', cat: 'pays', dim: 'a', size: 545728, h: 1057500, src: 'countries/fr', aspect: 1.0549 },
  { id: 'c_es', name: 'L’Espagne', cat: 'pays', dim: 'a', size: 499031, h: 865400, src: 'countries/es', aspect: 1.3104 },
  { id: 'c_pt', name: 'Le Portugal', cat: 'pays', dim: 'a', size: 87851, h: 570700, src: 'countries/pt', aspect: 0.4861 },
  { id: 'c_it', name: 'L’Italie', cat: 'pays', dim: 'a', size: 300287, h: 1149900, src: 'countries/it', aspect: 0.8461 },
  { id: 'c_de', name: 'L’Allemagne', cat: 'pays', dim: 'a', size: 356167, h: 866400, src: 'countries/de', aspect: 0.7368 },
  { id: 'c_gb', name: 'Le Royaume-Uni', cat: 'pays', dim: 'a', size: 239613, h: 1201800, src: 'countries/gb', aspect: 0.5443 },
  { id: 'c_ie', name: 'L’Irlande', cat: 'pays', dim: 'a', size: 68698, h: 432400, src: 'countries/ie', aspect: 0.682 },
  { id: 'c_be', name: 'La Belgique', cat: 'pays', dim: 'a', size: 30632, h: 219900, src: 'countries/be', aspect: 1.2278 },
  { id: 'c_ch', name: 'La Suisse', cat: 'pays', dim: 'a', size: 41207, h: 216200, src: 'countries/ch', aspect: 1.587 },
  { id: 'c_nl', name: 'Les Pays-Bas', cat: 'pays', dim: 'a', size: 36885, h: 320300, src: 'countries/nl', aspect: 0.8195 },
  { id: 'c_lu', name: 'Le Luxembourg', cat: 'pays', dim: 'a', size: 2612, h: 80300, src: 'countries/lu', aspect: 0.6879 },
  { id: 'c_at', name: 'L’Autriche', cat: 'pays', dim: 'a', size: 83911, h: 289800, src: 'countries/at', aspect: 1.9693 },
  { id: 'c_dk', name: 'Le Danemark', cat: 'pays', dim: 'a', size: 42417, h: 344300, src: 'countries/dk', aspect: 1.2904 },
  { id: 'c_gr', name: 'La Grèce', cat: 'pays', dim: 'a', size: 130165, h: 760200, src: 'countries/gr', aspect: 0.9928 },
  { id: 'c_pl', name: 'La Pologne', cat: 'pays', dim: 'a', size: 312551, h: 640300, src: 'countries/pl', aspect: 1.0709 },
  { id: 'c_se', name: 'La Suède', cat: 'pays', dim: 'a', size: 442973, h: 1516300, src: 'countries/se', aspect: 0.4397 },
  { id: 'c_no', name: 'La Norvège', cat: 'pays', dim: 'a', size: 322671, h: 1588000, src: 'countries/no', aspect: 0.9238 },
  { id: 'c_fi', name: 'La Finlande', cat: 'pays', dim: 'a', size: 330492, h: 1138600, src: 'countries/fi', aspect: 0.473 },
  { id: 'c_is', name: 'L’Islande', cat: 'pays', dim: 'a', size: 101155, h: 351400, src: 'countries/is', aspect: 1.4431 },
  { id: 'c_ua', name: 'L’Ukraine', cat: 'pays', dim: 'a', size: 570153, h: 791400, src: 'countries/ua', aspect: 1.6616 },
  { id: 'c_tr', name: 'La Turquie', cat: 'pays', dim: 'a', size: 779821, h: 729500, src: 'countries/tr', aspect: 2.2659 },
  { id: 'c_ru', name: 'La Russie', cat: 'pays', dim: 'a', size: 16879224, h: 4537100, src: 'countries/ru', aspect: 1.7776 },
  { id: 'c_cn', name: 'La Chine', cat: 'pays', dim: 'a', size: 9371226, h: 4023200, src: 'countries/cn', aspect: 1.2028 },
  { id: 'c_in', name: 'L’Inde', cat: 'pays', dim: 'a', size: 3155809, h: 3153000, src: 'countries/in', aspect: 0.921 },
  { id: 'c_jp', name: 'Le Japon', cat: 'pays', dim: 'a', size: 370097, h: 2269000, src: 'countries/jp', aspect: 0.918 },
  { id: 'c_kr', name: 'La Corée du Sud', cat: 'pays', dim: 'a', size: 97154, h: 602700, src: 'countries/kr', aspect: 0.7276 },
  { id: 'c_id', name: 'L’Indonésie', cat: 'pays', dim: 'a', size: 1872159, h: 1881300, src: 'countries/id', aspect: 2.681 },
  { id: 'c_th', name: 'La Thaïlande', cat: 'pays', dim: 'a', size: 515730, h: 1643300, src: 'countries/th', aspect: 0.5354 },
  { id: 'c_vn', name: 'Le Viêt Nam', cat: 'pays', dim: 'a', size: 328938, h: 1640100, src: 'countries/vn', aspect: 0.4708 },
  { id: 'c_ph', name: 'Les Philippines', cat: 'pays', dim: 'a', size: 290305, h: 1752300, src: 'countries/ph', aspect: 0.6062 },
  { id: 'c_au', name: 'L’Australie', cat: 'pays', dim: 'a', size: 7705916, h: 3751100, src: 'countries/au', aspect: 1.0757 },
  { id: 'c_nz', name: 'La Nouvelle-Zélande', cat: 'pays', dim: 'a', size: 265191, h: 1428000, src: 'countries/nz', aspect: 0.7108 },
  { id: 'c_us', name: 'Les États-Unis (sans l’Alaska ni Hawaï)', cat: 'pays', dim: 'a', size: 7933179, h: 3117000, src: 'countries/us', aspect: 1.4803 },
  { id: 'c_ca', name: 'Le Canada', cat: 'pays', dim: 'a', size: 9872047, h: 4570600, src: 'countries/ca', aspect: 1.1763 },
  { id: 'c_mx', name: 'Le Mexique', cat: 'pays', dim: 'a', size: 1962271, h: 2031800, src: 'countries/mx', aspect: 1.562 },
  { id: 'c_cu', name: 'Cuba', cat: 'pays', dim: 'a', size: 109298, h: 372700, src: 'countries/cu', aspect: 2.9917 },
  { id: 'c_br', name: 'Le Brésil', cat: 'pays', dim: 'a', size: 8499370, h: 4313600, src: 'countries/br', aspect: 0.9968 },
  { id: 'c_ar', name: 'L’Argentine', cat: 'pays', dim: 'a', size: 2782690, h: 3681500, src: 'countries/ar', aspect: 0.4789 },
  { id: 'c_cl', name: 'Le Chili', cat: 'pays', dim: 'a', size: 737317, h: 4249900, src: 'countries/cl', aspect: 0.2736 },
  { id: 'c_pe', name: 'Le Pérou', cat: 'pays', dim: 'a', size: 1296288, h: 2034800, src: 'countries/pe', aspect: 0.683 },
  { id: 'c_co', name: 'La Colombie', cat: 'pays', dim: 'a', size: 1139432, h: 1851900, src: 'countries/co', aspect: 0.7289 },
  { id: 'c_eg', name: 'L’Égypte', cat: 'pays', dim: 'a', size: 1003588, h: 1086500, src: 'countries/eg', aspect: 1.1298 },
  { id: 'c_tn', name: 'La Tunisie', cat: 'pays', dim: 'a', size: 156658, h: 790500, src: 'countries/tn', aspect: 0.4749 },
  { id: 'c_dz', name: 'L’Algérie', cat: 'pays', dim: 'a', size: 2322739, h: 2021800, src: 'countries/dz', aspect: 1.0237 },
  { id: 'c_ng', name: 'Le Nigeria', cat: 'pays', dim: 'a', size: 911554, h: 1067200, src: 'countries/ng', aspect: 1.2231 },
  { id: 'c_za', name: 'L’Afrique du Sud', cat: 'pays', dim: 'a', size: 1221435, h: 1400500, src: 'countries/za', aspect: 1.1543 },
  { id: 'c_mg', name: 'Madagascar', cat: 'pays', dim: 'a', size: 594598, h: 1498600, src: 'countries/mg', aspect: 0.5065 },
  { id: 'c_ke', name: 'Le Kenya', cat: 'pays', dim: 'a', size: 594833, h: 1132300, src: 'countries/ke', aspect: 0.7832 },
  { id: 'c_cd', name: 'La République démocratique du Congo', cat: 'pays', dim: 'a', size: 2334624, h: 2088200, src: 'countries/cd', aspect: 1.011 },
  { id: 'c_sa', name: 'L’Arabie saoudite', cat: 'pays', dim: 'a', size: 1925840, h: 1762200, src: 'countries/sa', aspect: 1.1969 },
  { id: 'c_ir', name: 'L’Iran', cat: 'pays', dim: 'a', size: 1622830, h: 1628400, src: 'countries/ir', aspect: 1.0989 },
  { id: 'c_mn', name: 'La Mongolie', cat: 'pays', dim: 'a', size: 1560399, h: 1174300, src: 'countries/mn', aspect: 2.0298 },
  { id: 'c_kz', name: 'Le Kazakhstan', cat: 'pays', dim: 'a', size: 2712781, h: 1642900, src: 'countries/kz', aspect: 1.7882 },
  { id: 'c_il', name: 'Israël', cat: 'pays', dim: 'a', size: 22051, h: 438000, src: 'countries/il', aspect: 0.3539 },
  { id: 'c_gl', name: 'Le Groenland', cat: 'pays', dim: 'a', size: 2154749, h: 2650000, src: 'countries/gl', aspect: 0.5472 },
];

const DEFAULT_LABEL = { h: 'de haut', l: 'de long', a: '' };
for (const o of OBJECTS) {
  if (o.src) o.src = `silhouettes/${o.src}.svg`;
  o.label ??= DEFAULT_LABEL[o.dim];
  o.h ??= o.dim === 'l' ? o.size / o.aspect : o.size;
}

export const OBJECTS_BY_ID = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));

/** The object's measured quantity (metres or km²) when it is drawn `hMeters` tall. */
export function valueAt(obj, hMeters) {
  if (obj.dim === 'a') return obj.size * (hMeters / obj.h) ** 2;
  if (obj.dim === 'l') return hMeters * obj.aspect;
  return hMeters;
}

/** Points for a guess, out of 100: 100 at the exact size, ~80 at 10 % off, ~50 at 30 % off. */
export function scoreGuess(guessRatio, trueRatio) {
  if (!(guessRatio > 0) || !(trueRatio > 0)) return 0;
  const err = Math.abs(Math.log(guessRatio / trueRatio));
  return Math.round(100 * Math.exp(-2.4 * err));
}

export const RATIO_MIN = 0.04;
export const RATIO_MAX = 25;
