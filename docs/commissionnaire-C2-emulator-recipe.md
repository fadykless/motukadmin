# Motuka — C2.5 : protocole de recette (environnement isolé)

Statut : **à exécuter**. Cette note ne prouve aucun test Firebase Emulator réussi.

## Préconditions bloquantes
- Utiliser exclusivement un projet Firebase de test et des comptes fictifs, jamais la production.
- Vérifier les règles Firestore réellement déployées sur l'environnement cible avant toute recette.
- Obtenir d'Operations les critères d'acceptation, de rejet, les administrateurs habilités et les règles de suspension/réexamen.
- Ne pas modifier la Marketplace C1 ni les comptes partenaires de production.
- Documenter la configuration des émulateurs, les versions et les jeux de données.

## Jeux de données
Créer des utilisateurs fictifs : admin habilité, admin non habilité (si habilitation spécifique), manager, utilisateur standard, compte bloqué et compte Firebase Auth désactivé.
Créer des candidatures fictives pending, approved, rejected et une candidature historique approved avec isPartner=false. Chaque candidature doit être associée à un uid unique.

## Matrice de vérification
| ID | Scénario | Attendu |
| --- | --- | --- |
| SEC-01 | Manager GET liste/détail | 200 ; aucun bouton de décision ; téléphone masqué |
| SEC-02 | Manager POST décision | 403 ; aucune écriture |
| SEC-03 | Utilisateur standard GET/POST admin | 403 ; aucune donnée |
| SEC-04 | Token absent, révoqué ou compte désactivé | 401/403 ; aucune écriture |
| DEC-01 | Admin approuve pending, version 0 | approved, isPartner=true, version 1, événement audit |
| DEC-02 | Admin refuse pending avec motif | rejected, isPartner=false, version 1, motif et audit |
| DEC-03 | Refus sans motif | 400 ; aucun changement |
| DEC-04 | Deux décisions simultanées avec même version | Une seule réussit ; l'autre 409 ; un seul événement |
| DEC-05 | Décision sur approved/rejected | 409 ; aucun changement |
| DEC-06 | Compte Firestore bloqué ou Firebase Auth désactivé | 409 ; aucun changement |
| DEC-07 | Version obsolète | 409 ; aucun changement |
| DEC-08 | Candidature uid incohérent | 409 ; aucun changement |
| PAR-01 | Attribution directe avec justification | isPartner=true ; audit direct_grant |
| PAR-02 | Attribution directe sans justification | 400 ; aucun changement |
| PAR-03 | Attribution directe pendant pending | 409 ; parcours décision obligatoire |
| PAR-04 | Retrait avec justification | isPartner=false ; audit revoke ; statut de candidature inchangé |
| PAR-05 | Blocage d'un partenaire actif | isPartner=false ; audit account_block_revoke ; candidature inchangée |
| PAR-06 | Réactivation du compte bloqué | Ne restaure pas automatiquement isPartner |
| LIST-01 | Filtre pending/approved/rejected et pagination | Résultats cohérents, pas de doublons |
| LIST-02 | Curseur invalide ou incompatible | 400 |
| REG-01 | Candidature C1 existante, sans decisionVersion | Version implicite 0 ; décision possible |
| REG-02 | Profil manager consultation | Données sensibles limitées selon politique approuvée |

## Contrôles techniques additionnels
1. Examiner les index Firestore nécessaires à la requête status + documentId.
2. Vérifier le format des timestamps issus de C1 (Timestamp, ISO, millisecondes).
3. Vérifier le schéma des candidatures C1, en particulier uid, userId, status et decisionVersion.
4. Vérifier que les logs d'audit ne peuvent pas être modifiés depuis un client Firebase.
5. Vérifier les règles d'habilitation admin : role=admin ne suffit pas si Operations impose une liste d'administrateurs habilités.
6. Vérifier la pagination précédente et le comportement lorsque les données changent entre deux pages.
7. Répéter lint, build et tests automatisés après chaque correctif.

## Critères de sortie
- CI verte sur le commit final.
- Matrice SEC/DEC/PAR/LIST/REG exécutée avec preuves et résultats.
- Aucune faille de permission ou transaction ouverte.
- Critères d'Operations approuvés et incorporés.
- PR documentée ; revue Product Manager ; **aucune fusion sans GO explicite**.
