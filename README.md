# Numisherch

Application desktop construite avec `Tauri + React + TypeScript`.

Le projet est déjà configure pour :
- lancer l'app en local
- produire un build desktop
- publier une release GitHub Windows et Linux
- distribuer les mises a jour via le plugin Tauri Updater

## Prerequis

Installer avant de commencer :
- `Node.js` + `npm`
- `Rust` + `cargo`

Docs utiles :
- Tauri prerequisites : https://v2.tauri.app/start/prerequisites/

### Linux

Sur Linux, Tauri a besoin de dependances systeme en plus.

Ubuntu / Debian :

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

Arch / CachyOS :

```bash
sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl libayatana-appindicator librsvg
```

## Installation

```bash
npm install
```

## Commandes utiles

Lancer le front web seul :

```bash
npm run dev
```

Lancer l'application desktop Tauri :

```bash
npm run tauri dev
```

Verifier que le front compile :

```bash
npm run build
```

Produire l'application desktop :

```bash
npm run tauri build
```

## Plateformes supportees

- Windows : supporte
- Linux : supporte si les dependances systeme Tauri sont installees

## Workflow rapide

Pour reprendre le projet rapidement :

```bash
npm install
npm run tauri dev
```

## Releases et mises a jour

Le projet publie les releases via GitHub Actions sur les tags `v*`.

Workflow actuel :
1. mettre a jour la version du projet
2. commit les changements
3. creer un tag Git
4. pousser la branche et le tag
5. GitHub Actions build l'application et publie la release
6. l'updater Tauri s'appuie ensuite sur cette release

Commandes :

```bash
git add .
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push
git push origin vX.Y.Z
```

## Fichiers de version a garder alignes

Avant de creer une release, verifier que la version est la meme dans :
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

## CI/CD

La publication est definie dans :
- `.github/workflows/release.yml`

Le workflow build maintenant :
- Windows
- Linux (`ubuntu-22.04`)

Le workflow se declenche a chaque push d'un tag au format :

```bash
vX.Y.Z
```

## Updater Tauri

La configuration de mise a jour est dans :
- `src-tauri/tauri.conf.json`

Endpoint actuel :

```text
https://github.com/Phoschi/numisherch/releases/latest/download/latest.json
```

Cela signifie qu'une release valide doit generer les artefacts Tauri attendus pour que l'application puisse detecter et installer une mise a jour.

## A savoir

- `npm run dev` lance seulement Vite
- `npm run tauri dev` lance la vraie app desktop
- `npm run tauri build` produit le package installable
- sur Linux, il faut installer les bibliotheques systeme avant `npm run tauri dev`
- la publication automatique depend des secrets GitHub utilises par le workflow, notamment la cle de signature Tauri

## Checklist release

Avant de pousser un tag :
- verifier la meme version dans `package.json`, `src-tauri/tauri.conf.json` et `src-tauri/Cargo.toml`
- verifier que `npm run build` passe
- verifier que `npm run tauri dev` demarre sans erreur
- creer un tag de la meme version que l'application
