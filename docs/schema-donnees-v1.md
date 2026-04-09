# Numisherch - Schema de donnees V1

## Objectif

Definir une premiere structure de donnees exploitable pour l'application Numisherch.

Cette V1 est pensee pour :
- une application desktop Tauri
- un stockage local SQLite
- une utilisation personnelle
- une gestion souple de fiches de pieces de monnaie
- une sauvegarde manuelle avec gestion de brouillons

## Principes de conception

Le schema doit rester :
- simple a implementer
- souple pour des informations heterogenes
- robuste pour le tri, le filtrage et l'evolution future

Choix structurants :
- une `piece` est l'entite principale
- les `filtres` sont libres et geres par l'utilisateur
- la date doit rester flexible
- le brouillon est une entite a part

## Vue d'ensemble

Entites principales V1 :
- `coins`
- `filters`
- `coin_filters`
- `coin_drafts`

Entites possibles plus tard :
- `attachments`
- `saved_exports`
- `settings`
- `search_history`

## Entite `coins`

Represente une piece de monnaie enregistree dans la collection.

### Champs proposes

- `id`
  - type : `TEXT`
  - role : identifiant unique de la piece
  - exemple : UUID

- `title`
  - type : `TEXT`
  - role : nom principal de la fiche
  - obligatoire : oui

- `document_type`
  - type : `TEXT`
  - role : type de document / type d'entree, si conserve dans le vocabulaire initial
  - obligatoire : non

- `subject`
  - type : `TEXT`
  - role : sujet ou designation courte
  - obligatoire : non

- `location`
  - type : `TEXT`
  - role : localisation de la piece, du lieu de decouverte, du depot ou du classement selon l'usage choisi
  - obligatoire : non

- `reference`
  - type : `TEXT`
  - role : reference externe
  - obligatoire : non

- `personal_reference`
  - type : `TEXT`
  - role : reference perso du collectionneur
  - obligatoire : non

- `note`
  - type : `TEXT`
  - role : note libre sur la piece
  - obligatoire : non

- `display_date`
  - type : `TEXT`
  - role : date lisible affichee a l'utilisateur
  - obligatoire : non
  - exemple : `1792`, `vers 1793`, `an II`

- `revolutionary_date`
  - type : `TEXT`
  - role : saisie libre de la date revolutionnaire
  - obligatoire : non

- `sort_date`
  - type : `TEXT`
  - role : date technique utilisable pour le tri
  - obligatoire : non
  - format recommande : ISO partiel ou complet si possible, ex. `1792-01-01`

- `sort_date_precision`
  - type : `TEXT`
  - role : niveau de precision de `sort_date`
  - obligatoire : non
  - valeurs possibles : `year`, `month`, `day`, `unknown`

- `is_draft_promoted`
  - type : `INTEGER`
  - role : indique si la piece provient d'un brouillon valide
  - obligatoire : oui
  - valeurs : `0` ou `1`

- `created_at`
  - type : `TEXT`
  - role : date de creation technique
  - obligatoire : oui
  - format : ISO datetime

- `updated_at`
  - type : `TEXT`
  - role : date de derniere modification
  - obligatoire : oui
  - format : ISO datetime

### Champs obligatoires V1

Minimum recommande :
- `id`
- `title`
- `created_at`
- `updated_at`

Le reste peut rester facultatif pour ne pas bloquer la saisie.

## Entite `filters`

Represente un filtre libre cree par l'utilisateur.

### Champs proposes

- `id`
  - type : `TEXT`
  - role : identifiant unique

- `name`
  - type : `TEXT`
  - role : nom du filtre
  - obligatoire : oui

- `description`
  - type : `TEXT`
  - role : aide ou commentaire optionnel
  - obligatoire : non

- `color`
  - type : `TEXT`
  - role : reserve pour evolution future si on veut des filtres visuels
  - obligatoire : non

- `sort_order`
  - type : `INTEGER`
  - role : ordre d'affichage dans la colonne de gauche
  - obligatoire : oui

- `created_at`
  - type : `TEXT`
  - role : date de creation
  - obligatoire : oui

- `updated_at`
  - type : `TEXT`
  - role : date de derniere modification
  - obligatoire : oui

### Contraintes recommandees

- `name` unique
- index sur `sort_order`

## Entite `coin_filters`

Table de liaison many-to-many entre les pieces et les filtres.

### Champs proposes

- `coin_id`
  - type : `TEXT`
  - role : reference vers `coins.id`

- `filter_id`
  - type : `TEXT`
  - role : reference vers `filters.id`

- `created_at`
  - type : `TEXT`
  - role : date d'association

### Contraintes recommandees

- cle primaire composite : (`coin_id`, `filter_id`)
- suppression en cascade si une piece ou un filtre disparait

## Entite `coin_drafts`

Represente un brouillon de creation ou d'edition.

Le brouillon permet :
- de conserver une piece non encore enregistree
- de reprendre une edition en cours
- de proteger l'utilisateur contre une fermeture accidentelle

### Champs proposes

- `id`
  - type : `TEXT`
  - role : identifiant du brouillon

- `coin_id`
  - type : `TEXT`
  - role : reference vers `coins.id` si le brouillon concerne une piece existante
  - obligatoire : non

- `mode`
  - type : `TEXT`
  - role : type de brouillon
  - obligatoire : oui
  - valeurs proposees : `create`, `edit`

- `title`
  - type : `TEXT`
- `document_type`
  - type : `TEXT`
- `subject`
  - type : `TEXT`
- `location`
  - type : `TEXT`
- `reference`
  - type : `TEXT`
- `personal_reference`
  - type : `TEXT`
- `note`
  - type : `TEXT`
- `display_date`
  - type : `TEXT`
- `revolutionary_date`
  - type : `TEXT`
- `sort_date`
  - type : `TEXT`
- `sort_date_precision`
  - type : `TEXT`

- `selected_filter_ids`
  - type : `TEXT`
  - role : snapshot des filtres selectionnes
  - format simple recommande : JSON string

- `created_at`
  - type : `TEXT`

- `updated_at`
  - type : `TEXT`

### Strategie recommandee V1

- un brouillon actif maximum par contexte d'edition
- si creation : `coin_id = NULL`
- si edition : `coin_id` pointe vers la piece existante
- suppression du brouillon apres enregistrement final

## Strategie date V1

Le sujet des dates est sensible. Pour une V1 souple et exploitable, voici la meilleure approche.

### Champs retenus

- `display_date`
  - ce que l'utilisateur veut voir

- `revolutionary_date`
  - valeur libre ou semi-libre pour la date revolutionnaire

- `sort_date`
  - date technique de tri quand elle est connue

- `sort_date_precision`
  - niveau de precision

### Avantages

- l'utilisateur n'est pas bloque par un format rigide
- le tri reste possible quand l'information est disponible
- on peut faire evoluer la gestion de date plus tard sans casser le schema

### Comportement recommande

- si `sort_date` existe, trier dessus
- sinon classer la piece apres les dates connues, ou dans un groupe `date inconnue`

## Contraintes et index recommandes

### Table `coins`

Index utiles :
- index sur `title`
- index sur `sort_date`
- index sur `updated_at`

### Table `filters`

Index utiles :
- index unique sur `name`
- index sur `sort_order`

### Table `coin_filters`

Index utiles :
- index sur `filter_id`
- index sur `coin_id`

### Table `coin_drafts`

Index utiles :
- index sur `coin_id`
- index sur `updated_at`

## Schema relationnel simplifie

```text
coins
  id PK
  ...

filters
  id PK
  ...

coin_filters
  coin_id FK -> coins.id
  filter_id FK -> filters.id

coin_drafts
  id PK
  coin_id FK -> coins.id nullable
  ...
```

## SQL indicatif V1

```sql
CREATE TABLE coins (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  document_type TEXT,
  subject TEXT,
  location TEXT,
  reference TEXT,
  personal_reference TEXT,
  note TEXT,
  display_date TEXT,
  revolutionary_date TEXT,
  sort_date TEXT,
  sort_date_precision TEXT,
  is_draft_promoted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE filters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE coin_filters (
  coin_id TEXT NOT NULL,
  filter_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (coin_id, filter_id),
  FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE,
  FOREIGN KEY (filter_id) REFERENCES filters(id) ON DELETE CASCADE
);

CREATE TABLE coin_drafts (
  id TEXT PRIMARY KEY,
  coin_id TEXT,
  mode TEXT NOT NULL,
  title TEXT,
  document_type TEXT,
  subject TEXT,
  location TEXT,
  reference TEXT,
  personal_reference TEXT,
  note TEXT,
  display_date TEXT,
  revolutionary_date TEXT,
  sort_date TEXT,
  sort_date_precision TEXT,
  selected_filter_ids TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE
);

CREATE INDEX idx_coins_title ON coins(title);
CREATE INDEX idx_coins_sort_date ON coins(sort_date);
CREATE INDEX idx_coins_updated_at ON coins(updated_at);

CREATE INDEX idx_filters_sort_order ON filters(sort_order);

CREATE INDEX idx_coin_filters_coin_id ON coin_filters(coin_id);
CREATE INDEX idx_coin_filters_filter_id ON coin_filters(filter_id);

CREATE INDEX idx_coin_drafts_coin_id ON coin_drafts(coin_id);
CREATE INDEX idx_coin_drafts_updated_at ON coin_drafts(updated_at);
```

## Objets TypeScript recommandes

```ts
export type SortDatePrecision = "year" | "month" | "day" | "unknown";

export type Coin = {
  id: string;
  title: string;
  documentType: string | null;
  subject: string | null;
  location: string | null;
  reference: string | null;
  personalReference: string | null;
  note: string | null;
  displayDate: string | null;
  revolutionaryDate: string | null;
  sortDate: string | null;
  sortDatePrecision: SortDatePrecision | null;
  isDraftPromoted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Filter = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CoinDraft = {
  id: string;
  coinId: string | null;
  mode: "create" | "edit";
  title: string | null;
  documentType: string | null;
  subject: string | null;
  location: string | null;
  reference: string | null;
  personalReference: string | null;
  note: string | null;
  displayDate: string | null;
  revolutionaryDate: string | null;
  sortDate: string | null;
  sortDatePrecision: SortDatePrecision | null;
  selectedFilterIds: string[];
  createdAt: string;
  updatedAt: string;
};
```

## Decisions recommandees pour la V1

- minimum obligatoire sur une piece : `title`
- filtres libres, sans hierarchie
- tri principal sur `sort_date`
- brouillons separes des donnees definitives
- schema prepare pour grandir, sans sur-ingenierie

## Evolutions naturelles du schema

### V1.1

- ajout de `settings`
- ajout d'un ordre d'affichage personnalise
- ajout d'un brouillon restaure automatiquement

### V2

- ajout d'images de pieces
- ajout de pieces jointes
- ajout de champs personalisables
- ajout de recherche plein texte
- ajout de comparaison structuree

## Conclusion

Ce schema V1 est volontairement simple, mais suffisamment propre pour :
- lancer le produit
- stocker les pieces de maniere fiable
- filtrer et trier
- gerer les brouillons
- faire evoluer l'outil ensuite sans refonte totale
