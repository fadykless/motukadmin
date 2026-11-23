# Lot 18 — Recette visuelle WhatsApp sur GitHub Actions

Source initiale : Admin PR14, `54bc0cda96551b0eb0c8118399d1e8227d44e20d`.
La recette C2 navigateur legacy avait réussi, mais ne visitait pas la page
WhatsApp. Le nouveau job est distinct et utilise l'application Admin complète,
son vrai formulaire de connexion, son layout et AdminGuard. Aucune fixture de
page simplifiée, injection de session ou substitution de règles d'authentification.

## Exécution et isolation

Workflow `.github/workflows/whatsapp-ui-validation.yml`, uniquement sur PR vers
main, avec chemins applicatifs/tests pertinents. Il checkout exactement le HEAD
de la PR avec `persist-credentials:false`, permissions `contents:read`, Node 22 et
Java 21. Playwright 1.56.1 est installé depuis le registre officiel dans RUNNER_TEMP,
hors du package et du lock applicatifs ; aucune nouvelle dépendance root.

Le runner exige CI/GITHUB_ACTIONS, confirmation explicite, C2 demo exact, hôtes
Auth/Firestore loopback, absence de credentials de service et tokens Meta. Il
contrôle le SHA Git checkout, l'absence de .env root et la version Playwright
avant SDK/artefacts/serveur. Next dev/webpack réel tourne sur 127.0.0.1:3230 ; Auth
sur 9099 et Firestore sur 8080, projet fictif demo-motuka-c2 exclusivement.

Les profils, comptes et reçus human_intent sont fictifs et uniques au run. Ce lot
seede des reçus conformes pour tester l'UI, sans répéter la production E2E du reçu
Marketplace déjà vérifiée au lot 15. Les dossiers restent dryRun/fixtureOnly, aucune
coordonnée réelle ni consentement réel. Les tests ne créent aucun prospect réel,
réservation, paiement, message ou connexion Meta.

Les requêtes du navigateur sont autorisées uniquement vers les trois services
loopback de test. Les fonts Google référencées par la page sont bloquées côté
navigateur et comptées séparément ; un rendu typographique fallback est donc
possible. Tout autre egress demandé est bloqué et fait échouer la recette. Le
lien public Voir l'annonce est inspecté par son href canonique, jamais ouvert.
Les requêtes publiques de compilation des fontes côté Next peuvent subsister avec
la vérification TLS normale et les certificats système ; aucun accès aux données
Firebase réelles n'est permis.

## Scénarios et preuves attendues

Desktop 1280 px et mobile 375 px, chacun avec une nouvelle session de navigateur et
connexion par le formulaire :

1. Navigation via le menu WhatsApp, présence de la vraie page et état vide visible.
2. Clé non conforme : bouton Importer désactivé.
3. Import d'un reçu fictif par sa clé depuis l'UI ; critères et annonce attendus visibles.
4. Prise en charge puis clôture par le staff connecté, états/audit actualisés.
5. Clé conforme inexistante : HTTP 404 et erreur conservée après rafraîchissement,
   sans effacer le dossier déjà visible.
6. Dossier pris en charge par un autre agent : action de clôture masquée et refus
   serveur d'une tentative hors propriétaire.
7. Pas de débordement horizontal du document, des cartes ou des contrôles attendus
   hors viewport. Les assertions exigent contenu/états/actions visibles ; une page
   vide ou entièrement masquée ne peut pas compter comme succès.

Un compte non-staff se connecte réellement puis est refusé par AdminGuard ; la
page WhatsApp n'est pas exposée et l'API retourne 403. Aucun bypass de login ou
modification de localStorage n'est utilisé.

Les captures sont prises après connexion, sur les vrais états de page. Le dossier
`artifacts/whatsapp-ui` contient seulement PNG et `summary.json` avec SHA source,
statuts des cas, étapes, compteurs d'egress et état du nettoyage. Aucun ID token,
cookie, mot de passe, trace Playwright, HAR ou log Auth brut n'est uploadé. Les
comptes affichés et les données sont exclusivement fictifs. Artefact GitHub :
`whatsapp-ui-browser-evidence`, rétention 7 jours, upload même en cas d'échec.

## Commandes et statut de validation

Contrôles locaux autorisés, sans lancer Chromium dans le runtime local bloqué :

```sh
node --check scripts/run-whatsapp-ui.mjs
npm run test:whatsapp-ui:safety
npm run lint:whatsapp-ui
```

Le workflow effectue npm ci applicatif, installe le runtime Playwright isolé puis
lance `npm run test:whatsapp-ui` via Firebase emulators:exec. Le runner est limité
à six minutes, l'étape à huit et le job à quinze. Le nettoyage cible uniquement
les références/comptes fictifs créés et son groupe de processus Next, y compris
sur interruption. Aucun effacement de collection et aucun arrêt de serveur tiers.

Le protocole n'est pas un résultat de recette. Les résultats exécutés, SHA et run
effectifs sont consignés dans la PR et l'artefact de CI ; un job absent/en cours
ne constitue pas un PASS. Les captures d'échec restent des captures de la page
réelle, jamais des simulations d'un rendu attendu.

## Limites conservées

L'émulateur C2 est permissif pour les fixtures et ne remplace pas les preuves de
règles clientes du lot 14. Les règles réellement déployées restent non vérifiées.
La recette prouve l'UI de traitement manuel par staff, pas un transfert automatique
ou un contact. Le nouveau numéro est non acquis et aucun nouvel essai Meta n'est
autorisé. Aucune fusion, production, règle réelle ou configuration Vercel modifiée.
