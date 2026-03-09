import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";

function App() {
 const [status, setStatus] = useState("Prêt");
 const [currentVersion, setCurrentVersion] = useState<string | null>(null);

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

 return (
   <main
     style={{
       minHeight: "100vh",
       background: "#eee6d8",
       color: "#000000",
       padding: "2rem",
       fontFamily: "Arial, sans-serif",
     }}
   >
     <h1>Numisherch Je peux récup les maj</h1>
     <p>Socle technique de l'application</p>
     <button
       onClick={handleUpdate}
       style={{
         background: "#D9C7A7",
         color: "#000000",
         border: "1px solid #000000",
         padding: "0.75rem 1rem",
         cursor: "pointer",
       }}
     >
       Recevoir une mise à jour
     </button>

     <p style={{ marginTop: "1rem" }}>{status}</p>
     {currentVersion && <p>Version actuelle détectée : {currentVersion}</p>}
   </main>
 );
}

export default App;
