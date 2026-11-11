# Admin — Contrats d'intégration C2.1 / C3.3 (11 novembre 2026)

Statut : propositions techniques pour revue Lead Tech / Product Manager. Aucune fusion, production ou écriture sur données réelles autorisée par ce document.

## Références vérifiées
- Admin #6 : 23cf08937d3e710d4efc2f2f54ca37356c6ce9fd. Le sélecteur navigateur de consentement cible déjà la ligne « Accepté le » et les cas historique/partiel sont ajoutés.
- Admin #2 : 7134b93230159ecc4d35113840588a5c48ebf669 ; +45/-85 par rapport à main.
- Marketplace : src/content/commissionnaireTermsV1.mjs sur main, version 1.0, blob Git 76f932b8e7c83cb1db52abb179c52cea8d4f4b14. Le blob Git n'est pas l'empreinte SHA-256 du texte.
- Les candidatures Marketplace conservent userId, termsVersion, termsAcceptedAt (timestamp serveur), termsDocumentSha256 (SHA-256 du texte UTF-8), termsAcceptanceMethod=authenticated_checkbox.

## C2.1 — Consentement avant approbation (proposition séparée)
L'affichage de la preuve ne constitue pas un contrôle d'approbation. evaluatePartnerDecision et la route décision actuelles n'exigent pas de preuve.

Contrat proposé :
1. Dans la transaction de décision, une action approve doit revalider le dossier et le compte, puis la preuve avant toute écriture isPartner.
2. Exiger un rattachement userId égal à l'UID du dossier, une version non vide, une date Firestore exploitable, une empreinte SHA-256 de 64 caractères hexadécimaux et une méthode autorisée.
3. Vérifier version + empreinte + méthode contre un registre serveur de références approuvées et immuables, partagé avec la candidature Marketplace. Ne pas accepter simplement n'importe quelle empreinte bien formée.
4. En cas de référence inconnue, preuve absente ou incohérente, refuser l'approbation sans écrire de droit ni d'événement d'approbation. Retour technique de conflit explicite, à documenter dans le contrat HTTP.
5. Le refus de candidature reste distinct d'une approbation et ne doit pas dépendre d'une preuve suffisante pour activation.
6. Ne pas fabriquer de preuve, remplacer une date ancienne, consentir pour l'utilisateur ou ajouter une exception d'administrateur.

Ce contrôle n'est pas activé dans ce lot : registre exact des références acceptées et traitement des anciens dossiers sans preuve à arrêter par PM/Legal. Les tests existants autorisent encore des dossiers historiques ; cette modification devra mettre à jour les fixtures et scénarios explicitement, sans effacer leur couverture.

## C3.3 — Réutiliser contactRequests
Priorité : réutiliser la collection existante si sa sémantique permet la transmission d'opportunités. Le schéma n'est pas à dupliquer pour contourner le module ancien.

### Identités et références
- productId obligatoire, valide et vérifié côté serveur ; son état et son éligibilité doivent être contrôlés dans l'opération d'enregistrement.
- L'apporteur est obtenu du token Firebase puis du profil serveur, avec isPartner=true et compte éligible ; aucun UID d'apporteur librement fourni par le client.
- Ne pas exiger que l'apporteur soit propriétaire du produit. Ne pas déduire l'attribution définitive de products.user.
- L'identité vérifiée du transmetteur doit être conservée comme fait historique. L'attribution opérationnelle définitive reste une décision staff distincte et auditée.
- contactChannel et autres marqueurs de provenance sont dérivés par le serveur.
- Date de transmission côté serveur ; données de contact minimisées et droits strictement limités.

### Compatibilité
L'ancien module de #2 filtre exclusivement contactChannel=motuka et des produits listingOrigin=commissionnaire avec commissionnaireId concordant et partenaire actif. Il ignore donc les nouveaux apports sur des annonces ordinaires. La révocation ultérieure du partenaire peut également faire disparaître des dossiers de sa liste opérationnelle.

Préserver la lecture des anciens dossiers et introduire un discriminant de schéma/provenance serveur pour les nouveaux apports, après revue du Lead Tech. Ne pas élargir tous les anciens filtres sans distinguer le contrat d'origine.
- Ancien flux : interpréter les références existantes selon leur modèle, avec traitement des incohérences.
- Nouveau flux : authentifier le transmetteur et vérifier productId sans imposer listingOrigin=commissionnaire ni l'égalité propriétaire/apporteur.
- Staff : accéder aux dossiers historiques selon son rôle même lorsqu'une activation partenaire a changé ; l'accès partenaire et la possibilité de nouveau dépôt restent contrôlés séparément.
- Ne pas exposer automatiquement aux managers les coordonnées ou preuves sensibles sans décision produit.
- Conserver le mécanisme d'audit transactionnel et les protections PATCH des identifiants. La réattribution ne doit pas réécrire le transmetteur initial.

### Répartition
Marketplace : contrat d'entrée et transmission authentifiée.
Admin : consultation, affectation opérationnelle autorisée, historique et contrôles staff.
Lead Tech : schéma commun, compatibilité, index, autorisations et revue inter-dépôts.

### Tests indispensables
- 401 anonyme, 403 non-partenaire ou compte inéligible.
- Apporteur forgé refusé ; produit absent/invalide refusé.
- Apport sur produit d'un autre propriétaire accepté lorsque les autres règles métier validées sont satisfaites.
- Ancien flux encore lisible ; nouveau flux visible au staff.
- Double soumission et concurrence sans double attribution acquise.
- Révocation : nouveau dépôt bloqué, historique conservé.
- Affectation staff et historique atomiques ; modifications d'identité refusées.
- Isolation entre partenaires et minimisation des données.
- Pagination et index sur les filtres réellement utilisés.

### Décisions PM / Operations / Legal à obtenir
- Nature exacte des coordonnées transmises et preuve d'autorisation/consentement.
- Éligibilité des produits (vente active, expiration, retrait) et traitement des opportunités antérieures.
- Déduplication et fenêtre temporelle ; politique de priorité/arbitrage.
- Rôles pouvant attribuer/réattribuer et visibilité des données sensibles.
- Preuves pour vérification administrative d'une vente et conséquences opérationnelles.
Aucun nouveau cycle financier, calcul C3.4, statut de vente ou paiement n'est défini ici.

## Lot correctif immédiat
Le seed charge Firebase dynamiquement après validation de tous les garde-fous d'isolation. Ainsi, les refus pour projet réel, endpoint distant ou credential de service interviennent avant même la résolution du SDK. Le lot ne modifie aucune décision réelle.

Vérifié localement sur copie ciblée du SHA #6 : syntaxe seed correcte ; 18/18 tests (gardes seed, gardes HTTP, politique décision) réussis. Les imports Firebase en chemin valide, Firestore Emulator, HTTP réel, navigateur, lint/build et production ne sont pas exécutés dans ce lot.
