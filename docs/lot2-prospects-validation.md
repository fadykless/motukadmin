# Lot 2 — Prospects : état de développement et validation

## Périmètre
Branche : `feature/admin-contact-requests`. Aucun déploiement ni fusion vers `main` autorisé par le présent lot.

API développées :
- `GET /api/admin/contact-requests` : liste filtrée, pagination par curseur.
- `GET /api/admin/contact-requests/:id` : détail et 50 derniers événements.
- `PATCH /api/admin/contact-requests/:id` : statut, motif de clôture, commentaire et affectation.
- `/prospects` : interface de consultation et traitement.

L'authentification et les rôles `admin` / `manager` sont contrôlés côté serveur. Les identifiants du prospect ne sont pas modifiables via PATCH.

## Données
Collection existante : `contactRequests`. Champs initiaux attendus : `productId`, `buyerId`, `commissionnaireId`, `status`, `createdAt`. Champs de traitement : `assignedTo`, `closedReason`, `closedComment`, `updatedAt`, `updatedBy`.

Historique : `contactRequests/{id}/history/{eventId}`. Les écritures sont effectuées dans la même transaction que la mise à jour du prospect.

## Index Firestore à prévoir
Les combinaisons de filtres `status`, `commissionnaireId`, `productId`, `assignedTo`, `createdAt` et tri par `createdAt` peuvent nécessiter des index composites. Définir les combinaisons utilisées en production et créer les index signalés par Firestore avant activation. Aucun index n'a été appliqué à Firebase dans ce lot.

## Tests obligatoires non encore exécutés
1. Rejet 401 sans jeton, 403 sans rôle.
2. Liste, filtres et pagination avec jeu de données réel.
3. Détail, historique et gestion d'une référence absente.
4. Mise à jour du statut et motif de clôture obligatoire.
5. Affectation et réaffectation d'un responsable autorisé.
6. Rejet des champs `productId`, `buyerId`, `commissionnaireId` dans PATCH.
7. Contrôle des informations personnelles.
8. Vérification des règles Firestore et non-régression du Lot 1.
9. `npm run lint` et `npm run build` — réussis dans GitHub Actions sur `ca07258` (runs 40574918776 et 40574934311).

## État vérifié au 27 octobre 2026
- PR #2 ouverte en brouillon, sans fusion ni déploiement.
- L'API liste vérifie l'origine commissionnaire et la correspondance avec le partenaire sur chaque véhicule chargé.
- L'API détail vérifie le canal Motuka et l'origine commissionnaire du véhicule ; les modifications sont également limitées au canal Motuka.
- La liste expose un nom de véhicule lorsqu'il est renseigné dans `products.name`.
- L'affectation utilise une liste de responsables ; la modification vérifie leur compte Firebase Authentication.
- Les réponses d'historique sont limitées à des champs d'audit explicitement autorisés.
- Les contrôles automatiques sont réussis, mais les tests Firebase et la vérification des index ne sont pas réalisés.

## Limites connues
- La pagination post-filtrée lit au maximum dix lots de 50 documents par appel ; elle peut retourner une page partielle avant la fin du catalogue.
- Les curseurs ne sont pas liés cryptographiquement aux filtres ; leur comportement doit être testé lors d'un changement de filtre ou de données.
- L'historique est limité aux 50 événements les plus récents.
- Les coordonnées et identités lisibles des acheteurs et partenaires ne sont pas enrichies.
- La compatibilité avec les données réellement créées par la marketplace doit être testée.
- Le raccordement au site public et les visiteurs anonymes sont hors périmètre.
- Aucun test fonctionnel Firebase ni test de production n'a été réalisé.

Ces limites doivent être résolues ou acceptées explicitement avant validation finale.
