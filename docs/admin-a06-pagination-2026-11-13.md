# A06 — recette HTTP des listes et de la pagination legacy

Date : 13 novembre 2026. Branche : integration/admin-c2-1-c3-3-foundation ; PR #8.
Base contrôlée : 11258b177a8bbd7feb7878adace78c8c5754d90f.

La base a passé les deux workflows CI 43185606287 et 43185606321, y compris le navigateur C2. Aucun retour d'arbitrage supplémentaire constaté dans Marketplace #17 à ce point de contrôle.

## Extension de recette

Le script HTTP isolé existant ajoute des dossiers fictifs pour vérifier :

- filtres combinés statut, véhicule, commissionnaire, responsable et période ;
- parcours complet admin et manager avec limit=1 ;
- trois documents de même timestamp, départagés par identifiant, sans doublon ni omission ;
- exclusion d'une référence véhicule absente, sans consommer une place visible ;
- rejet des limites, dates et curseurs invalides ou incompatibles avec les filtres ;
- réponse vide avec fin de pagination explicite ;
- no-store sur les réponses paginées.

Seuls les tests et ce compte rendu changent. Les routes, rôles, contrats proposés et politiques métier restent ceux de la base. Aucune modification des données réelles.

## Limites

Les émulateurs ne certifient pas la disponibilité des index composites déployés. Le contrat nouveau flux et ses index restent à convenir avec Developer 1 / Lead Tech. La couverture ne certifie ni l'isolation interpartenaires du futur flux ni la visibilité après retrait du droit ; ces décisions restent à arbitrer avec Operations/PM. Les pages partielles après 500 documents inspectés et l'historique au-delà de 50 événements restent hors de cette recette.

A06 : développement maintenu à 50 % ; couverture de recette legacy renforcée, sans annoncer une nouvelle fonctionnalité. A02/A05/A07 : dépendances inchangées.

## Résultat du lot

PASS local : syntaxe, lint ciblé et diff-check ; recette Auth/Firestore Emulator terminée avec code 0. Les 33 contrôles HTTP C2, les décisions/rejeux et tous les scénarios Prospects, y compris les nouveaux filtres/pagination, réussissent. Aucun test échoué dans cette exécution. Le navigateur n'a pas été relancé localement. La CI de la nouvelle tête doit encore être exécutée ; la réussite complète de la base n'est pas transférée au nouveau commit.
