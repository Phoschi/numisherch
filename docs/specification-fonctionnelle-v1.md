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

## Ecran 1 - Vue Pieces

### Role

C'est l'ecran central de l'application. Il permet :
- de voir toutes les pieces
- de filtrer rapidement la collection
- d'ouvrir une fiche existante dans une fenetre modale
- de creer une nouvelle fiche dans une fenetre modale

### Structure

L'ecran est compose de deux zones logiques :

- zone haute :
  - bouton `Nouvelle piece`
  - filtres rapides si des filtres existent
  - message d'aide si aucun filtre n'existe encore

- zone principale :
  - liste des pieces
  - affichage chronologique
  - message `aucune piece` si la liste est vide

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
- reprendre un brouillon via un bandeau d'information si necessaire

## Ecran 2 - Gestion des filtres

### Role

Permettre a l'utilisateur de creer et maintenir ses propres categories de classement, puis de reclasser rapidement les pieces deja associees.

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
- voir les pieces rattachees au filtre selectionne
- selectionner plusieurs pieces du filtre
- associer cette selection a un autre filtre
- retirer une piece du filtre courant
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

Gestion des pieces d'un filtre :
- l'utilisateur selectionne un filtre
- l'application affiche les pieces associees
- l'utilisateur peut cocher une ou plusieurs pieces
- l'utilisateur peut les associer a un autre filtre en une action
- l'utilisateur peut aussi retirer individuellement une piece du filtre courant

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

Permettre a l'utilisateur de creer une nouvelle fiche de piece dans une fenetre modale dediee.

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
- fermeture de la fenetre

### Comportement de sauvegarde

Tant que l'utilisateur n'a pas clique sur `Enregistrer` :
- la piece n'est pas creee dans la table `coins`
- les modifications peuvent exister dans un brouillon

Si l'utilisateur ferme la fenetre en cliquant a l'exterieur ou sur `Fermer` :
- si aucune modification utile n'existe, la fenetre se ferme
- sinon, demander `Voulez-vous l'enregistrer en tant que brouillon ?`
- si `Oui`, enregistrer le brouillon local puis fermer
- si `Non`, fermer sans conserver les changements

Quand l'utilisateur clique sur `Enregistrer` :
- validation minimale
- creation de la piece
- creation des associations avec les filtres
- suppression du brouillon eventuel
- retour a la liste avec la piece visible

### Brouillon de creation

Si l'utilisateur commence une nouvelle piece sans l'enregistrer :
- un brouillon local peut etre cree

Le brouillon est visible dans l'onglet `Brouillons`.

Au prochain retour sur l'application :
- l'utilisateur peut reprendre ce brouillon depuis l'onglet dedie
- l'application peut aussi afficher un bandeau d'information dans la vue `Pieces`

## Ecran 5 - Formulaire Edition de piece

### Role

Modifier une fiche existante dans la meme fenetre modale que la creation.

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
- si un brouillon existe, permettre de le reprendre depuis l'onglet `Brouillons`
- ou via un bandeau contextuel dans la vue `Pieces`

### Decision UX V1

Ne pas restaurer silencieusement un brouillon d'edition.

Il vaut mieux laisser l'utilisateur choisir explicitement quand le rouvrir.

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

Depuis l'onglet `Brouillons` :
- l'utilisateur voit tous les brouillons disponibles
- un clic sur `Reprendre` ouvre la fenetre modale avec les donnees du brouillon
- apres `Enregistrer`, l'application revient a la vue `Pieces`

### Actions utilisateur

Sur un brouillon retrouve :
- `Reprendre`
- `Supprimer`

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
2. la fenetre modale s'ouvre
3. remplir un ou plusieurs champs
4. selectionner des filtres si necessaire
5. cliquer sur `Enregistrer`
6. retour a la liste
7. la piece apparait dans la liste

### Flux 2 - Modifier une piece

1. cliquer sur une piece existante
2. la fenetre modale s'ouvre
3. modifier les champs
4. cliquer sur `Enregistrer`
5. la fiche est mise a jour

### Flux 3 - Reprendre un brouillon

1. ouvrir l'application ou la fiche
2. aller dans l'onglet `Brouillons`
3. choisir `Reprendre`
4. retrouver les donnees en cours dans la fenetre modale

### Flux 4 - Filtrer la liste

1. cliquer sur un filtre
2. la liste se met a jour
3. si aucun resultat, afficher le message vide

### Flux 5 - Reclasser des pieces depuis un filtre

1. ouvrir l'onglet `Filtres`
2. selectionner un filtre
3. cocher une ou plusieurs pieces associees
4. choisir un autre filtre
5. cliquer sur `Associer la selection`

## Decisions V1 a valider

Ces choix sont proposes pour la premiere implementation :
- une vue `Pieces` volontairement simple
- un formulaire unique pour creation et edition dans une modale
- une vue `Filtres` orientee gestion et reclassement
- une vue `Brouillons` orientee reprise explicite
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
