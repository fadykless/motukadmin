# Motuka Admin — Lot 1 (développement uniquement)

Branche: `feature/admin-security-partners`. Aucun déploiement ni fusion autorisé.

## Rôles provisoires
- admin: gestion utilisateurs (blocage), annonces (création/statut/archivage), commissionnaires (création/activation/suspension).
- manager: lecture des utilisateurs/partenaires, création d'annonces directes, modification du statut des annonces.
- Suppression de comptes Firebase Auth: **non implémentée**; archivage d'annonces à la place d'une suppression définitive.
- Les règles métiers de transitions de statuts et les habilitations fines restent à valider.

## API
Requiert `Authorization: Bearer <Firebase ID token>`. Contrôle du rôle côté serveur dans `users/{uid}`, révocation du token vérifiée.
- `GET/PATCH /api/admin/users`
- `POST/PATCH/DELETE /api/admin/products` (DELETE = archivage)
- `GET/POST/PATCH /api/admin/partners`

## Configuration
Installer `firebase-admin` et `server-only`. Configurer les identifiants Admin SDK exclusivement côté serveur (par exemple `FIREBASE_SERVICE_ACCOUNT_JSON` ou Application Default Credentials). Ne jamais ajouter ces secrets au dépôt.

## Compatibilité / limites
- Le dépôt public vérifie `users/{uid}.isPartner`; le statut `active` dans `partners/{uid}` doit être synchronisé transactionnellement.
- Les fiches partenaires historiques avec identifiants aléatoires exigent une migration manuelle vers les UID Auth; **aucune migration automatique**.
- Publication commissionnaire depuis admin désactivée tant que UID, consentement et `productPrivate` ne sont pas intégrés.
- Les anciennes pages peuvent encore lire/écrire directement Firestore: migrer leurs appels avant tout déploiement des nouvelles règles.
- Les images utilisent encore les chemins Storage historiques; audit de compatibilité nécessaire.
- Les règles Firebase du dépôt public ne doivent pas être déployées avant validation complète.
- Aucun test d'émulateur, build ou test d'intégration n'a été exécuté par ce commit.
