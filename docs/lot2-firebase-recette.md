# Lot 2 — Protocole de recette Firebase (préproduction uniquement)

## Préconditions bloquantes
- Utiliser un projet Firebase **distinct de la production**, avec des comptes et des véhicules fictifs.
- Vérifier explicitement l'ID du projet Firebase côté serveur et côté client.
- Déployer la branche `feature/admin-contact-requests` uniquement sur un environnement isolé, après autorisation spécifique.
- Préparer des jetons de test pour admin, manager et utilisateur ordinaire ; ne jamais committer les jetons.
- Vérifier les règles Firestore : les clients non administratifs ne doivent pas pouvoir modifier `contactRequests` ou `history` directement.
- Vérifier les index composites suggérés par les erreurs Firestore sur les combinaisons de filtres réellement utilisées. Ne pas les appliquer à la production sans validation.

## Données fictives minimales
- Deux commissionnaires actifs (`users.isPartner=true`) et un vendeur non partenaire.
- Deux annonces `products.listingOrigin=commissionnaire` liées aux commissionnaires actifs, une annonce ordinaire et une annonce orpheline.
- Au moins 55 demandes `contactRequests` mêlant annonces commissionnaires, annonces ordinaires et références invalides ; conserver `contactChannel=motuka` pour les demandes commissionnaires.
- Des demandes datées avant, pendant et après une période filtrée, avec statuts différents et responsables affectés ou non.
- Un commissionnaire dont `isPartner` passe de true à false pendant la recette.

## Matrice de vérification
| Test | Résultat attendu |
| --- | --- |
| Liste sans jeton / jeton invalide | 401 |
| Liste avec utilisateur ordinaire | 403 |
| Liste avec admin / manager | 200 ; aucune annonce ordinaire ni commissionnaire inactif |
| Filtre statut, commissionnaire, véhicule, responsable | Résultats conformes à chaque filtre |
| Dates invalides et période inversée | 400 |
| Pagination > 50 documents, demandes non éligibles intercalées | Pas de doublons ni de sauts ; curseur cohérent |
| Réutilisation d'un curseur avec filtres différents | 400 lorsque les critères ne correspondent pas |
| Détail hors périmètre commissionnaire | 404 |
| PATCH sur prospect commissionnaire valide | Statut et responsable mis à jour |
| PATCH avec `productId`, `buyerId` ou `commissionnaireId` | 400 ; aucune modification |
| Clôture sans motif / motif autre sans commentaire | 400 |
| Clôture avec motif `completed` | Statut fermé, sans affirmation de vente |
| Affectation à un compte non autorisé ou désactivé | 400 |
| Mutation avec partenaire devenu inactif | Rejet |
| Historique après mutation | Événement transactionnel créé, champs autorisés seulement |
| Tentative d'écriture directe par utilisateur ordinaire | Rejet Firestore |
| Régression Lot 1 | Utilisateurs, partenaires et annonces fonctionnent toujours |

## Exécution
Contrôles locaux sans Firebase : `node --test scripts/test-prospects-dates.mjs scripts/test-prospects-closure.mjs scripts/test-prospects-cursor.mjs`. Ne pas inclure le script de tests d’accès, qui exige des jetons de préproduction.

Tests d'accès HTTP en lecture seule, uniquement après déploiement isolé et confirmation de l'hôte :

```sh
ADMIN_BASE_URL=https://staging.example.com \
ADMIN_STAGING_HOST=staging.example.com \
ADMIN_STAGING_CONFIRMED=yes \
ADMIN_ID_TOKEN=... MANAGER_ID_TOKEN=... USER_ID_TOKEN=... \
node scripts/test-prospects-access.mjs
```

Les scénarios PATCH et règles Firestore nécessitent une recette manuelle ou une suite d'intégration avec base de données fictive, jamais en production.

## Critères de sortie
- Tous les tests bloquants de sécurité réussis.
- Index nécessaires identifiés et validés en préproduction.
- Aucun bug critique de pagination, d'affectation ou d'audit.
- Validation fonctionnelle du Product Manager.
- Fusion et déploiement soumis à une autorisation distincte.
