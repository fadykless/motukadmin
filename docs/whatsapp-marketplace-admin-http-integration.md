# Lot 11 — Recette HTTP Marketplace → Admin sur émulateurs partagés

Ce lot ajoute uniquement une preuve d'intégration et ses gardes. Aucun comportement
produit Marketplace ou Admin n'est modifié, aucun nouveau moteur n'est copié dans
le dépôt Admin. Les sources sont acquises depuis un checkout Marketplace explicite.

## Sources exactes

`tests/whatsapp-integration-sources.json` contient les SHA256 des seuls fichiers de
routes/modules utilisés, dérivés de lectures aux commits GitHub immuables :

- Marketplace `fadykless/motuka`, `37741ef53cab91225dccaee7a33ed10836051647` (PR33), 11 fichiers.
- Admin `fadykless/motukadmin`, `a89801947dbe39065476457cbb4cc7eb6debf5cd` (PR9), 7 fichiers.

Avant SDK, répertoire temporaire ou processus, le runner vérifie le mode isolé puis
les SHA256 des deux sources. Un fichier modifié, un lien hors checkout, une source
manquante ou un port occupé provoque un refus. Les octets vérifiés sont gardés en
mémoire puis écrits directement dans les fixtures : aucune seconde lecture non
vérifiée du checkout. Les fichiers .env et les dépendances du checkout Marketplace
ne sont jamais lus. Le manifest ne prétend pas vérifier tout le dépôt ou son HEAD.

## Parcours réellement exercé

Deux vrais serveurs Next dev/webpack démarrent les routes épinglées dans deux
fixtures minimales distinctes. Auth et Firestore partagent `demo-motuka-c2`.

Le runner crée uniquement produits et comptes staff/non-staff fictifs. Il **ne
seede aucun reçu humain**. Il appelle le webhook Marketplace par HTTP signé :
qualification → budget/devise → catalogue → sélection → intention conseiller.
L'annonce est relue après modification du prix fictif. La clé HMAC attendue du reçu
est résolue en interne par le runner ; l'ACK public ne divulgue aucun contexte.

Un staff authentifié importe ensuite ce reçu par sa clé via l'API Admin, consulte
la liste, prend le dossier en charge et le clôture. Le DTO/prix/contexte sont
comparés au reçu produit. Rejeu Marketplace, réimport Admin et rejeu de clôture
ne modifient pas les reçus, dossiers ou audits existants. Signature invalide et
non-staff ne peuvent créer un dossier. Un second compte WhatsApp sans sélection
ne peut associer l'annonce du premier en fournissant son identifiant brut.

Il s'agit d'un **import Admin déclenché par un staff**, pas d'un transfert ou d'une
notification automatique. Les statuts/dossiers restent dryRun/fixtureOnly. Aucun
conseiller ou client réel contacté, aucun consentement réel inféré.

## Reproduction

Prérequis : Node 22+, Java 21, Firebase CLI 14 et dépendances Admin installées.
Utiliser un checkout Marketplace contenant exactement les fichiers du commit :

```sh
git -C /chemin/vers/motuka checkout --detach 37741ef53cab91225dccaee7a33ed10836051647
export MARKETPLACE_SOURCE_DIR=/chemin/absolu/vers/motuka
npm run test:whatsapp-integration:safety
npm run lint:whatsapp-integration
WHATSAPP_INTEGRATION_TEST_CONFIRMED=yes WHATSAPP_ADMIN_DRY_RUN_ENABLED=true \
NEXT_PUBLIC_C2_EMULATOR_MODE=true GCLOUD_PROJECT=demo-motuka-c2 \
GOOGLE_CLOUD_PROJECT=demo-motuka-c2 NODE_ENV=test \
firebase emulators:exec --only auth,firestore --project demo-motuka-c2 \
  --config firebase.c2.test.json 'npm run test:whatsapp-integration:http'
```

Terminal sans credentials de service ni secrets/tokens WhatsApp ou Meta. Les faux
secrets sont générés en mémoire. Auth : 127.0.0.1:9099 ; Firestore : 127.0.0.1:8080 ;
Admin Next : 127.0.0.1:3220 ; Marketplace Next : 127.0.0.1:3221. Aucun port alternatif
ou serveur tiers n'est adopté. L'environnement des enfants est filtré explicitement.
Readiness : challenge Marketplace unique au run et refus Auth Admin attendu,
avec contrôle que les deux processus créés restent vivants.

Fixtures et identifiants utilisent un UUID propre au run ; créations sans
écrasement, collisions refusées. Le nettoyage cible uniquement les références et
comptes fictifs connus et les deux groupes Next créés. Il s'exécute aussi lors de
SIGINT/SIGTERM. Aucun effacement de collection ou arrêt par nom/port. Aucun token,
numéro, payload ou erreur brute n'est journalisé.

## Portée des preuves

Les nouveaux tests de sécurité vérifient isolation, refus pré-SDK du runner en
production, mismatch SHA256/chemins et refus d'un port occupé sans arrêter son
serveur. Les contrôles HTTP d'intégration sont distincts des 7 unités / 26 contrôles
Admin du lot10 et des tests Marketplace précédents, qui ne sont pas revendiqués
comme réexécutés ici. Résultats exacts consignés dans la PR.

Il ne s'agit ni d'un build global des applications, ni d'une recette navigateur,
mobile/desktop, ni de WhatsApp réel. Les règles Firestore clientes ne sont pas
validées par Admin SDK sur émulateur permissif. Les dossiers n'ont pas de coordonnées
et les sorties restent simulées ; pas de transport Meta. Aucune fusion, production,
migration, modification de données réelles, dépense ou activation commerciale.
