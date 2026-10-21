# Suivi Séniors 2026-2027 – Métro Foot Antony

Application de suivi de l'équipe séniors (District 92, D5 poule B) :

- feuille de présence des entraînements (mardi, jeudi) et des matchs ;
- présences par match : présent, absent, excusé, blessé, avec motif ;
- calendrier, scores, buteurs, passeurs, cartons, homme du match ;
- résumé du match, points forts et points faibles ;
- classement de la saison et fiche de chaque joueur.

## Adresse

https://metro-foot-antony-seniors.vercel.app

Chaque `git push` sur `main` redéploie le site sur Vercel.

## Fichiers

- `index.html` : toute l'interface (HTML, CSS et JavaScript dans un seul fichier).
- `api/data.js` : l'API qui lit et enregistre les données dans la base Postgres (Neon) reliée au projet Vercel.

La même page fonctionne aussi sur claude.ai, où elle utilise la base de l'artefact
(https://claude.ai/artifact/EASxsrrtcoihA77z3okwxF). Les deux bases sont séparées.

## Protéger les modifications (facultatif)

Ajouter dans Vercel une variable d'environnement `COACH_CODE` : la page demandera alors ce code
avant toute modification. La lecture reste ouverte à tous ceux qui ont l'adresse.
