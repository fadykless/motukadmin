# C2 — Déploiement sûr de l'index d'historique partenaire

## Contexte

La PR #5 modifie la consultation de `partnerAuditEvents` : filtre `uid == ...`, tri `createdAt DESC`, limite de 50. Cette requête requiert un index composite Firestore (`uid ASC`, `createdAt DESC`) dans la collection `partnerAuditEvents`.

## Avant la fusion

1. Identifier le projet Firebase réellement utilisé par l'administration, sans exposer de secrets.
2. Confirmer comment les index Firestore sont actuellement gérés. Le dépôt ne contient pas de `firebase.json` à sa racine dans `main` au moment de la préparation de la PR.
3. Comparer les index déjà présents dans le projet avec `firestore.indexes.json` : ne pas écraser les définitions existantes.
4. Faire approuver le déploiement de l'index par le responsable habilité. **Ne pas modifier les droits partenaires.**
5. Créer l'index composite dans le projet cible par la procédure approuvée et attendre son état **READY**.
6. Tester la requête sur des données de test, notamment un historique comportant plus de 100 événements, et vérifier les permissions manager/admin.
7. Rejouer la CI et obtenir le GO du Product Manager avant de fusionner la PR #5.

## Risques et retour arrière

Si la PR #5 est fusionnée avant que l'index soit prêt, Firestore peut renvoyer `FAILED_PRECONDITION` et l'API de détail peut répondre 500. En cas de problème après fusion, restaurer la requête précédente dans un nouveau correctif validé; ne pas supprimer l'index ou modifier des données sans approbation.

## Limites

Les tests Emulator réussis ne garantissent pas que l'index composite existe dans le projet Firebase cible. La réponse ne retourne que les 50 événements les plus récents après fusion des deux sources, pas un historique exhaustif paginé.
