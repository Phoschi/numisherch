import { useEffect, useMemo, useRef, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";

import "./App.css";
import { CoinEditor } from "./components/CoinEditor";
import { CoinList } from "./components/CoinList";
import { FilterSidebar } from "./components/FilterSidebar";
import {
  createCoin,
  createFilter,
  deleteCoin,
  deleteDraft,
  deleteFilter,
  getAppOverview,
  getCoinDraft,
  getCoins,
  getCreationDraft,
  getFilters,
  saveDraft,
  updateCoin,
} from "./services/backend";
import {
  coinToEditorState,
  createEmptyEditorState,
  draftToEditorState,
  isEditorStateEmpty,
  normalizeNullableString,
  type CoinEditorState,
} from "./lib/editor";
import type {
  AppOverview,
  CoinDraft,
  CoinRecord,
  CreateCoinInput,
  Filter,
  SaveDraftInput,
  UpdateCoinInput,
} from "./types/domain";

function App() {
  const [status, setStatus] = useState("Pret");
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [coins, setCoins] = useState<CoinRecord[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [creationDraft, setCreationDraft] = useState<CoinDraft | null>(null);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorState, setEditorState] = useState<CoinEditorState>(createEmptyEditorState());
  const [editorDraftId, setEditorDraftId] = useState<string | null>(null);
  const [editorHasRecoveredDraft, setEditorHasRecoveredDraft] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [savingCoin, setSavingCoin] = useState(false);
  const draftHydratedRef = useRef(false);

  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.id === selectedCoinId) ?? null,
    [coins, selectedCoinId],
  );

  const visibleCoins = useMemo(() => {
    if (!activeFilterId) {
      return coins;
    }

    return coins.filter((coin) => coin.filterIds.includes(activeFilterId));
  }, [activeFilterId, coins]);

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
      setCreationDraft(draftResponse);
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

  useEffect(() => {
    if (draftHydratedRef.current || !creationDraft || selectedCoinId !== null || editorMode !== "create") {
      return;
    }

    draftHydratedRef.current = true;
    const shouldRestore = window.confirm(
      "Un brouillon de creation a ete retrouve. Voulez-vous reprendre ce travail ?",
    );

    if (shouldRestore) {
      setEditorMode("create");
      setEditorState(draftToEditorState(creationDraft));
      setEditorDraftId(creationDraft.id);
      setEditorHasRecoveredDraft(true);
      setStatus("Brouillon de creation restaure.");
      return;
    }

    void deleteDraft(creationDraft.id)
      .then(async () => {
        setCreationDraft(null);
        setStatus("Brouillon de creation ignore.");
        await loadData();
      })
      .catch((error) => {
        console.error(error);
        setStatus(`Impossible de supprimer le brouillon ignore : ${String(error)}`);
      });
  }, [creationDraft, editorMode, selectedCoinId]);

  useEffect(() => {
    if (loadingData) {
      return;
    }

    if (editorMode === "edit" && !selectedCoin) {
      setEditorMode("create");
      setEditorState(createEmptyEditorState());
      setEditorDraftId(null);
      setEditorHasRecoveredDraft(false);
    }
  }, [editorMode, loadingData, selectedCoin]);

  useEffect(() => {
    if (loadingData || savingCoin) {
      return;
    }

    const hasContent = !isEditorStateEmpty(editorState);
    if (!hasContent) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const payload: SaveDraftInput = {
        id: editorDraftId ?? undefined,
        coinId: editorMode === "edit" ? selectedCoinId : null,
        mode: editorMode,
        title: normalizeNullableString(editorState.title),
        documentType: normalizeNullableString(editorState.documentType),
        subject: normalizeNullableString(editorState.subject),
        location: normalizeNullableString(editorState.location),
        reference: normalizeNullableString(editorState.reference),
        personalReference: normalizeNullableString(editorState.personalReference),
        note: normalizeNullableString(editorState.note),
        displayDate: normalizeNullableString(editorState.displayDate),
        revolutionaryDate: normalizeNullableString(editorState.revolutionaryDate),
        sortDate: normalizeNullableString(editorState.sortDate),
        sortDatePrecision: editorState.sortDatePrecision || null,
        selectedFilterIds: editorState.filterIds,
      };

      void saveDraft(payload)
        .then((draft) => {
          setEditorDraftId(draft.id);
          if (editorMode === "create") {
            setCreationDraft(draft);
          }
        })
        .catch((error) => {
          console.error(error);
          setStatus(`Erreur brouillon : ${String(error)}`);
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [editorDraftId, editorMode, editorState, loadingData, savingCoin, selectedCoinId]);

  async function handleUpdate() {
    try {
      setStatus("Verification des mises a jour...");

      const update = await check();

      if (!update) {
        setStatus("Aucune mise a jour disponible.");
        return;
      }

      setCurrentVersion(update.currentVersion);
      setStatus(`Mise a jour disponible : ${update.version}. Telechargement...`);

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setStatus(`Telechargement demarre (${event.data.contentLength ?? "taille inconnue"} octets)`);
            break;
          case "Progress":
            setStatus(`Telechargement : ${event.data.chunkLength} octets recus`);
            break;
          case "Finished":
            setStatus("Telechargement termine. Installation...");
            break;
        }
      });

      setStatus("Mise a jour installee. Redemarre l'application.");
    } catch (error) {
      console.error(error);
      setStatus(`Erreur pendant la mise a jour : ${String(error)}`);
    }
  }

  async function handleCreateFilter() {
    try {
      await createFilter({
        name: filterName,
        description: normalizeNullableString(filterDescription),
        color: null,
      });

      setFilterName("");
      setFilterDescription("");
      setStatus("Filtre cree.");
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus(`Erreur filtre : ${String(error)}`);
    }
  }

  async function handleDeleteFilter(filter: Filter) {
    const confirmed = window.confirm(`Voulez-vous vraiment supprimer le filtre "${filter.name}" ?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteFilter(filter.id);
      if (activeFilterId === filter.id) {
        setActiveFilterId(null);
      }
      setStatus("Filtre supprime.");
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus(`Erreur suppression filtre : ${String(error)}`);
    }
  }

  function handleCreateCoin() {
    setEditorMode("create");
    setSelectedCoinId(null);
    setEditorState(createEmptyEditorState());
    setEditorDraftId(null);
    setEditorHasRecoveredDraft(false);
    setStatus("Creation d'une nouvelle piece.");
  }

  async function handleSelectCoin(coin: CoinRecord) {
    try {
      const draft = await getCoinDraft(coin.id);
      setSelectedCoinId(coin.id);
      setEditorMode("edit");

      if (draft) {
        const shouldRestore = window.confirm(
          "Un brouillon d'edition a ete retrouve pour cette piece. Voulez-vous le reprendre ?",
        );

        if (shouldRestore) {
          setEditorState(draftToEditorState(draft));
          setEditorDraftId(draft.id);
          setEditorHasRecoveredDraft(true);
          setStatus("Brouillon d'edition restaure.");
          return;
        }
      }

      setEditorState(coinToEditorState(coin));
      setEditorDraftId(null);
      setEditorHasRecoveredDraft(false);
      setStatus(`Edition de "${coin.title}".`);
    } catch (error) {
      console.error(error);
      setStatus(`Erreur ouverture piece : ${String(error)}`);
    }
  }

  function updateEditorField<K extends keyof CoinEditorState>(field: K, value: CoinEditorState[K]) {
    setEditorState((current) => ({ ...current, [field]: value }));
  }

  function toggleEditorFilter(filterId: string) {
    setEditorState((current) => {
      const alreadySelected = current.filterIds.includes(filterId);

      return {
        ...current,
        filterIds: alreadySelected
          ? current.filterIds.filter((currentFilterId) => currentFilterId !== filterId)
          : [...current.filterIds, filterId],
      };
    });
  }

  async function handleSaveCoin() {
    if (editorState.title.trim() === "") {
      setStatus("Le titre est obligatoire.");
      return;
    }

    setSavingCoin(true);
    try {
      const payload: CreateCoinInput | UpdateCoinInput = {
        title: editorState.title.trim(),
        documentType: normalizeNullableString(editorState.documentType),
        subject: normalizeNullableString(editorState.subject),
        location: normalizeNullableString(editorState.location),
        reference: normalizeNullableString(editorState.reference),
        personalReference: normalizeNullableString(editorState.personalReference),
        note: normalizeNullableString(editorState.note),
        displayDate: normalizeNullableString(editorState.displayDate),
        revolutionaryDate: normalizeNullableString(editorState.revolutionaryDate),
        sortDate: normalizeNullableString(editorState.sortDate),
        sortDatePrecision: editorState.sortDatePrecision || null,
        filterIds: editorState.filterIds,
      };

      let savedCoinId: string;
      if (editorMode === "edit" && selectedCoinId) {
        const updated = await updateCoin(selectedCoinId, payload);
        savedCoinId = updated.id;
        setStatus("Piece mise a jour.");
      } else {
        const created = await createCoin(payload);
        savedCoinId = created.id;
        setStatus("Piece creee.");
      }

      if (editorDraftId) {
        await deleteDraft(editorDraftId);
      }

      setEditorDraftId(null);
      setEditorHasRecoveredDraft(false);
      setCreationDraft(null);
      await loadData();

      const refreshedCoin = await getCoins();
      const coinToOpen = refreshedCoin.find((coin) => coin.id === savedCoinId) ?? null;
      setCoins(refreshedCoin);
      if (coinToOpen) {
        setSelectedCoinId(coinToOpen.id);
        setEditorMode("edit");
        setEditorState(coinToEditorState(coinToOpen));
      } else {
        handleCreateCoin();
      }
    } catch (error) {
      console.error(error);
      setStatus(`Erreur enregistrement piece : ${String(error)}`);
    } finally {
      setSavingCoin(false);
    }
  }

  async function handleDeleteCoin() {
    if (!selectedCoinId || editorMode !== "edit") {
      return;
    }

    const confirmed = window.confirm("Voulez-vous vraiment supprimer cette piece ?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteCoin(selectedCoinId);
      if (editorDraftId) {
        await deleteDraft(editorDraftId).catch(() => undefined);
      }
      setStatus("Piece supprimee.");
      setSelectedCoinId(null);
      setEditorMode("create");
      setEditorState(createEmptyEditorState());
      setEditorDraftId(null);
      setEditorHasRecoveredDraft(false);
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus(`Erreur suppression piece : ${String(error)}`);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar panel">
        <div>
          <p className="eyebrow">Numisherch</p>
          <h1>Collection et recherche numismatique</h1>
          <p className="hero-copy">
            Base locale de pieces, filtres libres, tri chronologique et brouillons d'edition.
          </p>
        </div>

        <div className="topbar-side">
          <div className="status-chip">
            <span>Pieces</span>
            <strong>{overview?.coinCount ?? 0}</strong>
          </div>
          <div className="status-chip">
            <span>Filtres</span>
            <strong>{overview?.filterCount ?? 0}</strong>
          </div>
          <button className="secondary-button" onClick={handleUpdate}>
            Recevoir une mise a jour
          </button>
        </div>
      </header>

      {dataError && <p className="error-banner">{dataError}</p>}

      <section className="workspace">
        <FilterSidebar
          filters={filters}
          activeFilterId={activeFilterId}
          filterName={filterName}
          filterDescription={filterDescription}
          loading={loadingData}
          onFilterSelect={setActiveFilterId}
          onFilterNameChange={setFilterName}
          onFilterDescriptionChange={setFilterDescription}
          onCreateFilter={handleCreateFilter}
          onDeleteFilter={handleDeleteFilter}
        />

        <CoinList
          coins={visibleCoins}
          selectedCoinId={selectedCoinId}
          activeFilterId={activeFilterId}
          filters={filters}
          loading={loadingData}
          onCreateCoin={handleCreateCoin}
          onSelectCoin={(coin) => void handleSelectCoin(coin)}
        />

        <CoinEditor
          mode={editorMode}
          editorState={editorState}
          filters={filters}
          saving={savingCoin}
          hasRecoveredDraft={editorHasRecoveredDraft}
          onChange={updateEditorField}
          onToggleFilter={toggleEditorFilter}
          onSave={() => void handleSaveCoin()}
          onDelete={() => void handleDeleteCoin()}
        />
      </section>

      <footer className="footer-note">
        <p>{status}</p>
        {currentVersion && <p>Version actuelle detectee : {currentVersion}</p>}
        {overview && <p>Base SQLite : {overview.databasePath}</p>}
      </footer>
    </main>
  );
}

export default App;
