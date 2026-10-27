# Motuka Admin — Recette d'intégrité Firestore (Lot 1)

**Statut : protocole préparé, non exécuté.** Exécuter exclusivement dans un projet Firebase de préproduction isolé avec des utilisateurs et annonces fictifs. Ne pas utiliser la production.

## Préparation
1. Identifier le projet Firebase et l'URL de préproduction, puis confirmer qu'aucun ne pointe vers les ressources de production.
2. Préparer des comptes Auth distincts : admin, manager, utilisateur ordinaire, candidat commissionnaire, utilisateur bloqué et compte Auth désactivé.
3. Dans `users/{uid}`, préparer les documents associés avec `role`, `status`, `isPartner`. Consigner les valeurs initiales et prévoir leur restauration.
4. Créer une annonce fictive dans `products/{id}` et vérifier les éventuelles références dans `productPrivate/{id}`. Ne pas utiliser de données client.
5. Exécuter d'abord `node scripts/test-admin-access.mjs` avec des jetons de préproduction. Ce script ne teste que les refus d'accès et les lectures.

## Tests d'écriture autorisés — contrôle avant/après Firestore
| Test | Requête avec jeton admin sauf indication | État attendu |
|---|---|---|
| Attribution | POST `/api/admin/partners` avec UID candidat actif | `users/{uid}.isPartner=true` et `partnerUpdatedAt` renseigné |
| Attribution répétée | Même POST | HTTP 409, document inchangé |
| Retrait | PATCH `/api/admin/partners` avec `isPartner=false` | `isPartner=false` |
| Retrait répété | Même PATCH | HTTP 409, document inchangé |
| Attribution compte bloqué | POST avec UID bloqué | HTTP 409, `isPartner` inchangé |
| Attribution Auth désactivée | POST avec UID désactivé | HTTP 409, `isPartner` inchangé |
| Blocage partenaire | PATCH `/api/admin/users` avec `status=blocked` | `status=blocked` ET `isPartner=false` |
| Déblocage | PATCH `/api/admin/users` avec `status=active` | `status=active`, `isPartner` reste false |
| Auto-blocage admin | PATCH avec UID de l'admin appelant | HTTP 403, document inchangé |
| Statut annonce | PATCH `/api/admin/products` avec ID fictif et statut autorisé | `status` modifié, `updatedAt` renseigné |
| Archivage annonce | DELETE `/api/admin/products` avec ID fictif | `status=hidden`, `deletedAt` renseigné ; document conservé |
| Création admin | POST `/api/admin/products` | HTTP 409, aucune annonce créée |
| Suppression interdite manager | DELETE `/api/admin/products` avec jeton manager | HTTP 403, annonce inchangée |

## Invariants à vérifier
- **Aucune collection `partners` créée** et aucune écriture dans celle-ci.
- Les opérations bloquées par HTTP 4xx n'ont aucun effet de bord Firestore.
- Les modifications multi-documents échouent sans mutation partielle si un ID d'annonce est inexistant.
- Le blocage du compte retire le statut commissionnaire dans la même transaction.
- Les données `productPrivate` ne deviennent pas accessibles aux utilisateurs non autorisés via les lectures directes du navigateur.
- Les permissions du SDK Admin ne constituent pas une preuve de sûreté des règles Firestore et Storage : les tester séparément via SDK client ou émulateurs.
- Vérifier la correspondance des statuts d'annonce avec l'application publique `motuka` avant toute fusion.

## Journal de recette
Pour chaque cas, relever : identifiant du scénario, date, environnement, rôle, méthode/chemin, code HTTP attendu/observé, état Firestore avant/après, verdict et preuve. Ne pas enregistrer les ID tokens ni les secrets dans les journaux.

## Sortie
Un échec d'autorisation, une fuite de téléphone privé, une écriture dans `partners` ou une incompatibilité avec les règles publiques bloque la mise en production. La validation explicite du fondateur reste obligatoire.
