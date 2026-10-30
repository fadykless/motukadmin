# Motuka Admin — Lot C2 : cadrage et garde-fous

Date : 30 octobre 2026
Statut : développement autorisé sur branche, fusion et déploiement interdits.
Branche : feature/commissionnaire-c2-admin

## Architecture existante vérifiée
- Motuka Marketplace : `partnerApplications/{uid}` avec `pending`, `approved`, `rejected`; API de candidature côté serveur; règles source interdisant les accès clients directs.
- Motuka Admin : `/partenaires` et `/partenaires/ajouter`; `/api/admin/partners` GET, POST, PATCH; `requireStaff` vérifie token révoqué, compte Auth et rôle Firestore.
- `POST /api/admin/partners` et `PATCH /api/admin/partners` modifient `users/{uid}.isPartner` dans une transaction. Le blocage dans `PATCH /api/admin/users` retire le droit partenaire.
- Attribution directe actuellement sans justification ni journal; C2 doit corriger ce défaut.
- Le parcours C1 doit rester compatible, sans changement Marketplace non autorisé.

## Contrats C2 proposés
- GET `/api/admin/partner-applications?status=pending&limit=20&cursor=...` : liste paginée; manager/admin; minimisation des données.
- GET `/api/admin/partner-applications/[uid]` : détail et historique; manager/admin.
- POST `/api/admin/partner-applications/[uid]/decision` : admin uniquement; action approve/reject; `expectedVersion`; raison de refus obligatoire.
- Réutiliser/adapter `/api/admin/partners` pour attribution directe exceptionnelle et retrait, avec justification obligatoire, audit et contrôle des rôles.

## Invariants transactionnels
1. Approval : lire candidature et utilisateur, vérifier `pending`, version, compte actif, `isPartner !== true`; écrire `approved`, `isPartner=true`, événement d'audit dans une seule transaction.
2. Rejection : lire candidature et version, vérifier `pending`; écrire `rejected`, motif, événement dans une seule transaction; ne pas activer de droit.
3. Direct grant : administrateur habilité, justification obligatoire, compte existant et actif; journalisation dans la même transaction que `isPartner=true`.
4. Revocation : `isPartner=false` et événement dans une transaction; ne jamais réécrire l'ancienne décision `approved`.
5. Concurrence : version de décision attendue; refus HTTP 409 si état ou version a changé.
6. Aucun traitement de candidature de production pendant le développement C2.

## Modèle d'audit proposé
`partnerApplications/{uid}/history/{eventId}` pour les décisions liées à une candidature.
Pour les attributions directes sans dossier : `partnerAuditEvents/{eventId}` (ou journal central unique après arbitrage), sans créer artificiellement une candidature.
Champs : `uid`, `action`, `actorUid`, `actorRole`, `reason`, `createdAt`, `previousState`, `nextState`, `requestId`.
Les journaux ne doivent être ni éditables ni supprimables depuis le client.

## Vérifications ouvertes / blocages
- Règles Firestore réellement déployées : non vérifiées par simple lecture GitHub. Comparaison avec la console Firebase nécessaire avant recette.
- Inventaire exhaustif `isPartner` : recherche transversale à finaliser.
- CI de motukadmin : exécuter npm ci, lint, build et tests émulateur sur branche; ne pas supposer le vert.
- Operations : critères, motifs, réexamen, suspension et habilitations détaillées attendus.
- Captures UI et recette responsive : à produire après implémentation.

## Plan de tests
- GET refusé sans jeton et pour rôle user; lecture admin/manager autorisée.
- POST décision refusé pour manager, compte bloqué, dossier absent, version périmée.
- Approval atomique; rejection sans activation; double décision concurrente.
- Attribution directe sans justification refusée; avec justification auditée.
- Retrait conservant l'historique; blocage retirant les droits.
- Régression C1 et tests Firebase Emulator.

## Interdictions
Pas de merge vers main, pas de déploiement, pas de migration destructive, pas d'activation de droits en production, pas de modification de Motuka Marketplace sans accord séparé.
