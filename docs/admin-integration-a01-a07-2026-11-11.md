# Developer 2 — lot de préparation Admin A01–A07

Date : 11 novembre 2026. Destinataire : Lead Tech & Software Architect.
Branche : `integration/admin-c2-1-c3-3-foundation`. Fusion dans main et production non autorisées.

## Traçabilité

| Source | SHA examiné | Utilisation |
| --- | --- | --- |
| main | e34e8fe84588cc561c2d1ca6586ac369031e1e14 | Socle C2 et audit conservés |
| PR #6 | 23cf08937d3e710d4efc2f2f54ca37356c6ce9fd | Affichage complet/partiel/absent ; sélecteur date conservé |
| PR #7 | 62f523299ab29b19a5b9434728199950f3d8646b | Gardes seed avant chargement SDK et premier contrat |
| PR #2 | 7134b93230159ecc4d35113840588a5c48ebf669 | Réutilisation intégrale du socle prospects, sans reconstruction |

La comparaison main…#2 donne 85 commits propres à main et 45 propres à #2. La préparation locale de l'union #7 + #2 ne présente aucun conflit. #7 descend de #6 et main : C2 et les correctifs d'audit restent dans l'ascendance. La PR d'intégration gardera ces deux parents pour une comparaison reproductible. Aucune des PR sources ni main n'est fusionnée ou déplacée par ce lot.

## Livré dans ce lot

- A03 : six scénarios exécutent une copie du seed hors du dépôt, sans SDK, et prouvent le refus avant résolution de dépendances pour les deux identifiants projet, les deux hôtes et les deux formes de credentials. Le déplacement d'import déjà présent dans #7 est conservé.
- A02 : prototype de garde de consentement dans `proposals/`, non importé par les routes ; quatre tests couvrent références exactes/inconnues, identité, absence/partialité, date et format. Aucun registre métier inventé et aucune politique d'approbation existante changée.
- A04 : branche d'intégration conservant main/C2/C2.1/#7 et les 17 fichiers de #2.
- A06 : version attendue obligatoire dans le PATCH et contrôle dans la transaction ; historique de désaffectation fidèle à la valeur null ; interface transmettant la version ; réponses de lecture prospects en no-store.
- Recette : nouveau script HTTP en émulateurs pour rôles, immutabilité, désaffectation, concurrence, versions obsolètes et dossiers hors périmètre legacy. Workflow Lot 2 exécuté aussi pour les PR vers main.
- Fiabilité du runner : les enfants de test passent en spawn asynchrone afin que les pipes stdout/stderr Next soient drainés pendant les requêtes. Le précédent spawnSync pouvait bloquer cette lecture sur une sortie serveur volumineuse. Les gardes d'environnement et l'arrêt du groupe de processus sont conservés.
- A05/A07 : contrat précis et proposition de preuve minimale dans `admin-a02-a05-a07-contract-proposal.md`, soumis à revue ; aucune nouvelle collection, attribution métier ou logique financière active.

## Périmètre restant et progression indicative du développement

| ID | Progression indicative | État / dépendance |
| --- | --- | --- |
| A01 | 100 % sur #6 | CI 43089337107 entièrement SUCCESS, quality et navigateur ; pas une recette consolidée ni un GO PM |
| A02 | 50 % | Garde proposé et tests prêts ; intégration transactionnelle suspendue aux références et au traitement legacy PM/Legal |
| A03 | 100 % | Import déplacé dans #7 ; preuve sans SDK ajoutée dans ce lot |
| A04 | 100 % préparation | Union de sources sans conflit ; intégration fonctionnelle C3.3 non validée |
| A05 | 25 % | Proposition de schéma ; accord Developer 1/Lead Tech et arbitrages attribution/doublons attendus |
| A06 | 50 % | Socle legacy et correctifs de concurrence/audit ; adaptateur nouveau flux, historique après désactivation, index et recette globale restants |
| A07 | 25 % | Proposition de contrôle ; aucune vérification de vente implémentée avant arbitrages |

Ces estimations ne se cumulent pas et ne constituent pas un pourcentage de préparation au lancement.

## Tests — état au moment du commit

- Réussis localement : 40 tests unitaires/gardes/prototype (18 C2 existants, 10 utilitaires prospects existants, 6 gardes sans SDK, 4 prototype consentement, 2 version/désaffectation).
- Réussis : syntaxe des scripts modifiés, diff-check et lint complet (0 erreur, 10 avertissements existants).
- #6 seulement : quality et navigateur réussis dans la CI 43089337107 sur 23cf089 ; cette preuve n'est pas transférable à la branche d'intégration.
- Réussis localement en Auth/Firestore Emulator : 33/33 contrôles HTTP C2 ; approbation/refus et rejets de décisions obsolètes ; intégration prospects legacy (401/403, immutabilité, désaffectation auditée, concurrence 200/409, ancien client sans version refusé, dossier hors périmètre refusé). Le runner est sorti avec code 0. Aucun test navigateur lancé dans cette exécution.
- Non démarrés sur la nouvelle tête : build CI et navigateur CI ; workflow prévu dans la PR.
- Non exécutés / reportés : raccordement Dev1, preuve d'apport étranger au propriétaire, isolation entre partenaires du nouveau flux, visibilité historique après désactivation, vérification des règles et index réellement déployés, recette métier consolidée 22–26 novembre. Le futur flux partenaire n'a pas d'API dans ce lot.
- Aucune donnée réelle ni configuration de production consultée ou modifiée.

## Risques et suite

1. Le comportement legacy de #2 demeure limité aux annonces commissionnaires et au droit partenaire actuel. Il ne répond pas au nouvel apport ; ne pas le présenter comme prêt au pilote.
2. Le prototype A02 n'est pas actif : le lancement de l'approbation avec contrôle de preuve reste conditionné à PM/Legal et à sa future intégration serveur.
3. La matrice admin/manager est préservée, pas remplacée par un nouveau rôle Operations. La visibilité des coordonnées et justificatifs n'est pas élargie.
4. La version attendue est un ajout au contrat PATCH de la PR #2 encore non livrée ; tout autre client de traitement devra la transmettre. Les documents historiques sans version restent v0, les versions malformées sont refusées.
5. Index et pagination du nouveau schéma nécessitent un contrat figé. La limite historique de 500 documents inspectés et de 50 événements affichés reste à recetter.

Prochaine action : revue du contrat A02/A05/A07, confirmation des champs persistés avec Developer 1, puis adaptateur legacy/nouveau flux et scénario interplateformes. L'approbation, la visibilité historique et la vérification de vente attendent les arbitrages explicitement listés ; aucun régime rétroactif ou financier n'est inventé.
