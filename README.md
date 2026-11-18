# Big or Small

Jeu multijoueur d’estimation de tailles. À chaque manche, une silhouette apparaît à côté d’un objet de référence : redimensionne-la jusqu’à sa vraie taille avant la fin du chrono. Jusqu’à 100 points par manche.

- Un joueur crée une partie et partage le code (ou le lien d’invitation).
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

### Ajouter un objet

Ajoute une entrée dans `OBJECTS` (`public/objects.js`) : `id`, `name` (« Un/Une/La … »), `h` (hauteur réelle en mètres) et `svg` (formes remplies, axe y vers le bas). Le client mesure la boîte englobante du dessin : son bas est posé au sol et sa hauteur correspond à `h`.

### Score

`100 × exp(−2,4 × |ln(estimation / réalité)|)` : 100 pile-poil, ~80 à 10 % près, ~50 à 30 % près.
