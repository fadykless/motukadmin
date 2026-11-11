# Admin — contrats A02 / A05 / A07 proposés au Lead Tech

Date : 11 novembre 2026. Statut : proposition à revoir avec Developer 1, PM, Operations et Legal.
Aucun de ces contrats ne constitue un arbitrage métier ou une autorisation de production.

## A02 — garde avant approbation

L'affichage C2.1 est distinct de l'autorisation d'approuver. La route actuelle et ses droits restent inchangés dans ce lot. `proposals/partnerConsentGuard.mjs` est un prototype pur, testé, non importé par les routes applicatives.

Proposition d'appel, uniquement après accord PM/Legal : dans la transaction d'approbation existante, relire le dossier et évaluer la preuve avant toute écriture de droit ou d'audit d'approbation. Préserver le contrôle de concurrence existant. Le refus reste une action distincte.

| Contrôle proposé | Résultat si invalide |
| --- | --- |
| UID authentifié du dossier identique à `application.userId` | CONSENT_IDENTITY_MISMATCH |
| Version, empreinte hexadécimale SHA-256 et méthode présentes | CONSENT_INCOMPLETE |
| Date Firestore convertible en date valide | CONSENT_DATE_INVALID |
| Registre serveur explicitement configuré | CONSENT_REFERENCE_NOT_CONFIGURED |
| Tuple version + empreinte + méthode identique à une référence autorisée | CONSENT_REFERENCE_UNKNOWN |

Le registre doit être arrêté avec Marketplace et Legal : version, empreinte SHA-256 du texte UTF-8 exact, méthode permise et statut approuvé. Un blob Git n'est pas l'empreinte du texte contractuel. Aucun registre de production n'est créé ni déduit des fixtures. Le prototype refuse une référence inconnue même lorsque son empreinte est bien formée.

**Arbitrages nécessaires :** références autorisées ; conservation des versions précédentes ; traitement des dossiers historiques sans preuve ; éventuel parcours de renouvellement de consentement par l'utilisateur. Le prototype ne fabrique aucun consentement, ne réécrit pas une date, ne prévoit pas de bypass administratif. Il ne définit pas de régime rétroactif. Le contrôle n'est pas activé avant décision PM/Legal ; le comportement historique actuel reste donc une dépendance de lancement, pas une validation de conformité.

## A05 — contactRequests, proposition versionnée à convenir avec Developer 1

La nouvelle demande d'apport ne doit pas dépendre de `products.listingOrigin=commissionnaire`, de `products.commissionnaireId` ni de la propriété de l'annonce. La vérification de l'apporteur lors du dépôt est distincte de l'attribution administrative définitive.

Collection proposée : `contactRequests` existante. Aucun nouveau stockage concurrent, migration réelle ou API de dépôt n'est créé dans ce lot.

| Champ proposé pour le nouveau flux | Autorité / signification |
| --- | --- |
| `schemaVersion: 2` | Discriminant persisté par le serveur, à confirmer avec Developer 1 |
| `requestKind: partner_referral` | Provenance serveur du nouveau flux, à confirmer |
| `productId` | Obligatoire ; véhicule identifié et relu côté serveur |
| `introducedByUid` | Identité de l'apporteur dérivée du jeton, profil actif et `isPartner=true` vérifiés au dépôt ; immuable |
| `assignedPartnerUid` | Attribution définitive distincte ; nullable avant décision staff ; règles à valider |
| `assignedTo` | Responsable interne Motuka ; rôle staff et compte éligibles vérifiés |
| `buyerId` | Référence acheteur si identifié ; ne pas supposer qu'un prospect possède déjà un compte |
| `status` | Statut commercial ; vocabulaire et transitions à arrêter avec Operations |
| `createdAt`, `updatedAt` | Timestamps serveur |
| `version` | Version de concurrence des traitements Admin ; ancien document sans champ = 0 |
| `submissionKey` | Intention idempotente du dépôt ; périmètre et durée à convenir |
| Référence de consentement / autorisation de contact | Contenu minimal, collecte et visibilité à arrêter avec Legal |

`products.user` reste le propriétaire de l'annonce, jamais une preuve d'apport. `introducedByUid` n'est pas réécrit lors d'une réattribution. Une déclaration client de `introducedByUid`, de rôle, de droit partenaire, de statut vérifié ou de commission doit être refusée. Les coordonnées ne sont pas exposées par défaut dans les listes ou journaux.

### Compatibilité et consultation historique

- Les anciens documents sans discriminant gardent leur sémantique historique ; ne pas assimiler automatiquement `commissionnaireId` à un nouvel apport vérifié.
- Un adaptateur séparera legacy et nouveau flux après accord sur le schéma. Les anciens filtres du code #2 restent uniquement le comportement legacy dans cette branche de préparation. Ils ne sont pas réutilisés comme exigence du nouveau dépôt.
- L'adaptateur nouveau flux n'est pas encore développé : la liste actuelle n'est pas annoncée compatible avec ce contrat proposé.
- Proposition à Operations/PM : visibilité staff fondée sur la provenance historique persistée, y compris après retrait du droit ou disparition de l'annonce ; afficher l'anomalie actuelle sans effacer le dossier. Ne pas ouvrir de nouvelles écritures pour un partenaire désactivé.
- Aucun élargissement de visibilité historique ou de droits manager n'est appliqué avant cet arbitrage. La limite de visibilité du code #2 reste explicitement à résoudre avant lancement.
- Conserver `contactRequests/{id}/history` et l'atomicité état/audit. Les identités, références de véhicule et faits historiques ne sont pas modifiables par le PATCH de traitement.

### Décisions requises et essais après raccordement

Developer 1 / Lead Tech : confirmer discriminants, noms de champs, productId obligatoire, idempotence, erreurs HTTP et schéma de réponse. Operations/PM : attribution et réattribution, lecture historique, transitions, recherche et filtres MVP. Legal : contact, pièces privées et rétention. Business/Operations : doublons, priorité et contestations. Une clé idempotente ne remplace pas la règle métier de déduplication.

Recette requise : apport sur véhicule d'un autre propriétaire ; identité d'apporteur forgée ; compte désactivé ; double dépôt ; accès à un prospect d'un autre partenaire ; ancien dossier après désactivation ; filtres/pagination/index des deux schémas ; absence de fuite de coordonnées. Cette recette n'est pas remplacée par les tests legacy de la branche d'intégration.

## A07 — proposition minimale de vérification de vente

Aucune route ni transition de vente nouvelle implémentée dans ce lot. Proposition soumise à PM/Operations/Business/Legal :

| Événement distinct | Données minimales proposées |
| --- | --- |
| Déclaration de vente | Référence prospect et véhicule, déclarant authentifié, date déclarée, prix final déclaré et devise, référence de justificatif privé |
| Décision de vérification | Identité staff habilitée, version attendue, date serveur, décision explicite et motif, références des pièces examinées |
| Correction / contestation | Nouvel événement avec auteur, motif et référence de la décision corrigée ; historique antérieur conservé |

Un statut d'annonce « vendue » ou une ancienne clôture `completed` ne crée ni déclaration vérifiée, ni commission due, ni preuve d'encaissement. Le véhicule est payé en espèces hors Motuka. La preuve de réalisation et son niveau de suffisance restent une décision Operations/Legal, non une déduction du code. Toute vérification et tout historique devront être atomiques et protégés contre les mises à jour concurrentes.

Aucun calcul C3.4, collecte, portefeuille, virement, rémunération ou répartition de fonds. Pas de visibilité automatique des pièces aux managers ou commissionnaires. Rôles autorisés, annulations et rétention restent à arbitrer.
