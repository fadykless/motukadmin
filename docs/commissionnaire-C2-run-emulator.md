# Exécuter le test Firestore C2 en environnement isolé

Ce test est **optionnel et non exécuté automatiquement en CI** tant que l'émulateur Firestore n'est pas installé/configuré.

## Préconditions
- Node.js et dépendances du dépôt installées (`npm ci`).
- Java et Firebase CLI disponibles localement.
- Ne jamais fournir d'identifiants de service de production.
- Utiliser exclusivement le projet fictif `demo-motuka-c2`.

## Exécution
Démarrer Firestore Emulator dans un terminal dédié, avec un port local 8080 et le projet `demo-motuka-c2` (par exemple via `firebase emulators:start --only firestore --project demo-motuka-c2` depuis un répertoire contenant une configuration Firebase d'émulateur appropriée).

Dans un autre terminal :

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
GCLOUD_PROJECT=demo-motuka-c2 \
node --test tests/partnerDecisionEmulator.test.mjs
```

## Limites
- Le scénario valide une transaction représentative, pas la route HTTP complète, les permissions Firebase Auth, ni les règles Firestore déployées.
- Les résultats doivent être consignés avec date, commit, version des outils, sortie du test et éventuelles anomalies.
- Ne pas considérer la recette C2 validée avant la matrice complète et l'accord d'Operations/Product Manager.
