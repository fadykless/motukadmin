# Motuka Admin — Rapport de prise de fonction

Date : 11 novembre 2026 — Developer 2 → Lead Tech & Software Architect.
Objectif : clôture technique C2.1 et préparation du MVP C3.3 au 30 novembre.

## Décision proposée

Conserver C2 et réutiliser la PR #2. La PR #6 nécessite une nouvelle recette sur son correctif final. Aucune fusion, livraison ou modification de données réelles effectuée par cette mission. C3.4 reste au cadrage ; aucun moteur financier développé.

## Périmètre et références vérifiées

- `main` : `e34e8fe84588cc561c2d1ca6586ac369031e1e14`.
- PR #6 : `fix/c2-1-admin-consent-display`, tête auditée `979ac0b5a0b97a2590dfc04e5c2fd44053406246`, ouverte en brouillon.
- PR #2 : `feature/admin-contact-requests`, tête auditée `7134b93230159ecc4d35113840588a5c48ebf669`, ouverte en brouillon.
- Code Marketplace `main` : API `src/app/api/partner-applications/route.js`, validation `src/lib/partnerApplicationPolicy.mjs`, règles `firestore.rules`.
- Aucun accès aux candidatures Firestore réelles : vérification du schéma producteur et des données fictives uniquement. La conformité de tous les dossiers historiques réels reste à contrôler par une personne habilitée.

## État des modules

| Module | Développé | Intégré dans main | Testé | Prêt au lancement |
| --- | --- | --- | --- | --- |
| C2 candidatures et décisions | Oui | Oui | CI antérieure et contrôles locaux de politique ; recette consolidée restante | Non établi |
| C2.1 consentement | Oui, correctifs préparés | Non | Ancienne CI quality réussie ; navigateur échoué ; nouvelle recette requise | Non |
| C3.3 prospects | Partiel, PR #2 | Non | 10 tests unitaires locaux réussis ; intégration Firebase non validée | Non |
| C3.4 commissions | Cadrage uniquement | Non | Sans objet | Non |

Les pourcentages du suivi concernent le diagnostic et la préparation du rapport, pas la préparation globale au lancement.

## Audit C2 / C2.1

### Sécurité et cohérence existantes

`requireStaff` vérifie le jeton Firebase avec contrôle de révocation, le compte Auth courant, son état désactivé et le rôle Firestore courant. Lecture du détail autorisée à admin/manager ; téléphone et motif de refus exclus pour manager. Décision autorisée côté serveur à admin seulement. L'approbation vérifie compte, profil, dossier pending et version attendue ; décision, droit partenaire et audit sont écrits dans une même transaction. La candidature et le droit sont présentés séparément à partir du profil `users/{uid}`. Les droits boutique ne sont pas utilisés comme droits commissionnaires.

La règle Marketplace consultée refuse les lectures/écritures clientes de `partnerApplications` ; elle ne prouve pas à elle seule l'état des règles effectivement déployées. Les tests HTTP en émulateurs vérifient les contrôles serveur ; leur configuration permissive ne constitue pas une recette des règles Firestore clientes.

### Contrat du consentement

L'API Marketplace écrit côté serveur : `userId`, `termsVersion`, `termsAcceptedAt` (serverTimestamp), `termsDocumentSha256` (SHA-256 du texte contractuel), `termsAcceptanceMethod: authenticated_checkbox`. L'Admin lit les quatre champs attendus avec des valeurs nulles si absents. `decisionVersion` absent reste compatible avec les dossiers historiques via la valeur initiale 0.

Il s'agit d'afficher les métadonnées enregistrées : leur présence ne vérifie pas cryptographiquement le document ni sa validité juridique. Aucun consentement historique n'est fabriqué. Un blocage d'approbation en cas de preuve manquante nécessiterait une règle métier/juridique validée ; ce correctif d'affichage n'en introduit pas.

### Cause de la CI rouge et correctifs

Run [41898542172](https://github.com/fadykless/motukadmin/actions/runs/41898542172) sur la tête auditée : quality SUCCESS ; C2 browser FAILURE. Les logs du job 126814461711 montrent une violation du mode strict Playwright : le texte `04/11/2026` correspond simultanément à la date de soumission et à celle d'acceptation. Ce défaut de test bloque la recette ; ce n'est pas la preuve d'une panne d'autorisation.

Correctifs préparés sur la base de la PR #6 :

- Sélecteur de date ciblé sur le libellé « Accepté le ».
- Affichage individuel des éléments de consentement disponibles et avertissement en cas de version/date/empreinte manquante. Une empreinte seule n'est plus masquée.
- Fuseau Africa/Kinshasa explicite pour la date d'acceptation.
- Graine fictive alignée sur `userId` du producteur Marketplace.
- Ajout d'un dossier ancien sans preuve et d'un dossier partiel avec empreinte seule, sans profil partenaire inventé.
- Tests HTTP admin/manager de ces cas et tests UI desktop/mobile : données historiques conservées, absence de date inventée et maintien de l'empreinte partielle.

Fichiers modifiés : `scripts/seed-c2-emulator.mjs`, `scripts/test-admin-access.mjs`, `scripts/test-c2-ui.mjs`, `src/app/partenaires/candidatures/page.jsx`, ce rapport.

## Audit PR #2 — réutilisation et écarts C3.3

| Élément | Constat | Action proposée |
| --- | --- | --- |
| Liste, filtres, pagination, détail | Déjà développés sur `contactRequests` | Conserver et tester en intégration |
| Authentification et traitement | `requireStaff` appliqué aux routes ; champs PATCH limités | Valider la matrice Operations/admin/manager avec Lead Tech |
| Attribution | `assignedTo` désigne un responsable Motuka ; `commissionnaireId` est distinct et non modifiable par PATCH | Clarifier apporteur, responsable et réattribution partenaire dans le contrat |
| Journal d'affectation | Après désaffectation explicite (`assignedTo: null`), l'audit utilise `update.assignedTo ?? previous.assignedTo` et peut conserver l'ancien responsable | Corriger la présence de champ et tester l'état réellement persisté |
| Concurrence | Transaction présente, mais aucune version attendue envoyée par l'UI | Ajouter un contrôle de version pour prévenir l'écrasement d'une décision récente |
| Conservation | Liste/détail dépendent du droit partenaire et de l'annonce actuels | Préserver la consultation habilitée des dossiers après retrait du droit ou disparition de l'annonce ; différencier lecture historique et nouvelle action |
| Création/recherche/doublons | Pas de POST Admin, de recherche textuelle ni de détection de doublons ; `duplicate` est seulement un motif de clôture | Définir source de création, recherche MVP et clé de rapprochement avec Developer 1 |
| Vente déclarée / vérifiée | Absentes ; `closed/completed` est une clôture générique | Ajouter deux événements et deux états distincts ; ne pas convertir les anciennes clôtures en ventes |
| Prix et justificatifs | Absents | Enregistrer prix final déclaré avec devise, auteur, date et preuves à accès limité |
| CI | Workflow Lot 2 exécuté au push de sa branche, sans déclencheur pull_request | Assurer l'exécution des 10 tests Lot 2 sur chaque mise à jour de PR |
| Limites de consultation | 500 documents inspectés maximum par requête ; 50 événements récents exposés | Vérifier pagination, coût et parcours d'accès à l'historique plus ancien |
| Index / cache | Index composites non livrés ; réponses prospects sans no-store explicite | Préparer index versionnés et politique de non-cache des réponses administratives |

Aucune logique de paiement automobile ni répartition automatique n'est présente dans les routes prospects examinées. L'adaptation consiste surtout à ajouter le suivi manuel d'une vente en espèces et sa vérification. Les anciens statuts ne doivent pas devenir des preuves de vente ou de paiement.

## MVP C3.3 proposé au Lead Tech

1. Liste/recherche des prospects avec annonce, acheteur, commissionnaire apporteur et responsable Operations.
2. Attribution administrative, statuts commerciaux et détection des doublons selon une règle validée.
3. Historique transactionnel des changements avec protection contre les mises à jour concurrentes.
4. Déclaration d'une vente : prix final et devise, date déclarée, déclarant, justificatifs privés. La déclaration ne vérifie pas la vente.
5. Vérification Operations : décision explicite, motif, auteur et date ; correction/contestation conservant l'historique. La procédure et le droit de vérification doivent être validés.
6. États de chargement/erreur/vide, permissions et scénarios de recette consolidée.

Hors MVP : calcul financier, collecte, versement, checkout, portefeuille et reporting avancé. Le prix du véhicule est payé en espèces hors plateforme.

## Dépendances à valider avec Developer 1 et Lead Tech

- Confirmer le producteur `contactRequests`, le chemin API et la collection partagée : l'API `src/app/api/contact-requests/route.js` n'a pas été trouvée dans main Marketplace. Cela ne démontre pas l'absence d'un autre parcours de création.
- Figer le sens de `productId`, `buyerId`, `commissionnaireId`, `contactChannel`, les timestamps serveur et la version du schéma ; interdire les identités/droits sensibles fournis librement par le navigateur.
- Distinguer apporteur d'origine, partenaire éventuellement réattribué et responsable interne ; décider les snapshots historiques et les règles d'éligibilité après changement du profil/de l'annonce.
- Valider création authentifiée, idempotence et doublons ; aucun parcours anonyme n'est supposé acquis.
- Définir accès aux coordonnées et justificatifs, droits Operations et conservation avec Legal.
- Partager les statuts de vente avec Marketplace sans permettre au déclarant d'écrire directement l'état vérifié.

## Plan de réalisation proposé

| Dates novembre 2026 | Livrable | Dépendance |
| --- | --- | --- |
| 11–13 | Correctifs C2.1, preuves HTTP/UI, revue Lead Tech | CI complète ; GO Product Manager distinct pour toute fusion |
| 12–16 | Contrat C3.3, rôles, doublons, procédure de vérification et conservation | Developer 1, Operations, Legal, Lead Tech |
| 16–20 | Compléter PR #2 : attribution, concurrence, historique, recherche MVP | Contrat de données validé |
| 20–24 | Déclaration et vérification manuelles des ventes ; preuves privées | Procédure et habilitations validées |
| 25–27 | Recette consolidée isolée C2/C2.1/C3.3 et corrections critiques | Environnement et données fictives représentatifs |
| 28–29 | Revue finale, bilan des tests reportés et décision de lancement | Lead Tech puis Product Manager |
| 30 | Pilote uniquement après validation explicite | Aucun déploiement automatique autorisé |

Ces dates sont une proposition de travail, pas des tâches planifiées ni une garantie de livraison.

## C3.4 — cadrage technique uniquement

Conserver des événements distincts : vente déclarée, vente vérifiée, commission calculée, commission validée, commission encaissée, paiement du commissionnaire confirmé. Prévoir références vente/bénéficiaire, devise, montants, preuves, dates et auteurs ; corrections par événements compensatoires et historique protégé. Les taux de référence sont 5 % au total, 2,5 % Motuka et 2,5 % commissionnaire ; aucune assiette ou modalité de collecte n'est inventée. Calcul et automatisation attendent les arbitrages Business/Operations/Legal.

## Vérification de cette mission

- PASS : syntaxe des trois scripts modifiés et `git diff --check`.
- PASS : 18 tests locaux C2 (politique de décision et gardes empêchant les tests de viser la production).
- PASS : 10 tests locaux de la PR #2 (dates, clôture, curseurs, éligibilité).
- PASS : lint complet local (0 erreur, 10 avertissements préexistants).
- Build local exécuté : échec de téléchargement des polices Google Geist/Geist Mono (connexion TLS). Le build final reste à valider en CI ; ce résultat local ne permet pas de conclure à une compilation réussie.
- Recette HTTP/UI des nouveaux cas : à confirmer en CI. La CI verte antérieure ne valide pas ces nouveaux changements.
- Données réelles, règles déployées, index de production, recette métier consolidée et Preview finale : non vérifiés pendant cette mission.

Prochaine action : exécuter la CI sur le correctif C2.1, examiner les preuves finales, puis faire valider le contrat C3.3 avant de compléter la PR #2. Aucun GO de lancement n'est donné par ce rapport.
