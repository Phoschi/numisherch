import { useEffect, useMemo, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";

import "./App.css";
import { CoinEditor } from "./components/CoinEditor";
import { CoinList } from "./components/CoinList";
import { DraftsView } from "./components/DraftsView";
import { FilterManager } from "./components/FilterManager";
import { TabNav, type AppTab } from "./components/TabNav";
import {
  createCoin,
  createFilter,
  deleteCoin,
  deleteDraft,
  deleteFilter,
  getAppOverview,
  getCoins,
  getDrafts,
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
  const [activeTab, setActiveTab] = useState<AppTab>("pieces");
  const [status, setStatus] = useState("Pret");
  const [appVersion, setAppVersion] = useState<string>("...");
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [coins, setCoins] = useState<CoinRecord[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [drafts, setDrafts] = useState<CoinDraft[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorState, setEditorState] = useState<CoinEditorState>(createEmptyEditorState());
  const [editorBaseline, setEditorBaseline] = useState<CoinEditorState>(createEmptyEditorState());
  const [editorDraftId, setEditorDraftId] = useState<string | null>(null);
  const [editorHasRecoveredDraft, setEditorHasRecoveredDraft] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedMessage, setLastSavedMessage] = useState("Aucune modification en cours.");
  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [savingCoin, setSavingCoin] = useState(false);

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

  const editorIsDirty = useMemo(
    () => JSON.stringify(editorState) !== JSON.stringify(editorBaseline),
    [editorBaseline, editorState],
  );

  const creationDraft = useMemo(
    () => drafts.find((draft) => draft.mode === "create") ?? null,
    [drafts],
  );

  const selectedCoinDraft = useMemo(() => {
    if (!selectedCoinId) {
      return null;
    }

    return drafts.find((draft) => draft.mode === "edit" && draft.coinId === selectedCoinId) ?? null;
  }, [drafts, selectedCoinId]);

  async function loadData() {
    try {
      setLoadingData(true);
      setDataError(null);

      const [overviewResponse, coinsResponse, filtersResponse, draftsResponse] = await Promise.all([
        getAppOverview(),
        getCoins(),
        getFilters(),
        getDrafts(),
      ]);

      setOverview(overviewResponse);
      setCoins(coinsResponse);
      setFilters(filtersResponse);
      setDrafts(draftsResponse);
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
    void getVersion()
      .then((version) => {
        setAppVersion(version);
        setCurrentVersion(version);
      })
      .catch((error) => {
        console.error(error);
        setAppVersion("inconnue");
      });
  }, []);

  useEffect(() => {
    if (loadingData || savingCoin || !editorDialogOpen || !editorIsDirty || isEditorStateEmpty(editorState)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setDraftSaveState("saving");
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
          setDraftSaveState("saved");
          setLastSavedMessage("Brouillon local mis a jour.");
          setDrafts((current) => {
            const next = current.filter((item) => item.id !== draft.id);
            return [draft, ...next];
          });
        })
        .catch((error) => {
          console.error(error);
          setDraftSaveState("error");
          setLastSavedMessage("Le brouillon n'a pas pu etre enregistre.");
          setStatus(`Erreur brouillon : ${String(error)}`);
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [editorDialogOpen, editorDraftId, editorIsDirty, editorMode, editorState, loadingData, savingCoin, selectedCoinId]);

  async function handleUpdate() {
    try {
      setStatus("Verification des mises a jour...");
      setAvailableVersion(null);

      const update = await check();

      if (!update) {
        setStatus("Aucune mise a jour disponible.");
        setCurrentVersion(appVersion);
        return;
      }

      setCurrentVersion(update.currentVersion);
      setAvailableVersion(update.version);
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

  function resetEditorForCreate() {
    const emptyState = createEmptyEditorState();
    setEditorMode("create");
    setSelectedCoinId(null);
    setEditorState(emptyState);
    setEditorBaseline(emptyState);
    setEditorDraftId(null);
    setEditorHasRecoveredDraft(false);
    setDraftSaveState("idle");
    setLastSavedMessage("Nouvelle fiche prete.");
  }

  function closeEditorDialog() {
    setEditorDialogOpen(false);
    setEditorHasRecoveredDraft(false);
    setDraftSaveState("idle");
  }

  function handleCreateCoin() {
    setActiveTab("pieces");
    resetEditorForCreate();
    setEditorDialogOpen(true);
    setStatus("Creation d'une nouvelle piece.");
  }

  function handleSelectCoin(coin: CoinRecord) {
    const baseline = coinToEditorState(coin);
    setActiveTab("pieces");
    setSelectedCoinId(coin.id);
    setEditorMode("edit");
    setEditorState(baseline);
    setEditorBaseline(baseline);
    setEditorDraftId(null);
    setEditorHasRecoveredDraft(false);
    setDraftSaveState("idle");
    setLastSavedMessage("Version enregistree chargee.");
    setEditorDialogOpen(true);
    setStatus(`Edition de "${coin.title}".`);
  }

  function restoreDraft(draft: CoinDraft) {
    setActiveTab("pieces");

    if (draft.mode === "create") {
      const state = draftToEditorState(draft);
      setEditorMode("create");
      setSelectedCoinId(null);
      setEditorState(state);
      setEditorBaseline(createEmptyEditorState());
      setEditorDraftId(draft.id);
      setEditorHasRecoveredDraft(true);
      setDraftSaveState("saved");
      setLastSavedMessage("Brouillon de creation recharge.");
      setEditorDialogOpen(true);
      setStatus("Brouillon de creation charge.");
      return;
    }

    const linkedCoin = coins.find((coin) => coin.id === draft.coinId) ?? null;
    const baseline = linkedCoin ? coinToEditorState(linkedCoin) : createEmptyEditorState();
    setSelectedCoinId(draft.coinId);
    setEditorMode("edit");
    setEditorState(draftToEditorState(draft));
    setEditorBaseline(baseline);
    setEditorDraftId(draft.id);
    setEditorHasRecoveredDraft(true);
    setDraftSaveState("saved");
    setLastSavedMessage("Brouillon d'edition recharge.");
    setEditorDialogOpen(true);
    setStatus("Brouillon d'edition charge.");
  }

  async function handleDeleteDraft(draft: CoinDraft) {
    const confirmed = window.confirm("Voulez-vous vraiment supprimer ce brouillon ?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteDraft(draft.id);
      setDrafts((current) => current.filter((item) => item.id !== draft.id));

      if (editorDraftId === draft.id) {
        setEditorDraftId(null);
        setEditorHasRecoveredDraft(false);
        setDraftSaveState("idle");
        setLastSavedMessage("Brouillon supprime.");
      }

      setStatus("Brouillon supprime.");
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus(`Erreur suppression brouillon : ${String(error)}`);
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

  function buildCoinPayload(): CreateCoinInput | UpdateCoinInput {
    return {
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
  }

  async function persistDraftNow() {
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

    setDraftSaveState("saving");
    const draft = await saveDraft(payload);
    setEditorDraftId(draft.id);
    setDraftSaveState("saved");
    setLastSavedMessage("Brouillon local mis a jour.");
    setDrafts((current) => {
      const next = current.filter((item) => item.id !== draft.id);
      return [draft, ...next];
    });
    return draft;
  }

  async function requestCloseEditor() {
    if (savingCoin) {
      return;
    }

    const hasContent = !isEditorStateEmpty(editorState);

    if (!editorIsDirty) {
      closeEditorDialog();
      return;
    }

    if (!hasContent) {
      closeEditorDialog();
      return;
    }

    const shouldSaveAsDraft = window.confirm("Voulez-vous l'enregistrer en tant que brouillon ?");

    if (shouldSaveAsDraft) {
      try {
        await persistDraftNow();
        closeEditorDialog();
        setStatus("Brouillon enregistre. Tu peux le reprendre depuis l'onglet Brouillons.");
      } catch (error) {
        console.error(error);
        setDraftSaveState("error");
        setStatus(`Erreur brouillon : ${String(error)}`);
      }
      return;
    }

    if (editorDraftId) {
      await deleteDraft(editorDraftId).catch(() => undefined);
      setDrafts((current) => current.filter((draft) => draft.id !== editorDraftId));
    }

    resetEditorForCreate();
    closeEditorDialog();
    setStatus("Modifications ignorees.");
  }

  async function handleSaveCoin() {
    if (editorState.title.trim() === "") {
      setStatus("Le titre est obligatoire.");
      return;
    }

    setSavingCoin(true);
    try {
      const payload = buildCoinPayload();

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
        await deleteDraft(editorDraftId).catch(() => undefined);
      }

      setEditorDraftId(null);
      setEditorHasRecoveredDraft(false);
      setDraftSaveState("idle");
      setLastSavedMessage("Piece enregistree localement.");
      await loadData();
      const refreshedCoins = await getCoins();
      const coinToOpen = refreshedCoins.find((coin) => coin.id === savedCoinId) ?? null;
      setCoins(refreshedCoins);
      if (coinToOpen) {
        const baseline = coinToEditorState(coinToOpen);
        setSelectedCoinId(coinToOpen.id);
        setEditorMode("edit");
        setEditorState(baseline);
        setEditorBaseline(baseline);
      }
      closeEditorDialog();
      setActiveTab("pieces");
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

      resetEditorForCreate();
      closeEditorDialog();
      setStatus("Piece supprimee.");
      await loadData();
    } catch (error) {
      console.error(error);
      setStatus(`Erreur suppression piece : ${String(error)}`);
    }
  }

  const creationDraftNotice =
    editorMode === "create" && creationDraft && editorDraftId !== creationDraft.id
      ? "Un brouillon de creation existe deja dans l'onglet Brouillons."
      : null;

  const selectedDraftNotice =
    editorMode === "edit" &&
    selectedCoinDraft &&
    editorDraftId !== selectedCoinDraft.id &&
    selectedCoinDraft.coinId === selectedCoinId
      ? "Un brouillon d'edition existe pour cette piece. Tu peux le reprendre depuis l'onglet Brouillons."
      : null;

  const filterChips = (
    <div className="filter-chip-bar">
      <button
        className={`filter-chip filter-chip-uniform ${activeFilterId === null ? "filter-chip-active" : ""}`}
        onClick={() => setActiveFilterId(null)}
      >
        Toutes les pieces
      </button>
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`filter-chip filter-chip-uniform ${activeFilterId === filter.id ? "filter-chip-active" : ""}`}
          onClick={() => setActiveFilterId((current) => (current === filter.id ? null : filter.id))}
        >
          <strong>{filter.name}</strong>
          <span>{filter.description ?? "Sans description"}</span>
        </button>
      ))}
    </div>
  );

  async function handleAssignSelectedCoinsToFilter(coinIds: string[], targetFilterId: string) {
    if (coinIds.length === 0 || targetFilterId === "") {
      return;
    }

    try {
      await Promise.all(
        coinIds.map(async (coinId) => {
          const coin = coins.find((item) => item.id === coinId);
          if (!coin) {
            return;
          }

          const nextFilterIds = Array.from(new Set([...coin.filterIds, targetFilterId]));
          await updateCoin(coin.id, {
            title: coin.title,
            documentType: coin.documentType,
            subject: coin.subject,
            location: coin.location,
            reference: coin.reference,
            personalReference: coin.personalReference,
            note: coin.note,
            displayDate: coin.displayDate,
            revolutionaryDate: coin.revolutionaryDate,
            sortDate: coin.sortDate,
            sortDatePrecision: coin.sortDatePrecision,
            filterIds: nextFilterIds,
          });
        }),
      );

      await loadData();
      setStatus("Selection associee au filtre choisi.");
    } catch (error) {
      console.error(error);
      setStatus(`Erreur association filtre : ${String(error)}`);
    }
  }

  async function handleRemoveCoinFromFilter(coinId: string, filterId: string) {
    try {
      const coin = coins.find((item) => item.id === coinId);
      if (!coin) {
        return;
      }

      const nextFilterIds = coin.filterIds.filter((currentFilterId) => currentFilterId !== filterId);
      await updateCoin(coin.id, {
        title: coin.title,
        documentType: coin.documentType,
        subject: coin.subject,
        location: coin.location,
        reference: coin.reference,
        personalReference: coin.personalReference,
        note: coin.note,
        displayDate: coin.displayDate,
        revolutionaryDate: coin.revolutionaryDate,
        sortDate: coin.sortDate,
        sortDatePrecision: coin.sortDatePrecision,
        filterIds: nextFilterIds,
      });

      await loadData();
      setStatus("Piece retiree du filtre.");
    } catch (error) {
      console.error(error);
      setStatus(`Erreur retrait filtre : ${String(error)}`);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar panel">
        <div>
          <p className="eyebrow">Numisherch</p>
          <h1>Collection et recherche numismatique</h1>
          <p className="version-note">Version installee : {appVersion}</p>
        </div>

        <div className="topbar-side">
          <div className="status-chip">
            <span>Pieces</span>
            <strong>{overview?.coinCount ?? 0}</strong>
          </div>
          <div className="status-chip">
            <span>Brouillons</span>
            <strong>{overview?.draftCount ?? 0}</strong>
          </div>
          <button className="secondary-button" onClick={handleUpdate}>
            Recevoir une mise a jour
          </button>
        </div>
      </header>

      <section className="update-panel panel">
        <div className="update-panel-copy">
          <span className="status-inline">Etat</span>
        </div>
        <div className="update-panel-side">
          <span
            className={`update-badge ${
              availableVersion
                ? "update-badge-available"
                : status.startsWith("Aucune mise a jour")
                  ? "update-badge-none"
                  : status.startsWith("Erreur")
                    ? "update-badge-error"
                    : "update-badge-idle"
            }`}
          >
            {availableVersion ? `Mise a jour dispo : ${availableVersion}` : status}
          </span>
          <p className="update-version">Version installee : {appVersion}</p>
        </div>
      </section>

      <TabNav activeTab={activeTab} draftsCount={drafts.length} onTabChange={setActiveTab} />

      {dataError && <p className="error-banner">{dataError}</p>}

      {activeTab === "pieces" && (
        <>
          {(creationDraftNotice || selectedDraftNotice) && (
            <section className="notice-strip panel">
              {creationDraftNotice && (
                <div className="notice-strip-item">
                  <p>{creationDraftNotice}</p>
                  <button className="secondary-button" onClick={() => creationDraft && restoreDraft(creationDraft)}>
                    Reprendre le brouillon
                  </button>
                </div>
              )}
              {selectedDraftNotice && (
                <div className="notice-strip-item">
                  <p>{selectedDraftNotice}</p>
                  <button className="secondary-button" onClick={() => selectedCoinDraft && restoreDraft(selectedCoinDraft)}>
                    Charger le brouillon
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="pieces-page">
            <section className="list-column panel">
              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Collection</p>
                  <h2>Pieces</h2>
                </div>
                <button className="primary-button" onClick={handleCreateCoin}>
                  Nouvelle piece
                </button>
              </div>

              <div className="pieces-toolbar">
                <div className="pieces-toolbar-copy">
                  <strong>{activeFilterId ? "Filtre actif" : "Toutes les pieces"}</strong>
                </div>
                <div className="pieces-toolbar-side">
                  <span className={`micro-status micro-status-${draftSaveState}`}>
                    {draftSaveState === "saving" && "Brouillon en cours"}
                    {draftSaveState === "saved" && "Brouillon a jour"}
                    {draftSaveState === "error" && "Erreur de brouillon"}
                    {draftSaveState === "idle" && "Aucun brouillon actif"}
                  </span>
                </div>
              </div>

              {filters.length === 0 ? (
                <p className="empty-state empty-state-panel">
                  Aucun filtre cree, veuillez aller dans l'onglet Filtres pour en creer.
                </p>
              ) : (
                filterChips
              )}

              <CoinList
                coins={visibleCoins}
                selectedCoinId={selectedCoinId}
                activeFilterId={activeFilterId}
                filters={filters}
                loading={loadingData}
                totalCoinCount={coins.length}
                onSelectCoin={handleSelectCoin}
              />
            </section>
          </section>
        </>
      )}

      {activeTab === "filters" && (
        <FilterManager
          coins={coins}
          filters={filters}
          activeFilterId={activeFilterId}
          filterName={filterName}
          filterDescription={filterDescription}
          loading={loadingData}
          onFilterSelect={setActiveFilterId}
          onFilterNameChange={setFilterName}
          onFilterDescriptionChange={setFilterDescription}
          onCreateFilter={() => void handleCreateFilter()}
          onDeleteFilter={(filter) => void handleDeleteFilter(filter)}
          onAssignSelectedCoinsToFilter={(coinIds, targetFilterId) =>
            void handleAssignSelectedCoinsToFilter(coinIds, targetFilterId)
          }
          onRemoveCoinFromFilter={(coinId, filterId) => void handleRemoveCoinFromFilter(coinId, filterId)}
        />
      )}

      {activeTab === "drafts" && (
        <DraftsView
          drafts={drafts}
          coins={coins}
          onResumeDraft={restoreDraft}
          onDeleteDraft={(draft) => void handleDeleteDraft(draft)}
        />
      )}

      {editorDialogOpen && (
        <div className="modal-overlay" onClick={() => void requestCloseEditor()}>
          <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
            <CoinEditor
              mode={editorMode}
              editorState={editorState}
              filters={filters}
              saving={savingCoin}
              hasRecoveredDraft={editorHasRecoveredDraft}
              isDirty={editorIsDirty}
              saveStateLabel={lastSavedMessage}
              activeTitle={selectedCoin?.title ?? "Nouvelle piece"}
              draftNotice={
                draftSaveState === "saved"
                  ? "Le brouillon local est a jour. Fermer la fenetre proposera de le conserver."
                  : null
              }
              onChange={updateEditorField}
              onToggleFilter={toggleEditorFilter}
              onRequestClose={() => void requestCloseEditor()}
              onSave={() => void handleSaveCoin()}
              onDelete={() => void handleDeleteCoin()}
            />
          </div>
        </div>
      )}

      <footer className="footer-note">
        <p>{status}</p>
        <p>Version installee : {appVersion}</p>
        {currentVersion && <p>Version verifiee : {currentVersion}</p>}
        {availableVersion && <p>Version disponible : {availableVersion}</p>}
        {overview && <p>Base SQLite : {overview.databasePath}</p>}
      </footer>
    </main>
  );
}

export default App;
