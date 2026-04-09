# Numisherch - Specification fonctionnelle V1

## Objectif

Decrire le comportement fonctionnel de la V1 de Numisherch, ecran par ecran, avant implementation.

Cette V1 doit permettre a un collectionneur de pieces de monnaie :
- creer des fiches de pieces
- les organiser avec des filtres
- les consulter dans une liste claire
- reprendre un travail en cours grace aux brouillons
- travailler localement hors ligne

## Perimetre de la V1

Inclus dans la V1 :
- page principale
- liste des pieces
- filtrage par etiquettes
- creation d'une piece
- edition d'une piece
- suppression d'une piece
- creation, edition et suppression de filtres
- sauvegarde manuelle
- systeme de brouillon local

Hors perimetre V1 :
- attachement d'images ou de fichiers
- recherche plein texte avancee
- comparaison detaillee de fiches
- export PDF
- synchronisation cloud

## Principes UX V1

La V1 doit rester :
- simple
- rapide a comprendre
- stable
- centree sur la saisie et la consultation

Principes retenus :
- peu de champs obligatoires
- actions explicites
- message clair en cas d'absence de donnees
- reprise facile d'un travail en cours

## Ecran 1 - Vue principale

### Role

C'est l'ecran central de l'application. Il permet :
- de voir les filtres disponibles
- de consulter la liste des pieces
- d'ouvrir une fiche existante
- de creer une nouvelle fiche

### Structure

L'ecran est compose de trois zones logiques :

- colonne gauche :
  - liste des filtres
  - action pour creer un filtre

- zone centrale :
  - liste des pieces
  - affichage chronologique
  - message `aucune piece` si la liste est vide

- zone haute droite :
  - bouton `Nouvelle piece`

### Comportement

Au lancement :
- l'application charge les filtres
- l'application charge les pieces
- la liste est triee par date via `sort_date` si disponible
- les pieces sans `sort_date` apparaissent apres les autres

Si aucun filtre n'est selectionne :
- toutes les pieces sont visibles

Si un ou plusieurs filtres sont selectionnes :
- seules les pieces correspondant au filtre actif sont affichees

Si aucun resultat ne correspond :
- afficher un message d'etat vide, par exemple `Aucune piece ne correspond au filtre selectionne`

### Actions disponibles

- cliquer sur un filtre
- deselectionner un filtre
- ouvrir une fiche existante
- cliquer sur `Nouvelle piece`

## Ecran 2 - Gestion des filtres

### Role

Permettre a l'utilisateur de creer et maintenir ses propres categories de classement.

### Donnees gerees

Un filtre contient au minimum :
- un nom

Optionnellement :
- une description
- un ordre d'affichage

### Fonctionnalites

- creer un filtre
- renommer un filtre
- supprimer un filtre
- reordonner les filtres plus tard si necessaire

### Comportement V1

Creation d'un filtre :
- l'utilisateur saisit un nom
- le nom doit etre unique
- le filtre apparait immediatement dans la colonne de gauche

Modification d'un filtre :
- l'utilisateur peut modifier son nom
- si le nom existe deja, afficher un message d'erreur simple

Suppression d'un filtre :
- demander confirmation
- la suppression ne supprime pas les pieces
- elle retire seulement l'association entre les pieces et ce filtre

### Decision UX V1

Les filtres sont libres.

Cela signifie :
- aucun catalogue de filtres impose
- l'utilisateur organise sa collection selon sa logique

## Ecran 3 - Liste des pieces

### Role

Afficher les fiches existantes de facon compacte et lisible.

### Contenu d'une carte de piece

Chaque ligne ou carte de la liste doit afficher un resume minimal :
- titre
- date d'affichage si disponible
- reference perso si disponible
- filtres associes si pertinent visuellement

### Tri

Ordre par defaut :
- `sort_date` croissante ou decroissante, a definir visuellement

Recommendation V1 :
- tri chronologique du plus ancien au plus recent

Pieces sans date de tri :
- affichees a la fin

### Interaction

Au clic sur une piece :
- ouvrir la fiche en mode edition

Si la liste est vide globalement :
- afficher un message d'accueil simple invitant a creer une premiere piece

## Ecran 4 - Formulaire Nouvelle piece

### Role

Permettre a l'utilisateur de creer une nouvelle fiche de piece.

### Champs V1

- titre
- type de document
- sujet
- localisation
- reference
- reference perso
- date affichage
- date revolutionnaire
- date de tri
- precision de date
- filtres associes
- note

### Champs obligatoires V1

- titre uniquement

### Actions

- `Enregistrer`
- `Supprimer` uniquement si la piece existe deja
- fermeture ou retour

### Comportement de sauvegarde

Tant que l'utilisateur n'a pas clique sur `Enregistrer` :
- la piece n'est pas creee dans la table `coins`
- les modifications peuvent exister dans un brouillon

Quand l'utilisateur clique sur `Enregistrer` :
- validation minimale
- creation de la piece
- creation des associations avec les filtres
- suppression du brouillon eventuel
- retour a la liste avec la piece visible

### Brouillon de creation

Si l'utilisateur commence une nouvelle piece sans l'enregistrer :
- un brouillon local peut etre cree

Au prochain retour sur l'application :
- si un brouillon de creation existe, l'application peut proposer de le reprendre

Recommendation V1 :
- afficher une proposition simple du type `Un brouillon non enregistre a ete retrouve. Voulez-vous le reprendre ?`

## Ecran 5 - Formulaire Edition de piece

### Role

Modifier une fiche existante.

### Chargement

A l'ouverture :
- charger les donnees de la piece
- charger ses filtres associes

### Comportement

Pendant l'edition :
- les changements peuvent alimenter un brouillon d'edition
- la fiche d'origine reste intacte tant que `Enregistrer` n'est pas clique

Au clic sur `Enregistrer` :
- mise a jour de la piece
- mise a jour des associations de filtres
- suppression du brouillon d'edition associe

### Brouillon d'edition

Si l'utilisateur ferme l'ecran ou l'application en cours d'edition :
- le brouillon d'edition doit permettre de reprendre le travail

Au retour sur la fiche :
- si un brouillon existe, proposer :
  - reprendre le brouillon
  - ignorer le brouillon et charger la version enregistree

### Decision UX V1

Ne pas restaurer silencieusement un brouillon d'edition.

Il vaut mieux demander explicitement a l'utilisateur ce qu'il veut faire.

## Ecran 6 - Suppression d'une piece

### Role

Eviter une suppression accidentelle.

### Comportement

Quand l'utilisateur clique sur `Supprimer` :
- ouvrir une confirmation
- message recommande :
  - `Voulez-vous vraiment supprimer cette piece ?`

Si confirmation :
- supprimer la piece
- supprimer ses associations de filtres
- supprimer son brouillon d'edition eventuel
- revenir a la liste

Si annulation :
- ne rien changer

## Ecran 7 - Gestion des brouillons

### Role

Permettre une reprise de travail simple sans imposer une autosauvegarde definitive.

### Types de brouillons

- brouillon de creation
- brouillon d'edition

### Comportements V1 recommandes

Brouillon de creation :
- cree quand l'utilisateur a commence a remplir une nouvelle piece
- non transforme en vraie piece tant que `Enregistrer` n'est pas clique

Brouillon d'edition :
- rattache a une piece existante
- conserve les modifications non encore validees

### Regles de reprise

Au lancement de l'application :
- si un brouillon de creation existe, proposer de le reprendre

A l'ouverture d'une piece :
- si un brouillon d'edition existe, proposer de le reprendre

### Actions utilisateur

Sur un brouillon retrouve :
- `Reprendre`
- `Ignorer`

Option future :
- `Supprimer le brouillon`

## Regles fonctionnelles transverses

### Validation

V1 doit rester permissive.

Regles minimales :
- `title` obligatoire
- nom de filtre obligatoire
- nom de filtre unique

### Tri

Regle V1 :
- trier sur `sort_date` si renseignee
- sinon placer en fin de liste

### Hors ligne

Le produit doit fonctionner sans connexion :
- lecture locale
- ecriture locale
- brouillons locaux

### Performance

Pour la V1, les volumes attendus permettent :
- une liste simple
- un chargement complet local
- pas de pagination obligatoire

## Etats vides et messages utiles

### Aucune piece

Message possible :
- `Aucune piece enregistree pour le moment. Creez votre premiere fiche.`

### Aucun resultat de filtre

Message possible :
- `Aucune piece ne correspond au filtre selectionne.`

### Brouillon retrouve

Messages possibles :
- `Un brouillon non enregistre a ete retrouve.`
- `Voulez-vous reprendre votre travail en cours ?`

### Validation

Message possible :
- `Le titre est obligatoire.`

## Flux utilisateur principaux

### Flux 1 - Creer une piece

1. cliquer sur `Nouvelle piece`
2. remplir un ou plusieurs champs
3. selectionner des filtres si necessaire
4. cliquer sur `Enregistrer`
5. retour a la liste
6. la piece apparait dans la liste

### Flux 2 - Modifier une piece

1. cliquer sur une piece existante
2. modifier les champs
3. cliquer sur `Enregistrer`
4. la fiche est mise a jour

### Flux 3 - Reprendre un brouillon

1. ouvrir l'application ou la fiche
2. voir la proposition de reprise
3. choisir `Reprendre`
4. retrouver les donnees en cours

### Flux 4 - Filtrer la liste

1. cliquer sur un filtre
2. la liste se met a jour
3. si aucun resultat, afficher le message vide

## Decisions V1 a valider

Ces choix sont proposes pour la premiere implementation :
- une seule vue principale avec liste et navigation simple
- formulaire unique pour creation et edition
- titre comme seul champ obligatoire
- filtres libres
- sauvegarde uniquement sur action utilisateur
- brouillons proposes, jamais imposes silencieusement
- tri base sur `sort_date`

## Conclusion

Cette specification fonctionnelle V1 fournit un comportement suffisamment precis pour :
- passer au decoupage technique
- definir les composants UI
- brancher ensuite SQLite et les operations CRUD

La prochaine etape logique est :
- transformer cette spec en plan d'implementation
- ou passer directement a la construction du squelette fonctionnel de l'application
