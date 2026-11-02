# Motuka Admin — environnement isolé de recette C2

**Statut : préparation uniquement.** Aucun projet Firebase, compte ou déploiement n'est créé par ce document. Aucun changement de droits réels n'est autorisé.

## Option recommandée : émulateurs locaux (sans projet Firebase réel)

- Node.js 22, Java 21, dépendances installées via `npm ci`.
- Configuration versionnée : `firebase.c2.test.json`. Auth Emulator sur 127.0.0.1:9099 et Firestore Emulator sur 127.0.0.1:8080. Interface de gestion désactivée.
- Identifiant fictif et réservé aux tests : `demo-motuka-c2`. Ne jamais utiliser l'ID Firebase partagé par Motuka Marketplace et Motuka Admin.
- Démarrer dans un terminal : `npx --yes firebase-tools@14 emulators:start --config firebase.c2.test.json --only auth,firestore --project demo-motuka-c2`.
- Dans un **second terminal**, préparer le serveur avec `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `GCLOUD_PROJECT=demo-motuka-c2` et `GOOGLE_CLOUD_PROJECT=demo-motuka-c2`. Les variables publiques `NEXT_PUBLIC_FIREBASE_*` doivent également désigner une configuration de test cohérente ; ne jamais reprendre celles de production.
- Le lancement de Next.js et la création de comptes fictifs exigent encore une vérification des paramètres Firebase client du dépôt. **Ne pas exécuter de scénario de décision avant cette vérification.**
- Comptes à préparer dans Auth Emulator : administrateur, manager, utilisateur standard et candidat fictif. Les profils Firestore correspondants doivent porter les rôles `admin`, `manager`, `user` et le statut `active`. Une candidature fictive `pending` avec `decisionVersion:0` et `isPartner:false` est requise pour les tests de décision.
- Les tests HTTP sont uniquement autorisés sur l'adresse locale ou sur une préproduction explicitement isolée. Le script `scripts/test-admin-access.mjs` accepte désormais `http://127.0.0.1:<port>/` uniquement si les quatre variables de garde (`GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`) correspondent exactement au projet fictif et aux ports locaux documentés. Les trois jetons doivent provenir de comptes fictifs Auth Emulator. Ne pas utiliser de jetons réels.

## Option cloud ultérieure : projet Firebase de test distinct

Créer manuellement un projet Firebase distinct, avec **nouvel ID**, règles et IAM séparés, et une application Web de test. Ne pas connecter les secrets ou comptes de production. Les coûts éventuels, les permissions de création et les variables Vercel doivent être validés par le fondateur. Ne pas déployer automatiquement.

## Critères de sortie

1. Vérification d'isolation : ID `demo-*`, adresses localhost, aucun credential de production.
2. Authentification 401/403 et rôles sur routes C2 ; données privées masquées aux managers.
3. Décision approuver/refuser atomique, rejouement, concurrence, comptes bloqués, audit.
4. Pagination, cache `no-store`, erreurs HTTP.
5. Dialogues MUI sur mobile et ordinateur.
6. Rapport PASS/FAIL/BLOCKED avec preuves et accord Product Manager + Operations Manager avant toute exploitation réelle.

**NO-GO** pour la fusion de la PR #5, l'attribution réelle de droits et le déploiement en production tant qu'aucune autorisation explicite n'a été reçue.

## Exécution HTTP locale (après démarrage serveur et création des comptes fictifs)

Dans le terminal de recette :

```sh
export GCLOUD_PROJECT=demo-motuka-c2
export GOOGLE_CLOUD_PROJECT=demo-motuka-c2
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export ADMIN_BASE_URL=http://127.0.0.1:3000/
# Définir ADMIN_ID_TOKEN, MANAGER_ID_TOKEN et USER_ID_TOKEN obtenus dans Auth Emulator.
node scripts/test-admin-access.mjs
```

Ce script comprend des requêtes POST/PATCH/DELETE qui doivent être **refusées par les permissions** (401/403). Ne l'exécuter qu'après avoir vérifié que le serveur Next.js pointe réellement vers les émulateurs et que les comptes/jetons sont fictifs. Le contrôle des variables du terminal client ne prouve pas, à lui seul, l'isolation du serveur cible.

## Initialisation de données fictives

Après démarrage des deux émulateurs, dans un second terminal et sans identifiants Firebase réels :

```sh
export GCLOUD_PROJECT=demo-motuka-c2
export GOOGLE_CLOUD_PROJECT=demo-motuka-c2
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
unset FIREBASE_SERVICE_ACCOUNT_JSON GOOGLE_APPLICATION_CREDENTIALS
node scripts/seed-c2-emulator.mjs
```

Ce script prépare cinq comptes fictifs (`c2-test-admin`, `c2-test-manager`, `c2-test-user`, `c2-test-candidate`, `c2-test-blocked`) et une candidature `pending`. Il est conçu pour un émulateur vierge ; le relancer réinitialise les profils et la candidature de test. Les mots de passe ne sont utilisables qu'en local.

Pour récupérer un jeton fictif après initialisation, appeler l'endpoint Auth Emulator `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key` avec `email`, `password` et `returnSecureToken:true`. Ne jamais utiliser de compte réel. Vérifier que Next.js a été démarré avec les mêmes variables d'émulateurs avant tout appel HTTP.

**Point ouvert :** la configuration Firebase client utilisée par l'interface et le lancement complet du serveur local restent à vérifier ; ne pas considérer la recette HTTP comme exécutée.

## Isolation du client Firebase Next.js

Le fichier `src/firebase/index.js` accepte `NEXT_PUBLIC_C2_EMULATOR_MODE=true` pour remplacer la configuration du client par le projet fictif `demo-motuka-c2`, brancher Auth sur `127.0.0.1:9099` et Firestore sur `127.0.0.1:8080`. Le cache persistant est remplacé par un cache mémoire dans ce mode. **Ne jamais activer ce flag sur un déploiement public** ; la configuration de production reste utilisée par défaut.

Dans le terminal qui lance Next.js, après avoir démarré les émulateurs :

```sh
export NEXT_PUBLIC_C2_EMULATOR_MODE=true
export GCLOUD_PROJECT=demo-motuka-c2
export GOOGLE_CLOUD_PROJECT=demo-motuka-c2
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
unset FIREBASE_SERVICE_ACCOUNT_JSON GOOGLE_APPLICATION_CREDENTIALS
npm run dev -- --hostname 127.0.0.1
```

La configuration côté serveur doit aussi utiliser exclusivement les émulateurs. Le flag client seul ne prouve pas l'isolation de toutes les routes serveur. Vérifier les requêtes réseau du navigateur avant d'exécuter les tests de décision.

## Garde serveur C2

`src/lib/server/admin.js` vérifie désormais au premier accès Firebase Admin que `NEXT_PUBLIC_C2_EMULATOR_MODE=true` implique obligatoirement `GCLOUD_PROJECT=demo-motuka-c2`, `GOOGLE_CLOUD_PROJECT=demo-motuka-c2`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` et `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, sans compte de service. Si ces conditions ne sont pas réunies, l'initialisation échoue au lieu d'utiliser Firebase réel.

Attention : ce garde protège les routes qui utilisent `src/lib/server/admin.js`. Toute autre initialisation Firebase dans le dépôt doit être vérifiée séparément. Les tests HTTP réels restent à exécuter.
