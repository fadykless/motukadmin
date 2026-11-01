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
- Les tests HTTP sont uniquement autorisés sur l'adresse locale ou sur une préproduction explicitement isolée. Le script `scripts/test-admin-access.mjs` actuel exige un hôte HTTPS de staging : **il n'est pas encore adapté au serveur local HTTP**, et ne doit pas être contourné en utilisant la production.

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
