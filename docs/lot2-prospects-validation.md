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
9. `npm run lint` et `npm run build`.

## Limites connues
- La liste n'effectue pas encore de vérification de l'origine commissionnaire de chaque annonce référencée ; la vérification existe sur la modification.
- Les noms, coordonnées et détails lisibles des véhicules ne sont pas encore enrichis dans les réponses.
- L'affectation se fait actuellement par UID et non par sélection d'un agent.
- L'historique est limité aux 50 événements les plus récents en lecture.
- La vérification des comptes Firebase Authentication des responsables affectés reste à ajouter.
- La compatibilité avec les données réellement créées par la marketplace doit être testée.
- La connexion du bouton public et les visiteurs anonymes sont hors périmètre.
- Aucun test fonctionnel Firebase ni test de production n'a été réalisé.

Ces limites doivent être résolues ou acceptées explicitement avant validation finale.
