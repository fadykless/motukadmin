# Lot 14 — Règles Firestore clientes des collections internes WhatsApp

Date : 21 novembre 2026. Développement et recette strictement isolés ; aucune règle
réelle déployée, aucune donnée réelle consultée ou modifiée.

## Audit des sources et autorité du ruleset

| Source épinglée | Règles et configuration constatées |
|---|---|
| Marketplace PR34, `9dcd249187ca0209e5da6e3576a0a2be7f12c3ac` | Fichier complet `firestore.rules`, référencé par `firebase.json` via `firestore.rules` ; catch-all récursif deny, aucun allow WhatsApp |
| Admin PR11, `682637a91b4c1d6e27cdd490d138d0e8d171be47` | Aucun `firestore.rules` ni `firebase.json` de déploiement dans l'arbre ; `firebase.c2.test.json` configure les émulateurs mais n'indique pas de règles |

Les configurations clientes versionnées des deux applications désignent le même
projet de production `motukapp`. Firestore applique un seul ruleset par base, pas
un ruleset par application. **Le présent test charge l'unique fichier Marketplace
canonique et teste aussi la collection de la file Admin sous ce fichier.** Il
n'existe pas de second fichier Admin à tester séparément au SHA audité.

Le catch-all est `match /{document=**} { allow read, write: if false; }`. Les seuls
allow du fichier complet portent sur products, favorites et users. Aucun wildcard
permissif ne vient annuler le refus des cinq collections internes WhatsApp.
Aucune règle métier ou permission existante n'a été modifiée par ce lot.
Les configurations Marketplace C3/rental UI référencent également ce même fichier ;
les configurations WhatsApp précédentes ne précisent pas de fichier de règles.

La configuration C2 Admin antérieure sans `rules` démarre un émulateur permissif
par défaut ; ses tests Admin SDK ne constituaient donc pas une preuve cliente.
La nouvelle configuration **de test** `firebase.whatsapp-rules.test.json` pointe
explicitement vers la copie complète des règles Marketplace. Elle n'est pas un
nouveau fichier de déploiement de règles Admin et ne doit servir qu'aux émulateurs.

## Intégrité et isolation du test

Fixture : `tests/fixtures/whatsapp-rules/marketplace.firestore.rules`, copie
complète, non simplifiée et non modifiée. Le `marketplace.firebase.json` voisin
conserve la référence canonique du fichier original. `manifest.json` contient les
SHA des deux dépôts et les SHA256 des deux fichiers copiés.

Le runner vérifie flags/projet/hôte/mode et absence de credentials avant tout
import Firebase. Il contrôle ensuite les hashes et la référence de configuration.
L'apparition future d'un fichier de déploiement Admin exige un nouvel audit plutôt
que de continuer silencieusement à revendiquer l'absence de règles Admin.

Projet exact : `demo-motuka-whatsapp-rules`, Firestore : `127.0.0.1:8190`, mode
test/développement. Aucun endpoint Firebase réel n'est utilisé. Le SDK client
Firestore est testé avec `@firebase/rules-unit-testing` 5.0.2 ; les tokens de
contexte sont simulés par `authenticatedContext`, pas par une authentification
réelle ni un appel Admin SDK. Les rôles existants admin/manager sont représentés
dans les claims et dans des profils users fictifs seedés, sans ajout de rôle métier.

Les fixtures ont un UUID propre au run. Seul le seed et le contrôle avant/après
utilisent `withSecurityRulesDisabled`. Les opérations de la matrice utilisent le
SDK **client sous règles actives**. Nettoyage par références exactes seedées ou
réservées pour les créations ; aucune suppression globale de collection ou base.

## Résultats exécutés

**7/7 tests Emulator regroupés réussis**, soit :

- **300 refus internes** : 6 contextes × 5 collections × 5 opérations × 2 niveaux.
- **6 contrôles positifs** : lectures publiques produit/liste produits, lecture et
  modification du profil propre, modification autorisée du prix par propriétaire,
  lecture du favori propre. Ils prouvent que le test ne passe pas avec un simple
  deny-all ou une connexion inutilisable.
- **9 refus de contrôle** : modification statut/propriétaire d'annonce, modification
  par autre compte et suppression, profil/favori d'autrui, auto-attribution de rôle
  ou isPartner, lecture cliente des candidatures même en contexte admin.

| Dimension | Valeurs effectivement exercées |
|---|---|
| Contextes | Non connecté, user ordinaire, propriétaire apparent, admin, manager, autre compte |
| Collections | waDryRunMessages, waDryRunSessions, waDryRunSimulatedOutputs, waDryRunDeliveryReceipts, waDryRunAdvisorRequests |
| Opérations | get, list filtrée par propriétaire apparent, create, update, delete |
| Niveaux | Document de collection racine ; document de sous-collection history |

L'UID de l'apparent propriétaire est identique à l'ID des documents testés et
est référencé dans user/uid/ownerId/assignedTo des données
fictives : cela ne crée aucun droit. Les documents internes sont restés inchangés
et toutes les créations interdites sont restées absentes après les tentatives.
Il s'agit de **300 opérations**, pas de 300 tests TAP distincts.

**4/4 tests de garde** réussis : environnement exact, refus avant SDK en production,
altération du hash de fixture refusée et détection d'une nouvelle configuration Admin.
Lint ciblé réussi. Le SDK de test est installé et verrouillé dans le dossier privé
`tests/whatsapp-rules` : `@firebase/rules-unit-testing` 5.0.2 et `firebase` 12.12.1.
Les deux tests sont dans `tests/whatsapp-rules/tests` ; leurs imports vers les gardes
et fixtures racine sont explicites. Ce dossier n'est pas déclaré comme workspace
npm dans la racine et ses node_modules sont ignorés par son propre .gitignore.

Aucune dépendance de l'application n'a changé. Le `package-lock.json` racine est
identique, octet pour octet, à la base Admin PR11 : SHA256
`d3189ad43bf5433e2d6e977bb054eb823de5fc3831ae5b51ceffd90a08024743`.
Le lock autonome mesure 43 434 octets. Installation vérifiée par `npm ci` dans ce
dossier de test ; les résultats ci-dessus sont ceux rejoués après ce déplacement
avec ses propres dépendances (Node 24.22.3, Java 21).

## Reproduction

Prérequis : Node 22+, Java 21, Firebase CLI 14, dépendances racine déjà installées
pour ESLint. Les dépendances SDK de ces tests sont installées séparément :
Terminal sans credentials de service ou tokens Meta réels :

```sh
npm run test:whatsapp-rules:install
npm run test:whatsapp-rules:safety
npm run lint:whatsapp-rules
WHATSAPP_RULES_TEST_CONFIRMED=yes GCLOUD_PROJECT=demo-motuka-whatsapp-rules \
GOOGLE_CLOUD_PROJECT=demo-motuka-whatsapp-rules NODE_ENV=test \
firebase emulators:exec --only firestore --project demo-motuka-whatsapp-rules \
  --config firebase.whatsapp-rules.test.json 'npm run test:whatsapp-rules'
```

Traces de la nouvelle exécution autonome : `work/admin-lot14-workspace-ci.log`,
`work/admin-lot14-workspace-rules.log`, `work/admin-lot14-workspace-safety.log`,
`work/admin-lot14-workspace-lint.log`. Résultats HTTP/build/visuels des autres lots non rejoués
et non revendiqués par ce test. Aucun déploiement Firebase, build global, recette
UI, message Meta ou fusion exécuté dans ce lot.

## Décision restante avant GO

**Les règles réellement déployées ne sont pas vérifiées.** La preuve porte sur les
fichiers du dépôt épinglé chargés dans un émulateur. Elle ne prouve pas que la base
partagée de production utilise ce ruleset, ni qu'un déploiement manuel ou externe
n'a pas appliqué d'autres règles.

Avant activation : identifier le propriétaire opérationnel des règles de la base
commune, comparer en lecture seule les règles effectivement déployées à la source
canonique validée, examiner tout écart et préparer une autorisation distincte pour
un éventuel déploiement. Ne pas créer un ruleset Admin concurrent ni laisser
l'ordre des déploiements remplacer les règles canoniques. Le contrôle des règles
déployées reste une condition GO/NO-GO, sans autoriser une mutation dans ce lot.
