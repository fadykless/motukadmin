# Lot 10 — File Admin des demandes de conseiller, simulation locale

Base auditée : `main` Admin `e34e8fe84588cc561c2d1ca6586ac369031e1e14`.
Les PR 2/6/7/8 étaient ouvertes en brouillon à l'audit. Ce lot n'en fusionne aucune
et ne détourne pas les prospects commissionnaires `contactRequests`.
Contrat source : Marketplace PR 33, SHA `37741ef53cab91225dccaee7a33ed10836051647`.

## Parcours de test

La page `/whatsapp-demandes` apparaît dans la navigation uniquement quand le mode
client C2 Emulator est sélectionné. Elle hérite du layout et d'AdminGuard existants.
Le flag client ne donne aucun droit serveur. Les routes exigent indépendamment le
mode isolé, puis `requireStaff` existant : token Firebase vérifié avec révocation,
compte Auth actif, profil non bloqué et rôle `admin` ou `manager`.

- `GET /api/admin/whatsapp-requests?limit=20` : maximum 50 dossiers, dans une fenêtre
  des 100 documents les plus récents ; dossiers expirés/corrompus exclus. La liste
  est explicitement partielle, sans prétendre à une pagination exhaustive.
- `POST /api/admin/whatsapp-requests` : corps contenant **uniquement** `receiptKey`.
  Le serveur relit le reçu `waDryRunMessages` dans sa transaction. Statut prepared,
  dryRun, fingerprint/sessionKey hachés, receivedAt, expiresAt et DTO strict sont
  vérifiés. Aucun contexte, acteur, ID d'annonce ou URL fourni par le client ne fait
  autorité. L'import est idempotent par clé du reçu, pas entre messages différents.
- `PATCH /api/admin/whatsapp-requests/{receiptKey}` : corps contenant uniquement
  `action: claim|close` et `expectedVersion`. `claim` affecte à l'acteur courant ;
  `close` exige que le dossier soit pris en charge par cet acteur. Aucun champ
  assignedTo arbitraire, aucun statut client-contacté, aucun commentaire libre.

Collection privée de test : `waDryRunAdvisorRequests`. Transitions fermées
`new → in_progress → closed`, versions 0/1/2 ; conflit 409 pour version ou acteur
incompatible. Rejeu du même import ou de la même transition : pas d'écriture ni
nouvel audit. Un dossier clôturé ne peut pas être rouvert. Audit borné aux trois
événements fixes imported/claimed/closed, identifiés par le staff de test.

Tous les dossiers ont `dryRun=true`, `fixtureOnly=true`, et expiresAt au plus égal
à l'expiration du reçu et à sept jours après import. TTL logique vérifié à chaque
liste/mutation. Aucun TTL de production ni règle cliente autorisant l'accès ajouté.
Le contexte structuré est revalidé avant affichage ; champs privés/inconnus,
audit ou propriété corrompus entraînent exclusion/refus, sans retour ni log brut.

Le dossier est un instantané historique. Une annonce sélectionnée ne prouve pas sa
disponibilité actuelle. Aucun consentement réel, contact, attribution commerciale,
commission financière, réservation ou paiement n'est créé.

## Isolation et reproduction

Prérequis : Node 22+, Java 21, Firebase CLI 14, dépendances du dépôt installées.
Terminal sans credential de service ni token Meta. Les gardes sont exécutées
**avant** l'import dynamique du module Firebase Admin existant : aucun fallback
vers des services réels quand le mode test est incomplet.

```sh
npm run test:whatsapp-queue
npm run lint:whatsapp-queue
WHATSAPP_ADMIN_DRY_RUN_ENABLED=true NEXT_PUBLIC_C2_EMULATOR_MODE=true \
GCLOUD_PROJECT=demo-motuka-c2 GOOGLE_CLOUD_PROJECT=demo-motuka-c2 NODE_ENV=test \
firebase emulators:exec --only auth,firestore --project demo-motuka-c2 \
  --config firebase.c2.test.json 'npm run test:whatsapp-queue:http'
```

Auth : 127.0.0.1:9099 ; Firestore : 127.0.0.1:8080 ; Next de test : 127.0.0.1:3220.
Les ports occupés sont refusés, aucun serveur tiers ou port alternatif adopté.
Le runner crée ses acteurs/documents uniques avec create, sans écrasement, puis
nettoie uniquement leurs références et son groupe de processus Next. Le répertoire
temporaire n'a pas de .env ; environnement enfant filtré ; aucun token ou erreur
brute journalisé. Le runner est fini et utilise une fixture Next minimale copiant
les vraies routes, le store et `requireStaff` inchangé.

## Preuves et limites

7 tests unitaires : isolation, DTO source, URL canonique, corruption, ordre garde,
contrôle de chaque méthode, champs client interdits et corps borné à 1024 octets.
26 contrôles HTTP réels avec Auth/Firestore Emulator : non staff, compte bloqué ou
désactivé, import concurrent/idempotent, claim concurrent, clôture propriétaire,
versions/rejeux, TTL et exclusion de dossier corrompu. Lint ciblé des nouveaux
modules/routes/tests/scripts et parsing JSX de la page. Les règles Firestore
clientes ne sont pas validées : les tests utilisent Admin SDK sur émulateur.

La page n'a pas reçu de recette navigateur, ni mobile/desktop. Aucun build global
Admin ni test global C2/Prospects n'a été exécuté dans ce lot ; leurs routes ne
changent pas. Les dépendances existantes ont été réutilisées pour la fixture.

Le reçu de démonstration est seedé dans **demo-motuka-c2**, conformément à l'auth
Admin existante. Les lots Marketplace utilisent d'autres projets demo : aucune
ingestion interprojets, tâche automatique ou preuve de bout en bout Marketplace
→ Admin n'est revendiquée. Le projet partagé de recette, le flux de transport réel,
le consentement et les autorisations de lancement restent des dépendances.
La file n'est pas activable en production par ce lot. Aucune fusion ou livraison.
