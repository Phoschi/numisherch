# Numisherch - Cadrage Produit et Technique

## Resume du besoin

Le PDF fourni decrit une application desktop de recherche pour la numismatique. L'objectif est de centraliser des informations issues de documents historiques, de les organiser, de les filtrer et de les comparer dans une interface simple, lisible et utilisable hors ligne.

L'intention d'interface visible dans les maquettes est la suivante :
- une colonne de filtres a gauche
- une liste de documents au centre
- un bouton `Nouveau document` en haut a droite
- un formulaire de creation / edition de document avec actions `Supprimer` et `Enregistrer`
- une palette simple : fond beige `#eee6d8`, panneaux beige fonce `#D9C7A7`, texte noir

Le PDF precise aussi que les images sont des indications de forme et de positionnement, pas des maquettes pixel perfect.

## Vision produit

Numisherch doit devenir une base documentaire personnelle ou semi-professionnelle pour historien, collectionneur ou chercheur, avec une priorite forte sur :
- la consultation rapide
- le classement des sources
- le travail hors ligne
- la simplicite d'usage

Le produit ressemble davantage a un outil de gestion documentaire specialise qu'a une application de notes generaliste.

## Hypotheses de travail

Hypotheses raisonnables a confirmer avant implementation :
- un `document` represente une piece de monnaie de la collection
- les `filtres` sont des etiquettes ou categories personnalisees par l'utilisateur
- la `date revolutionnaire` est une valeur saisissable en plus de la date classique, avec une certaine souplesse de saisie selon les cas
- la sauvegarde attendue est locale sur le poste, sans compte utilisateur ni backend, avec enregistrement explicite et gestion de brouillons
- l'export PDF concerne probablement les fiches ou les resultats consultes

## Epics et features

### Epic 1 - Modele de donnees documentaire

Objectif :
- definir proprement ce qu'est une piece de monnaie et comment ses informations sont stockees

Features :
- creation d'une entite `Document`
- champs metadata :
  - titre
  - date classique
  - date revolutionnaire
  - type de document
  - sujet
  - localisation
  - reference
  - reference perso
  - note
  - relation many-to-many entre documents et filtres
- tri chronologique des documents
- identifiant stable pour edition / suppression

Questions techniques :
- faut-il stocker une seule date canonique pour le tri, ou plusieurs representations
- faut-il autoriser des dates partielles ou incertaines
- faut-il distinguer `type de document` et `sujet`, car la maquette page 2 montre aussi `Sujet`

Point bloquant potentiel :
- le tri chronologique sera fragile si les dates historiques sont incompletes, approximatives ou multi-calendaires

Precisions produit confirmees :
- un `document` est une piece de monnaie, pas un document d'archive
- l'application sert a reunir autour d'une piece toutes les informations que le collectionneur souhaite conserver
- la structure doit donc etre souple et evolutive, sans forcer un schema trop rigide des la premiere version

### Epic 2 - Gestion des filtres

Objectif :
- permettre a l'utilisateur de classer et retrouver rapidement les documents

Features :
- creation d'un filtre
- modification d'un filtre
- suppression d'un filtre
- affectation multi-selection des filtres a un document
- affichage des documents filtres
- message `aucun document` quand aucun resultat ne correspond

Questions techniques :
- filtre = simple libelle ou groupe avec couleur / ordre / description
- faut-il permettre des filtres combines avec logique `ET / OU`
- faut-il pouvoir reordonner manuellement les filtres de la colonne gauche

Point bloquant potentiel :
- si les filtres deviennent complexes trop tot, l'UX peut se durcir tres vite

Recommendation :
- commencer avec des etiquettes simples, sans logique booleenne avancee

### Epic 3 - Liste documentaire et navigation

Objectif :
- offrir une consultation rapide des fiches

Features :
- affichage de la liste des documents au centre
- tri chronologique
- resume des metadonnees principales dans chaque carte
- ouverture d'un document en edition au clic
- bouton `Nouveau document`
- etat vide lisible

Questions techniques :
- faut-il une vue detail dediee ou edition inline dans un panneau
- faut-il supporter pagination ou simple liste locale
- quelle information afficher dans une carte sans la surcharger

Recommendation :
- dans une V1, rester sur une liste locale simple sans pagination

### Epic 4 - Formulaire de creation / edition

Objectif :
- creer et modifier une fiche documentaire sans friction

Features :
- formulaire `Nouveau document`
- validation minimale des champs
- edition d'un document existant
- bouton `Enregistrer`
- bouton `Supprimer`
- confirmation avant suppression

Questions techniques :
- quels champs sont obligatoires
- faut-il autosave, bouton sauvegarder, ou les deux
- comment gerer une fermeture de fenetre avec modifications non sauvegardees

Point bloquant potentiel :
- l'attente utilisateur sur la sauvegarde n'est pas encore tranchee : `bouton ou automatique, le plus simple`

Recommendation :
- V1 : sauvegarde explicite avec bouton `Enregistrer`
- V1 : systeme de brouillon local pour conserver les modifications en cours avant enregistrement final
- V1.1 : autosave optionnel si le besoin apparait apres usage reel

### Epic 5 - Persistance locale et mode hors ligne

Objectif :
- garantir une utilisation sans connexion et une conservation fiable des donnees

Features :
- stockage local persistant
- chargement automatique a l'ouverture
- sauvegarde locale robuste
- gestion minimale de corruption ou echec d'ecriture

Choix techniques a etudier :
- SQLite embarque via plugin Tauri ou acces Rust
- fichier JSON local
- stockage browser type IndexedDB

Recommendation technique :
- privilegier SQLite pour la V1 si on veut un socle durable

Pourquoi SQLite :
- fiable pour un desktop offline
- simple pour le tri, les filtres et les recherches futures
- plus robuste qu'un JSON si le volume grossit
- ouvre la porte a l'import / export et aux migrations

Alternative acceptable en prototype :
- JSON local si l'objectif est juste de valider l'usage rapidement

Point bloquant potentiel :
- si on commence en JSON puis que les besoins de recherche augmentent vite, une migration vers SQLite sera probable

Decision prise :
- SQLite est le choix retenu pour la V1
- le produit etant personnel et desktop, ce choix offre le meilleur compromis entre robustesse, simplicite et evolutivite

### Epic 6 - Recherche et exploitation des donnees

Objectif :
- rendre la base vraiment utile au travail de recherche

Features V1 :
- filtre par etiquettes
- tri par date

Features V2 probables :
- recherche texte plein
- recherche multi-criteres
- tri secondaire
- comparaison de fiches

Point de reflexion :
- le besoin parle de `classer et comparer des sources historiques`, mais la comparaison n'est pas encore decrite fonctionnellement

Question a cadrer :
- comparer signifie quoi exactement :
  - voir deux fiches cote a cote
  - comparer leurs metadonnees
  - comparer leur contenu textuel

### Epic 7 - Export PDF

Objectif :
- permettre d'imprimer ou partager les informations saisies

Features :
- export d'une fiche en PDF
- export d'une liste filtree en PDF

Questions techniques :
- quel format exact attend l'utilisateur
- faut-il un export imprime propre ou juste un PDF brut
- faut-il inclure tous les champs et les filtres

Recommendation :
- V1 : export PDF d'une fiche unique
- V2 : export d'une liste ou d'un dossier de recherche

### Epic 8 - Experience UI et design system

Objectif :
- traduire la maquette en interface simple, stable et agreable

Features :
- layout trois zones inspire de la maquette
- palette beige / beige fonce / noir
- composants stables :
  - liste
  - filtres
  - formulaire
  - boutons d'action
  - etat vide
- adaptation correcte desktop petit ecran

Point de reflexion :
- la maquette montre des formes arrondies et des blocs tres lisibles, mais il faut transformer cela en vrai design system cohérent plutot qu'en simple inline style

Recommendation technique :
- centraliser les couleurs dans des variables CSS
- separer les composants React des styles
- conserver un style desktop sobre et specialise

## Priorisation conseillee

### Lot 1 - MVP utilisable

Ce lot permet deja de travailler dans l'application :
- modele `Document`
- modele `Filtre`
- stockage local
- liste des documents
- creation / edition / suppression
- filtrage simple
- tri chronologique
- message `aucun document`

### Lot 2 - Confort d'usage

- meilleure validation formulaire
- confirmation de navigation / perte de donnees
- affinage UI
- sauvegarde automatique si necessaire

### Lot 3 - Exploitation avancee

- export PDF
- recherche texte
- comparaison de fiches
- import / export de base

## Architecture technique conseillee

### Frontend

Stack actuelle adaptee :
- React
- TypeScript
- Tauri

Structure conseillee :
- `features/documents`
- `features/filters`
- `features/export`
- `shared/ui`
- `shared/types`
- `shared/lib`

Etat applicatif :
- un store local simple suffit au debut
- `useState` / `useReducer` peuvent suffire en prototype
- si l'edition devient plus riche, un store type Zustand peut devenir utile

Recommendation :
- ne pas introduire une couche d'etat trop lourde avant d'avoir valide les vrais ecrans

### Backend desktop

Responsabilites Tauri / Rust conseillees :
- acces au stockage local
- ecriture / lecture de la base
- export PDF si necessaire
- eventuelle conversion ou validation technique de dates

Recommendation :
- garder la logique metier simple cote frontend au debut
- pousser dans Rust uniquement ce qui touche au systeme, au stockage ou aux performances

## Points a trancher avant implementation

### 1. Nature exacte du document

Decision prise :
- un document represente une piece de monnaie de la collection

Implications :
- le modele doit representer une fiche de piece
- la structure doit permettre d'ajouter des informations heterogenes autour de cette piece
- il faudra probablement prevoir a terme des champs extensibles ou des notes riches

### 2. Strategie de sauvegarde

Recommendation :
- enregistrer la fiche uniquement au clic sur `Enregistrer`
- ajouter un systeme de brouillon local pour conserver les modifications en cours

Questions restantes :
- un brouillon par piece ou un seul brouillon global d'edition
- quand restaurer un brouillon : automatiquement a l'ouverture, ou sur proposition

### 3. Gestion des dates historiques

C'est le sujet technique le plus sensible du besoin.

Questions :
- quel format pour la date classique
- quel format pour la date revolutionnaire
- faut-il convertir de l'une a l'autre
- comment trier si seule la date revolutionnaire est connue
- comment gerer les dates inconnues ou incompletes

Recommendation :
- stocker des champs separes
- definir un champ `sortDate` technique pour le tri quand c'est possible
- sinon prevoir un fallback manuel

Decision produit actuelle :
- il faut laisser de la souplesse a l'utilisateur
- une premiere version doit offrir plusieurs options plutot qu'imposer un modele historique trop strict

### 4. Portee de l'export PDF

Il faut decider si l'export sert a :
- partager une fiche
- imprimer une recherche
- archiver un lot de documents

### 5. Evolution future

Le besoin actuel est simple, mais il ouvre naturellement vers :
- attachement de fichiers source
- import massif
- recherche plein texte
- comparaison avancee
- sauvegarde externe

Il faut donc eviter un modele trop fragile des la V1.

## Decisions deja tranchees

- `Document` = une piece de monnaie de la collection
- le produit doit avant tout offrir une structure souple pour centraliser les informations sur ces pieces
- la creation / edition doit etre maniable
- la sauvegarde se fait au clic sur `Enregistrer`
- un systeme de brouillon est attendu pour les modifications en cours
- SQLite est retenu pour la persistance locale

## Questions restantes utiles

Les reponses fournies suffisent pour demarrer la conception. Il reste seulement quelques questions ciblées qui aideront a faire une bonne V1 :

### 1. Quel est le minimum d'information obligatoire pour une piece

Exemples possibles :
- seulement un titre
- titre + date
- titre + reference perso

Recommendation :
- V1 avec tres peu de champs obligatoires, idealement seulement `titre`

### 2. Faut-il attacher des images ou fichiers a une piece des la V1

Ce n'est pas dans le besoin initial, mais pour une collection de monnaies cela arrivera probablement vite.

Recommendation :
- ne pas le mettre dans la toute premiere iteration si on veut avancer vite
- mais garder le schema pret a accueillir des medias plus tard

### 3. Quelle souplesse de filtre veut-on vraiment

Il faut savoir si les filtres servent a classer par exemple :
- atelier
- periode
- metal
- pays
- rarete
- etat de conservation

Recommendation :
- filtres libres geres par l'utilisateur en V1
- on pourra ensuite proposer des familles de filtres si besoin

### 4. Quelle strategie pour la date en V1

Comme tu veux lui laisser le choix, une premiere version raisonnable pourrait etre :
- un champ texte `date affichage`
- un champ texte `date revolutionnaire`
- un champ technique optionnel `date de tri`

Ainsi :
- l'utilisateur garde une saisie libre
- l'application peut quand meme trier correctement quand une date de tri est fournie

Cette approche est simple et robuste pour une V1.

## Risques principaux

- ambiguite sur la notion exacte de `document`
- complexite reelle de la date revolutionnaire
- derive fonctionnelle si les filtres deviennent trop puissants trop tot
- choix d'un stockage trop simple si la base grossit
- export PDF mal defini, donc difficile a prioriser proprement

## Proposition de demarrage technique

Si l'on veut avancer vite sans construire trop tot une usine a gaz, la trajectoire la plus saine serait :

1. definir le schema de donnees `documents + filtres`
2. choisir le stockage local
3. construire le layout principal
4. implementer CRUD document
5. implementer CRUD filtres
6. brancher le filtrage et le tri
7. seulement ensuite traiter export PDF et raffinements

## Conclusion

Le besoin est suffisamment clair pour commencer un MVP, mais pas encore assez tranche sur certains sujets structurants :
- strategie de sauvegarde
- comportement autour des dates historiques
- portee de l'export PDF

Le coeur du produit semble etre :
- une base documentaire specialisee
- offline-first
- simple a manipuler
- centree sur le classement et la consultation

La meilleure suite est de cadrer une V1 tres simple mais solide, puis de faire grossir l'outil autour d'un stockage local robuste et d'un modele de donnees propre.

Avec les decisions deja prises, il est maintenant possible de passer a l'etape suivante :
- definir le schema de donnees V1
- definir les ecrans V1
- puis decouper l'implementation en lots techniques
