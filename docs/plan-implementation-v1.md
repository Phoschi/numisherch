# Numisherch - Plan d'implementation V1

## Objectif

Decouper l'implementation de la V1 en lots clairs, progressifs et testables.

Le plan cherche a :
- livrer rapidement une base fonctionnelle
- limiter les risques techniques
- garder une progression logique entre donnees, UI et comportements

## Strategie generale

Ordre recommande :

1. poser le socle technique
2. brancher la persistence SQLite
3. implementer le modele de donnees et les operations CRUD
4. construire l'interface principale
5. ajouter les brouillons
6. finaliser les comportements UX et la stabilite

## Lot 0 - Preparation technique

### Objectif

Mettre le projet dans un etat propre pour recevoir les futures features.

### Taches

- structurer le code frontend en dossiers fonctionnels
- choisir l'emplacement du code SQLite / Tauri
- definir les types TypeScript partages
- definir les commandes Tauri minimales
- preparer les helpers de date et de mapping

### Livrable attendu

- architecture de dossiers stable
- base de types partagee
- socle Rust / Tauri pret pour SQLite

### Risques

- partir trop vite sur une architecture trop lourde

### Recommendation

- rester simple et modulaire

## Lot 1 - Base de donnees SQLite

### Objectif

Creer le stockage local durable.

### Taches

- initialiser SQLite
- creer les tables :
  - `coins`
  - `filters`
  - `coin_filters`
  - `coin_drafts`
- ajouter les index
- definir une logique d'initialisation de base
- prevoir un mecanisme simple de migration

### Livrable attendu

- base SQLite creee automatiquement au lancement
- schema V1 installe

### Verification

- la base est creee localement
- les tables existent
- les insertions / lectures simples fonctionnent

## Lot 2 - API locale Tauri / Rust

### Objectif

Exposer les operations de base au frontend.

### Taches

- lire toutes les pieces
- lire tous les filtres
- creer une piece
- modifier une piece
- supprimer une piece
- creer un filtre
- modifier un filtre
- supprimer un filtre
- associer / dissocier des filtres a une piece
- lire / ecrire / supprimer un brouillon

### Livrable attendu

- une couche de commandes Tauri claire et stable

### Verification

- chaque commande peut etre appelee depuis le frontend
- les erreurs sont gerees proprement

## Lot 3 - Types frontend et couche d'acces

### Objectif

Donner au frontend une base propre pour consommer les donnees.

### Taches

- creer les types `Coin`, `Filter`, `CoinDraft`
- creer les fonctions d'appel a Tauri
- mapper proprement les donnees SQLite vers le frontend
- centraliser les erreurs et retours de commandes

### Livrable attendu

- une couche `services` ou `repositories` utilisable par l'UI

### Verification

- les donnees remontent correctement dans le frontend

## Lot 4 - Layout principal et design system minimal

### Objectif

Mettre en place la vraie structure visuelle de l'application.

### Taches

- creer le layout principal
- creer la colonne gauche des filtres
- creer la zone centrale de liste
- ajouter le bouton `Nouvelle piece`
- appliquer la palette validee :
  - fond `#eee6d8`
  - panneaux `#D9C7A7`
  - texte noir
- definir des variables CSS et composants UI de base

### Livrable attendu

- page principale utilisable visuellement

### Verification

- l'app ressemble deja a la maquette dans son intention
- l'interface reste propre sur les tailles desktop cibles

## Lot 5 - Gestion des filtres

### Objectif

Permettre le classement libre des pieces.

### Taches

- afficher les filtres
- creer un filtre
- modifier un filtre
- supprimer un filtre avec confirmation
- selectionner un filtre pour filtrer la liste
- gerer l'etat `aucun resultat`

### Livrable attendu

- panneau filtres complet en V1

### Verification

- les filtres se creent et se mettent a jour
- la liste des pieces reagit au filtre selectionne

## Lot 6 - Liste des pieces

### Objectif

Afficher les pieces existantes dans la vue principale.

### Taches

- afficher la liste des pieces
- trier par `sort_date`
- gerer les pieces sans date
- afficher les informations resumees
- gerer l'etat vide global
- ouvrir une piece au clic

### Livrable attendu

- liste centrale fonctionnelle

### Verification

- l'ordre de tri est correct
- les cartes affichent les bonnes informations

## Lot 7 - Formulaire de creation / edition

### Objectif

Rendre possible la creation et la modification des fiches.

### Taches

- construire le formulaire unique creation / edition
- afficher tous les champs V1
- gerer la multi-selection des filtres
- rendre `title` obligatoire
- brancher `Enregistrer`
- brancher `Supprimer` en edition
- afficher les erreurs minimales

### Livrable attendu

- formulaire complet et branche

### Verification

- une piece peut etre creee
- une piece peut etre modifiee
- une piece peut etre supprimee

## Lot 8 - Brouillons

### Objectif

Permettre a l'utilisateur de reprendre un travail non enregistre.

### Taches

- creer un brouillon de creation
- creer un brouillon d'edition
- restaurer un brouillon de creation au lancement
- restaurer un brouillon d'edition a l'ouverture d'une piece
- proposer `Reprendre` ou `Ignorer`
- supprimer le brouillon apres enregistrement final

### Livrable attendu

- systeme de brouillons fonctionnel

### Verification

- une fermeture accidentelle ne fait pas perdre le travail
- l'utilisateur garde le controle de la restauration

## Lot 9 - Finition UX et stabilisation

### Objectif

Finaliser la V1 pour qu'elle soit vraiment utilisable.

### Taches

- confirmation de suppression
- messages d'etat vide
- messages de validation simples
- gestion des erreurs de lecture / ecriture
- nettoyage des libelles
- verification Linux + Windows

### Livrable attendu

- V1 stable et presentable

### Verification

- parcours complet sans blocage
- app stable au redemarrage

## Ordre de developpement recommande

Ordre concret pour coder :

1. Lot 0
2. Lot 1
3. Lot 2
4. Lot 3
5. Lot 4
6. Lot 5
7. Lot 6
8. Lot 7
9. Lot 8
10. Lot 9

## Jalons utiles

### Jalon A - Donnees prêtes

Fin du Lot 3 :
- schema en place
- commandes Tauri disponibles
- frontend capable de lire / ecrire

### Jalon B - Interface navigable

Fin du Lot 6 :
- layout principal visible
- filtres affiches
- liste des pieces fonctionnelle

### Jalon C - CRUD complet

Fin du Lot 7 :
- creation
- edition
- suppression

### Jalon D - Experience resiliente

Fin du Lot 8 :
- brouillons fonctionnels

### Jalon E - V1 presentable

Fin du Lot 9 :
- produit testable et montrable

## Points d'attention pendant l'implementation

- ne pas coupler trop fort l'UI aux details SQLite
- conserver des types frontend propres
- ne pas rendre la gestion des dates trop complexe trop tot
- garder la logique de brouillon lisible
- ne pas surcharger la V1 avec des cas secondaires

## Conclusion

Le plan d'implementation V1 est maintenant structure pour permettre un developpement progressif, avec des points de verification clairs.

La meilleure suite est de commencer par :
- Lot 0 - Preparation technique
- puis Lot 1 - Base de donnees SQLite

Ce sont les deux lots qui vont poser les fondations du reste.
