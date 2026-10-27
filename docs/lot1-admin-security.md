# Motuka Admin — Lot 1 : état réel de la branche

Branche : `feature/admin-security-partners`. **Ne pas fusionner, déployer ou activer en production sans validation.**

## Décision produit actualisée
- **Aucune création ni utilisation de la collection `partners`** pour la gestion des commissionnaires.
- Les commissionnaires sont des utilisateurs existants : `users/{uid}.isPartner === true`.
- Attribution/retrait par un administrateur, directement dans `users`. Pas de formulaire de création de compte commissionnaire, ni de statut `pending`.
- Bloquer un utilisateur retire `isPartner`; le déblocage ne le restaure pas automatiquement.
- Les documents historiques `partners`, s'ils existent, sont conservés sans suppression ni migration automatique.

## API de cette branche
Toutes les routes exigent un Firebase ID token dans `Authorization: Bearer ...`, vérifié côté serveur avec le rôle `users/{uid}.role` et l'état du compte Auth.
- `GET /api/admin/users` : admin et manager ; jusqu'à 500 utilisateurs, **sans pagination**.
- `PATCH /api/admin/users` : admin seulement, blocage/déblocage ; suppression de compte non implémentée.
- `GET /api/admin/partners` : liste des `users` avec `isPartner=true` ; téléphone réservé à admin.
- `POST /api/admin/partners` : admin seulement ; attribue directement `isPartner=true` à un UID Auth existant.
- `PATCH /api/admin/partners` : admin seulement ; attribue/retire `isPartner` (booléen).
- `PATCH /api/admin/products` : modification de statut des annonces ; transitions métiers fines à valider.
- `DELETE /api/admin/products` : archivage logique, admin seulement.
- `POST /api/admin/products` : **désactivé** (HTTP 409) ; propriétaire, consentement et données privées non sécurisés.

## Configuration
`firebase-admin` et `server-only` ajoutés dans `package.json`, mais **`package-lock.json` n'est pas encore synchronisé**. Identifiants Firebase Admin SDK à fournir uniquement côté serveur (`FIREBASE_SERVICE_ACCOUNT_JSON` ou ADC), jamais dans Git.

## Risques et blocages de livraison
1. **Compilation et lint non exécutés** : l'état de la branche n'est pas validé.
2. **Aucun test Firebase Emulator ou test d'intégration exécuté** : contrôler refus non autorisé, rôles, blocage, attribution/retrait et accès aux coordonnées privées.
3. La marketplace administrative lit encore directement `products` via Firestore client : compatibilité avec les règles restrictives non établie.
4. Les formulaires administratifs de création et modification d'annonces sont provisoirement désactivés, pas remplacés par un flux sécurisé complet.
5. Le formulaire de publication conserve du code Storage hérité ; `productPrivate`, consentement vendeur et contact Motuka restent à intégrer et tester.
6. Les limites de 500 résultats et l'absence de pagination doivent être traitées.
7. Vérifier dans le dépôt public `fadykless/motuka` que le droit de publication illimitée repose sur `isPartner` et qu'il est protégé contre l'auto-attribution par les règles Firestore. **Ne pas modifier le dépôt public sans autorisation.**
8. Vérifier les accès directs Firestore et les données sensibles exposées par les autres API/pages administratives.

## Livraison
Aucun merge vers `main`, aucune migration destructive, aucun déploiement ni activation commerciale dans ce lot sans validation explicite.
