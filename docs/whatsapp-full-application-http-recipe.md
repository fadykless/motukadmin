# Lot 15 — Parcours HTTP sur les applications complètes épinglées

Date : 21 novembre 2026. Aucun changement de comportement produit dans ce lot.
Il remplace, pour cette nouvelle preuve seulement, le contexte de lancement des
fixtures minimales du lot11 par les vrais arbres applicatifs Marketplace et Admin.
Les anciens runners et manifests restent inchangés.

## Sources et dépendances effectivement utilisées

| Application | Commit | Couverture de source vérifiée |
|---|---|---|
| Marketplace PR34 | `9dcd249187ca0209e5da6e3576a0a2be7f12c3ac` | 210/212 blobs suivis présents et conformes ; les deux vidéos statiques listées ci-dessous sont absentes du checkout fourni |
| Admin PR12 | `3ffea5e879621991e790b3f123a49a0756d01bd1` | 139/139 blobs suivis présents et conformes |

`tests/whatsapp-full-app-sources.json` est un nouveau manifest, dérivé de l'arbre
GitHub de ces commits, pas une modification du manifest partiel du lot11. Chaque
fichier local a d'abord été confronté à son Git blob SHA, puis son SHA256 a été
consigné avec sa taille et son mode. Les nouveaux helpers Firebase Admin de
Marketplace font partie des fichiers vérifiés.

Exceptions explicites : `public/mobilePub.mp4` et `public/mobilePub-ancien.mp4`.
Ces vidéos ne sont pas importées par le code JavaScript ; la bannière publique
référence toutefois mobilePub.mp4 par URL. Elles ne sont pas demandées dans le
parcours HTTP testé. Aucune complétude de ces médias ou recette de bannière n'est
revendiquée. Aucune autre omission ou divergence source n'est tolérée.

Les vrais package.json, lockfiles, next.config, layouts, pages, routes, composants
et autres fichiers suivis sont copiés tels quels vers deux répertoires temporaires.
Les octets contrôlés sont gardés en mémoire puis écrits directement : aucune
seconde lecture source non vérifiée. Aucun package, layout ou configuration Next
synthétique n'est créé. .env*, .git, .next, node_modules, logs et fichiers de clés
sont refusés/exclus ; aucun cache ou secret local n'est copié.

Chaque application est liée à son jeu de dépendances installé, sans nouvelle
installation ou build dans ce lot. Les six versions suivantes sont confrontées à
chaque lock source ; l'intégralité des fichiers de dépendances n'est pas hashée.

| Dépendance | Marketplace | Admin |
|---|---:|---:|
| Next | 16.1.6 | 16.1.6 |
| React / React DOM | 19.2.4 | 19.2.3 |
| Firebase client | 12.12.1 | 12.11.0 |
| Firebase Admin | 13.8.0 | 13.10.0 |
| Material UI | 9.0.0 | 7.3.9 |

## Parcours exécuté et résultats

Deux serveurs `next dev --webpack` démarrent les vraies applications sur loopback,
avec leur code et leur configuration conservés. Le runner n'utilise pas de
navigateur. La preuve porte sur leurs routes HTTP ; elle ne signifie pas que
toutes les pages ou tous les autres modules ont été exécutés.

**25 contrôles HTTP réussis, code final 0** :

1. Les routes des deux applications répondent avec leur challenge unique/refus Auth attendu.
2. Un POST Marketplace mal signé ne peut produire de reçu ou dossier importable.
3. Les messages signés produisent qualification, catalogue fictif, sélection et intention conseiller ; le reçu humain n'est jamais seedé.
4. L'intention utilise le prix canonique relu après modification fictive, sans champ privé ou modèle libre copié.
5. Un second compte ne peut récupérer la sélection du premier en fournissant un ID brut.
6. Le non-staff ne peut importer ; un staff authentifié importe la clé du reçu produit, retrouve le même DTO et le même prix, prend le dossier en charge puis le clôture.
7. Rejeu Marketplace, réimport Admin et rejeu de clôture ne modifient ni reçu, ni dossier, ni audit.
8. Les dossiers restent explicitement dryRun/fixtureOnly.

**6/6 tests de garde réussis** : environnement fermé, refus production avant
SDK/fichiers/processus, couverture du nouveau manifest, refus de source/hash/lien
ou chemin sensible, refus des versions de dépendances incompatibles et refus du
port occupé sans arrêter son serveur. Lint ciblé réussi.

Les produits et acteurs Auth/profils sont fictifs et propres à un UUID. Nettoyage
uniquement des références créées/réservées et des deux groupes Next créés par ce
runner, y compris à interruption. Aucun effacement de collection, aucune fermeture
par nom de processus ou port. Les sorties brutes Next, tokens et payloads ne sont
pas journalisés. Les traces finales montrent CLEANUP et arrêt des émulateurs.

## Isolation et commandes

Le serveur WhatsApp Marketplace et Admin partagent `demo-motuka-c2`, Auth
127.0.0.1:9099 et Firestore 127.0.0.1:8080. Admin réutilise son mode client C2 et
`requireStaff` réel. Marketplace reçoit `NEXT_PUBLIC_C3_UI_EMULATOR_MODE=true`
pour son initialisation cliente fictive ; ce client désigne demo-motuka-c3-ui,
distinct du projet serveur du parcours. Aucun navigateur n'utilise ce client dans
ce test : aucune cohérence de parcours client C3/C2 n'est revendiquée.

Tous les credentials Firebase Admin/Meta/WhatsApp préexistants sont refusés.
Les faux secrets du webhook sont générés en mémoire et réservés au processus de
test. L'accès Admin générique Marketplace reste sans configuration de service et
sans fallback réel ; son store WhatsApp d'émulateur est indépendant. Les proxys et
certificats système nécessaires sont les seuls paramètres réseau hérités ; TLS
reste vérifié, jamais désactivé. Les environnements enfants sont filtrés.

Prérequis : Node 22+, Java 21, Firebase CLI 14, dépendances applicatives des deux
sources installées conformément à leurs lockfiles. Depuis le checkout du runner,
utiliser des checkouts de source distincts et épinglés :

```sh
git -C /chemin/source-marketplace checkout --detach 9dcd249187ca0209e5da6e3576a0a2be7f12c3ac
git -C /chemin/source-admin checkout --detach 3ffea5e879621991e790b3f123a49a0756d01bd1
export MARKETPLACE_SOURCE_DIR=/chemin/absolu/source-marketplace
export ADMIN_SOURCE_DIR=/chemin/absolu/source-admin
npm run test:whatsapp-full-app:safety
npm run lint:whatsapp-full-app
WHATSAPP_FULL_APP_TEST_CONFIRMED=yes WHATSAPP_ADMIN_DRY_RUN_ENABLED=true \
NEXT_PUBLIC_C2_EMULATOR_MODE=true GCLOUD_PROJECT=demo-motuka-c2 \
GOOGLE_CLOUD_PROJECT=demo-motuka-c2 NODE_ENV=test \
firebase emulators:exec --only auth,firestore --project demo-motuka-c2 \
  --config firebase.c2.test.json 'npm run test:whatsapp-full-app:http'
```

ADMIN_SOURCE_DIR doit viser la source PR12 exacte, pas le dossier du nouveau runner
dont les scripts package.json ont changé. Par défaut, node_modules est pris sous
chaque source. Si les dépendances déjà installées sont conservées séparément,
définir ADMIN_DEPENDENCIES_DIR et/ou MARKETPLACE_DEPENDENCIES_DIR avec leurs chemins
absolus. Les six versions restent contrôlées ; aucun mismatch n'est ignoré.
Les ports Next sont 3220/3221 ; un port occupé est refusé avant SDK/temp/spawn.

## Portée et état de préparation

Logs nouveaux : `work/admin-lot15-http.log`, `work/admin-lot15-safety.log`,
`work/admin-lot15-lint.log`. Résultats des builds précédents, des règles clientes
et des tests des autres lots non rejoués et non revendiqués comme nouveaux succès.
Le présent émulateur C2 est permissif pour Admin SDK ; ce lot ne remplace pas la
preuve cliente sous règles du lot14 ni la comparaison des règles déployées.

État : parcours HTTP interplateformes validé sur les sources applicatives actuelles
dans l'environnement isolé. Import de la demande déclenché explicitement par staff,
pas transfert automatique ni contact effectif. Aucune recette UI, mobile/desktop,
média, build global ou intégration WhatsApp réelle exécutée ici.

Le nouveau numéro dédié est confirmé **non acquis**. Le raccordement Meta et les
envois réels restent bloqués, ainsi que la recette réelle et l'autorisation de
lancement. Les règles effectivement déployées restent non vérifiées. Ce lot ne
prononce pas de GO production et n'effectue aucune fusion, dépense, migration,
modification de données réelles ou activation de paiement.
