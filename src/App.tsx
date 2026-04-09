import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";

import "./App.css";
import {
  createCoin,
  createFilter,
  getAppOverview,
  getCoins,
  getCreationDraft,
  getFilters,
} from "./services/backend";
import type { AppOverview, CoinRecord, Filter } from "./types/domain";

function App() {
 const [status, setStatus] = useState("Prêt");
 const [currentVersion, setCurrentVersion] = useState<string | null>(null);
 const [overview, setOverview] = useState<AppOverview | null>(null);
 const [coins, setCoins] = useState<CoinRecord[]>([]);
 const [filters, setFilters] = useState<Filter[]>([]);
 const [draftDetected, setDraftDetected] = useState(false);
 const [dataError, setDataError] = useState<string | null>(null);
 const [loadingData, setLoadingData] = useState(true);

 async function loadData() {
   try {
     setLoadingData(true);
     setDataError(null);

     const [overviewResponse, coinsResponse, filtersResponse, draftResponse] = await Promise.all([
       getAppOverview(),
       getCoins(),
       getFilters(),
       getCreationDraft(),
     ]);

     setOverview(overviewResponse);
     setCoins(coinsResponse);
     setFilters(filtersResponse);
     setDraftDetected(Boolean(draftResponse));
   } catch (error) {
     console.error(error);
     setDataError(`Erreur de chargement des donnees : ${String(error)}`);
   } finally {
     setLoadingData(false);
   }
 }

 useEffect(() => {
   void loadData();
 }, []);

 async function handleUpdate() {
   try {
     setStatus("Vérification des mises à jour...");

     const update = await check();

     if (!update) {
       setStatus("Aucune mise à jour disponible.");
       return;
     }

     setCurrentVersion(update.currentVersion);
     setStatus(`Mise à jour disponible : ${update.version}. Téléchargement...`);

     await update.downloadAndInstall((event) => {
       switch (event.event) {
         case "Started":
           setStatus(`Téléchargement démarré (${event.data.contentLength ?? "taille inconnue"} octets)`);
           break;
         case "Progress":
           setStatus(`Téléchargement : ${event.data.chunkLength} octets reçus`);
           break;
         case "Finished":
           setStatus("Téléchargement terminé. Installation...");
           break;
       }
     });

     setStatus("Mise à jour installée. Redémarre l'application.");
   } catch (error) {
     console.error(error);
     setStatus(`Erreur pendant la mise à jour : ${String(error)}`);
   }
 }

 async function handleCreateSampleFilter() {
   try {
     await createFilter({
       name: `Atelier ${filters.length + 1}`,
       description: "Filtre de test",
       color: null,
     });
     setStatus("Filtre de test créé.");
     await loadData();
   } catch (error) {
     console.error(error);
     setStatus(`Erreur filtre : ${String(error)}`);
   }
 }

 async function handleCreateSampleCoin() {
   try {
     await createCoin({
       title: `Piece test ${coins.length + 1}`,
       documentType: "Piece",
       subject: "Fondation technique",
       location: "Collection personnelle",
       reference: null,
       personalReference: `TEST-${coins.length + 1}`,
       note: "Creee pour valider le socle SQLite et les commandes Tauri.",
       displayDate: "1792",
       revolutionaryDate: "an I",
       sortDate: "1792-01-01",
       sortDatePrecision: "year",
       filterIds: filters[0] ? [filters[0].id] : [],
     });
     setStatus("Pièce de test créée.");
     await loadData();
   } catch (error) {
     console.error(error);
     setStatus(`Erreur piece : ${String(error)}`);
   }
 }

 return (
   <main className="app-shell">
     <section className="hero">
       <div>
         <p className="eyebrow">Numisherch</p>
         <h1>Socle SQLite et commandes Tauri en place</h1>
         <p className="hero-copy">
           Cette etape pose les fondations de l'application : base locale SQLite,
           CRUD backend, types frontend et verification du branchement.
         </p>
       </div>

       <div className="hero-actions">
         <button className="primary-button" onClick={handleCreateSampleFilter}>
           Creer un filtre test
         </button>
         <button className="primary-button" onClick={handleCreateSampleCoin}>
           Creer une piece test
         </button>
         <button className="secondary-button" onClick={() => void loadData()}>
           Recharger les donnees
         </button>
         <button className="secondary-button" onClick={handleUpdate}>
           Recevoir une mise a jour
         </button>
       </div>
     </section>

     <section className="status-grid">
       <article className="status-card">
         <span className="status-label">Statut</span>
         <p>{status}</p>
         {currentVersion && <p>Version actuelle detectee : {currentVersion}</p>}
       </article>
       <article className="status-card">
         <span className="status-label">Base locale</span>
         {loadingData && <p>Chargement...</p>}
         {!loadingData && overview && (
           <>
             <p>{overview.coinCount} piece(s)</p>
             <p>{overview.filterCount} filtre(s)</p>
             <p>{overview.draftCount} brouillon(s)</p>
           </>
         )}
       </article>
       <article className="status-card">
         <span className="status-label">Brouillons</span>
         <p>{draftDetected ? "Un brouillon de creation est present." : "Aucun brouillon detecte."}</p>
       </article>
     </section>

     {dataError && <p className="error-banner">{dataError}</p>}

     <section className="debug-grid">
       <article className="panel">
         <div className="panel-header">
           <h2>Filtres</h2>
           <span>{filters.length}</span>
         </div>
         {filters.length === 0 ? (
           <p className="empty-state">Aucun filtre pour le moment.</p>
         ) : (
           <ul className="stack-list">
             {filters.map((filter) => (
               <li key={filter.id} className="stack-item">
                 <strong>{filter.name}</strong>
                 <span>{filter.description ?? "Sans description"}</span>
               </li>
             ))}
           </ul>
         )}
       </article>

       <article className="panel">
         <div className="panel-header">
           <h2>Pieces</h2>
           <span>{coins.length}</span>
         </div>
         {coins.length === 0 ? (
           <p className="empty-state">Aucune piece enregistree pour le moment.</p>
         ) : (
           <ul className="stack-list">
             {coins.map((coin) => (
               <li key={coin.id} className="stack-item">
                 <strong>{coin.title}</strong>
                 <span>{coin.displayDate ?? "Date libre non renseignee"}</span>
                 <span>{coin.personalReference ?? "Sans reference perso"}</span>
               </li>
             ))}
           </ul>
         )}
       </article>
     </section>

     {overview && <p className="db-path">Base SQLite : {overview.databasePath}</p>}
   </main>
 );
}

export default App;
