# Lot 12 — Build Admin complet validé, recette visuelle non exécutée

Date : 21 novembre 2026. Responsable : Developer 2, sous revue Lead Tech.
Source : clone Git complet de `fadykless/motukadmin`, HEAD exact
`02b709d39577399911485049d0d1822cda406458` (PR10). Aucun fichier source fonctionnel,
package.json, package-lock ou configuration de compilation modifié pour la preuve.
Le présent rapport est le seul ajout du lot.

## Résultats constatés

| Contrôle | État | Preuve et portée |
|---|---|---|
| Restauration du dépôt complet | Réussi | Clone Git, HEAD exact, arbre propre avant ce rapport |
| Installation stricte | Réussi | `npm ci`, code 0, 1911 paquets ; lockfile inchangé |
| Build global sans réglage TLS | Échoué | Next ne pouvait vérifier la connexion TLS de récupération des polices Google Geist/Geist Mono |
| Build global avec certificats système | Réussi | `npm run build`, code 0, application Admin complète ; aucune fixture minimale ni mock de fontes |
| Compilation page WhatsApp et routes | Réussi | `/whatsapp-demandes`, `/api/admin/whatsapp-requests` et `/api/admin/whatsapp-requests/[id]` présents dans l'arbre final avec les autres routes Admin |
| Lancement du navigateur local | Échoué | Playwright Python et Chromium présents, mais Chromium avorte avant navigation : socket interdit par le runtime |
| Login et AdminGuard en navigateur | Non exécuté | Aucun navigateur utilisable ; aucun bypass ni faux login effectué |
| Page WhatsApp desktop/mobile | Non exécuté | Aucune capture ni validation visuelle ne peut être revendiquée |

Le build réussi inclut compilation, génération des pages et arbre final de
l'application complète. Il ne valide pas les parcours fonctionnels des autres
modules. Les anciens tests unitaires/HTTP des lots précédents ne sont pas annoncés
comme rejoués ici ; aucune répétition supplémentaire n'était nécessaire au résultat.

## Commande de reproduction du build complet

Runtime observé : Node 24.22.3, npm 11.19.1, Next.js 16.1.6. Depuis le checkout
complet exact, dans un terminal sans credentials réels :

```sh
npm ci
env -u GOOGLE_APPLICATION_CREDENTIALS -u FIREBASE_SERVICE_ACCOUNT_JSON \
  -u FIREBASE_SERVICE_ACCOUNT_KEY -u WHATSAPP_ACCESS_TOKEN -u META_ACCESS_TOKEN \
  NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1 \
  NEXT_PUBLIC_C2_EMULATOR_MODE=true WHATSAPP_ADMIN_DRY_RUN_ENABLED=true \
  GCLOUD_PROJECT=demo-motuka-c2 GOOGLE_CLOUD_PROJECT=demo-motuka-c2 \
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
  NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npm run build
```

Le flag de certificats système est celui recommandé dans l'erreur Next. Il ne
désactive pas la validation TLS et ne remplace aucune fonte par un mock. Les deux
familles originales sont conservées ; aucune modification de design ni nouvelle
dépendance n'a été introduite pour débloquer la compilation.

La configuration Firebase cliente compilée est **C2 demo**, pas une configuration
de production. `NODE_ENV=production` ferme les routes WhatsApp dry-run par leur
garde existante. Aucun émulateur ni service réel n'a été contacté pour produire une
recette de données dans ce lot. Cet artefact de test ne doit pas être déployé et
ne constitue pas une validation des paramètres Firebase/Vercel de production.

## Blocage de la recette visuelle

Capacités vérifiées : Playwright Python importable, Chromium local
`/usr/bin/chromium`. Deux essais headless, dont un avec les options habituelles
de conteneur, ont avorté avant création d'une page utilisable. Erreur observée :

```text
FATAL chrome/browser/process_singleton_posix.cc:297
socket() failed: Operation not permitted (1)
process exited with signal SIGABRT
```

Le registre ne proposait pas d'autre surface browser/CUA utilisable. La restriction
du runtime n'a pas été contournée. Aucune image simulée, capture reconstruite,
navigation sans authentification ou modification de garde n'a servi de substitut.

À exécuter dans un environnement avec navigateur utilisable : démarrer Auth et
Firestore Emulator en C2 demo, créer des acteurs/reçus fictifs uniques, démarrer
l'application Admin complète en développement, se connecter par le vrai formulaire,
tester import/liste/prise en charge/clôture et erreurs de permissions/version, puis
vérifier desktop et mobile avec les vrais layout et AdminGuard. Le nettoyage doit
cibler uniquement les références et comptes fictifs créés pour cette recette.

## Traces de la session

- `work/admin-lot12-npm-ci.log` : installation stricte, code 0.
- `work/admin-lot12-build.log` : premier build, échec TLS des polices.
- `work/admin-lot12-build-system-tls.log` : build complet réussi avec certificats système.
- `work/admin-lot12-browser-status.log` : relevé des sorties observées et statut non exécuté ; ce fichier est un compte rendu, pas un log navigateur brut.

Ces traces sont des artefacts de session, pas des dépendances du dépôt. Aucune
capture n'existe pour ce lot. État final : **build validé ; visuel non exécuté**.
Aucune fusion, production, modification de données réelles ou activation Meta.
