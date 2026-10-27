# Motuka Admin — Plan de recette de sécurité (Lot 1)

Statut : **à exécuter** sur un environnement Firebase de préproduction isolé. Ce document n'atteste d'aucun test fonctionnel exécuté.

## Prérequis
- Déployer la branche `feature/admin-security-partners` sur une URL de préproduction protégée, sans fusionner `main`.
- Configurer les variables serveur Firebase Admin exclusivement dans la préproduction ; ne jamais les exposer via `NEXT_PUBLIC_*`.
- Préparer des comptes Firebase Authentication **distincts** : administrateur actif, manager actif, utilisateur standard actif, administrateur bloqué dans Firestore, administrateur désactivé dans Auth, utilisateur candidat commissionnaire, utilisateur bloqué.
- Utiliser des données factices, sauvegarder l'état initial et définir une procédure de remise à zéro.
- Vérifier séparément les règles Firestore et Storage du dépôt public `motuka` sur le même modèle de données. Le SDK Admin contourne les règles Firestore : un test API réussi ne prouve pas la sécurité des accès directs côté navigateur.

## Matrice d'autorisation API
| Scénario | Résultat attendu |
|---|---|
| Sans jeton : GET /api/admin/users | 401 |
| Jeton invalide/révoqué : GET /api/admin/users | 401 |
| Utilisateur standard : GET /api/admin/users | 403 |
| Manager actif : GET /api/admin/users | 200, sans téléphone |
| Admin actif : GET /api/admin/users | 200, avec téléphone si renseigné |
| Admin bloqué dans Firestore : GET /api/admin/users | 403 |
| Admin désactivé dans Firebase Auth : GET /api/admin/users | 403 ou 401 |
| Manager : PATCH /api/admin/users | 403 |
| Admin : PATCH /api/admin/users sur son propre UID | 403 |
| Admin : PATCH /api/admin/users avec UID invalide | 400 |
| Admin : blocage d'un candidat commissionnaire | status=blocked et isPartner=false, même transaction |
| Admin : déblocage de cet utilisateur | status=active, isPartner reste false |
| Manager : GET /api/admin/partners | 200, sans téléphone |
| Utilisateur standard : GET /api/admin/partners | 403 |
| Manager : POST/PATCH /api/admin/partners | 403 |
| Admin : POST /api/admin/partners avec UID existant et actif | 200, users/{uid}.isPartner=true |
| Admin : POST avec UID inconnu | 404 |
| Admin : POST avec compte Auth désactivé | 409 |
| Admin : POST avec utilisateur bloqué | 409 |
| Admin : POST avec isPartner déjà true | 409 |
| Admin : PATCH isPartner=false | 200, users/{uid}.isPartner=false |
| Admin : PATCH répétée sans changement | 409 |
| Toute tentative de gestion commissionnaire | Aucune écriture dans la collection `partners` |
| Utilisateur standard : PATCH /api/admin/products | 403 |
| Manager : DELETE /api/admin/products | 403 |
| Admin : DELETE /api/admin/products | Archive (hidden), sans suppression physique |
| Admin/manager : POST /api/admin/products | 409, publication administrative suspendue |

## Vérifications transversales
1. Tester une requête API directement (hors interface) pour éviter de confondre masquage des boutons et contrôle serveur.
2. Vérifier que les changements de rôle/statut sont effectifs sur les requêtes suivantes, même avec un ancien ID token encore valide.
3. Vérifier que les pages lisant directement Firestore ne peuvent pas contourner les règles côté client ; tester la visibilité des téléphones et des données `productPrivate` depuis un compte non autorisé.
4. Tester les limites de requêtes et les identifiants invalides, ainsi que l'absence de fuite d'informations sensibles dans les erreurs.
5. Documenter pour chaque cas : date, compte de test, résultat HTTP, effet Firestore attendu/observé, capture ou log, verdict.

## Critères de sortie
- `npm ci`, `npm run lint` et `npm run build` réussis sur le commit candidat.
- Tous les scénarios critiques d'autorisation et d'intégrité réussis.
- Compatibilité Firestore/Storage démontrée sur préproduction, sans exposition de contacts privés.
- Aucune écriture vers `partners`, aucune activation de publication admin ou du programme commercial.
- Revue du rollback et validation explicite du fondateur **avant** fusion ou déploiement production.
