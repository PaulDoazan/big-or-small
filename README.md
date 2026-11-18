# Big or Small

Jeu multijoueur d’estimation de tailles. À chaque manche, une silhouette apparaît à côté d’un objet de référence : redimensionne-la jusqu’à sa vraie taille avant la fin du chrono. Jusqu’à 100 points par manche.

- Un joueur crée une partie et partage le code (ou le lien d’invitation).
- L’hôte choisit une catégorie, ou « Toutes catégories » (chaque manche tire alors une catégorie, en les passant toutes avant d’en répéter une) : **Animaux & nature** (62), **Préhistoire** (19), **Véhicules** (23), **Monuments & bâtiments** (23), **Objets du quotidien** (33) et **Pays** (55), soit 215 objets. Les deux objets d’une manche sont toujours de la même catégorie.
- Tout le monde joue la même manche en même temps, avec un chrono commun.
- Entre deux manches : la vraie taille, la miniature de la réponse de chaque joueur et le classement.
- Fin de partie : podium et récap manche par manche, puis « Rejouer ».

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:3000
npm test
```

Pour tester à plusieurs sur une seule machine, ouvre plusieurs onglets : chaque onglet est un joueur.

## Déployer sur Render

Le dépôt contient un blueprint (`render.yaml`) :

1. Sur [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. Choisis ce dépôt GitHub et valide : Render crée le service web `big-or-small` (plan gratuit).
3. L’URL publique ressemble à `https://big-or-small.onrender.com`.

Chaque push sur `main` redéploie automatiquement.

Bon à savoir sur le plan gratuit : le service s’endort après 15 min sans trafic (premier chargement ~30 s), et les parties sont en mémoire, donc perdues à chaque redémarrage ou déploiement.

## Structure

| Fichier | Rôle |
| --- | --- |
| `server/index.js` | Express (fichiers statiques) + Socket.IO (événements de jeu) |
| `server/game.js` | Logique d’une partie : joueurs, hôte, manches, chrono, scores |
| `public/objects.js` | Catalogue des silhouettes (SVG + taille réelle) et calcul du score, partagé client/serveur |
| `public/app.js` | Client : écrans, scène, redimensionnement à la souris, au doigt ou au clavier |

### Catalogue

Tout est dans `public/objects.js`, partagé par le serveur et le client. Chaque objet a une catégorie `cat` et une taille réelle `size` mesurée selon `dim` :

| `dim` | Mesure | Affichage |
| --- | --- | --- |
| `h` | hauteur, en m | « 5,30 m de haut » |
| `l` | longueur (ou envergure), en m | « 25 m de long » |
| `a` | superficie, en km² (pays) | « 546 000 km² » |

Le jeu met toujours les dessins à l’échelle par leur hauteur `h` (calculée à partir de `size` et de `aspect`), donc le score ne dépend pas de la mesure choisie : seul l’affichage change.

### Images

Les silhouettes sont des SVG libres de droits (CC0 / domaine public) venant de [PhyloPic](https://www.phylopic.org) et [FreeSVG](https://freesvg.org) ; les pays sont tracés depuis [Natural Earth](https://www.naturalearthdata.com/) (domaine public) dans une projection équivalente centrée sur chaque pays, pour qu’ils partagent tous la même échelle. Sources et licences dans [`CREDITS.md`](CREDITS.md). Les fichiers sont dans `public/silhouettes/` (`countries/` pour les pays), recadrés au pixel près : le bas du fichier est le sol. Le client les affiche via `<image>` et les recolore d’une seule teinte avec un filtre SVG.

### Ajouter un objet

1. Trouve une silhouette CC0 (PhyloPic : filtre « domaine public » ; FreeSVG : tout est CC0).
2. Recadre-la au plus près du dessin (viewBox serré, sans marge) et dépose-la dans `public/silhouettes/<id>.svg`.
3. Ajoute une entrée dans `OBJECTS` : `id`, `name` (« Un/Une/Le/La/Les/L’… », pour que les phrases du jeu s’accordent), `cat`, `dim`, `size`, `src` (`'silhouettes/<id>.svg'` devient `src: '<id>'`) et `aspect` (largeur ÷ hauteur du viewBox).
4. Ajoute sa ligne dans `CREDITS.md`.

### Score

`100 × exp(−2,4 × |ln(estimation / réalité)|)` : 100 pile-poil, ~80 à 10 % près, ~50 à 30 % près.
