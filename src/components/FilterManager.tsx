import { useEffect, useMemo, useState } from "react";

import type { CoinRecord, Filter } from "../types/domain";

type FilterManagerProps = {
  coins: CoinRecord[];
  filters: Filter[];
  activeFilterId: string | null;
  filterName: string;
  filterDescription: string;
  loading: boolean;
  onFilterSelect: (filterId: string | null) => void;
  onFilterNameChange: (value: string) => void;
  onFilterDescriptionChange: (value: string) => void;
  onCreateFilter: () => void;
  onDeleteFilter: (filter: Filter) => void;
  onAssignSelectedCoinsToFilter: (coinIds: string[], targetFilterId: string) => void;
  onRemoveCoinFromFilter: (coinId: string, filterId: string) => void;
};

export function FilterManager(props: FilterManagerProps) {
  const {
    coins,
    filters,
    activeFilterId,
    filterName,
    filterDescription,
    loading,
    onFilterSelect,
    onFilterNameChange,
    onFilterDescriptionChange,
    onCreateFilter,
    onDeleteFilter,
    onAssignSelectedCoinsToFilter,
    onRemoveCoinFromFilter,
  } = props;
  const [selectedCoinIds, setSelectedCoinIds] = useState<string[]>([]);
  const [targetFilterId, setTargetFilterId] = useState<string>("");

  const associatedCoins = useMemo(() => {
    if (!activeFilterId) {
      return [];
    }

    return coins.filter((coin) => coin.filterIds.includes(activeFilterId));
  }, [activeFilterId, coins]);

  const availableTargetFilters = useMemo(
    () => filters.filter((filter) => filter.id !== activeFilterId),
    [activeFilterId, filters],
  );

  useEffect(() => {
    setSelectedCoinIds([]);
    setTargetFilterId("");
  }, [activeFilterId]);

  function toggleCoinSelection(coinId: string) {
    setSelectedCoinIds((current) =>
      current.includes(coinId) ? current.filter((currentId) => currentId !== coinId) : [...current, coinId],
    );
  }

  return (
    <section className="filters-page panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Organisation</p>
          <h2>Filtres</h2>
          <p className="panel-subtitle">
            Gere ici les categories et reclasser rapidement les pieces deja associees.
          </p>
        </div>
        <span>{filters.length}</span>
      </div>

      <div className="filters-page-grid">
        <div className="subsection-card">
          <div className="subsection-header">
            <h3>Nouveau filtre</h3>
            <p>Ajoute une etiquette reutilisable pour organiser la collection.</p>
          </div>
          <div className="filter-creation">
            <input
              className="field"
              type="text"
              value={filterName}
              placeholder="Nom du filtre"
              onChange={(event) => onFilterNameChange(event.target.value)}
            />
            <input
              className="field"
              type="text"
              value={filterDescription}
              placeholder="Description optionnelle"
              onChange={(event) => onFilterDescriptionChange(event.target.value)}
            />
            <button className="primary-button block-button" onClick={onCreateFilter}>
              Creer le filtre
            </button>
          </div>
        </div>

        <div className="subsection-card">
          <div className="subsection-header">
            <h3>Liste des filtres</h3>
            <p>{activeFilterId ? "Un filtre est actuellement applique dans l'onglet Pieces." : "Aucun filtre actif."}</p>
          </div>

          <div className="filter-chip-stack">
            <button
              className={`filter-chip filter-chip-uniform ${activeFilterId === null ? "filter-chip-active" : ""}`}
              onClick={() => onFilterSelect(null)}
            >
              Toutes les pieces
            </button>
          </div>

          {loading ? (
            <p className="empty-state">Chargement des filtres...</p>
          ) : filters.length === 0 ? (
            <p className="empty-state">Creer un premier filtre pour organiser la collection.</p>
          ) : (
            <ul className="filter-list">
              {filters.map((filter) => {
                const active = filter.id === activeFilterId;

                return (
                  <li key={filter.id} className={`filter-item ${active ? "filter-item-active" : ""}`}>
                    <button
                      className={`filter-chip filter-chip-uniform ${active ? "filter-chip-active" : ""}`}
                      onClick={() => onFilterSelect(active ? null : filter.id)}
                    >
                      <strong>{filter.name}</strong>
                      <span>{filter.description ?? "Sans description"}</span>
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => onDeleteFilter(filter)}
                      aria-label={`Supprimer le filtre ${filter.name}`}
                    >
                      Supprimer
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="subsection-card filter-association-panel">
          <div className="subsection-header">
            <h3>Pieces du filtre</h3>
            <p>
              {activeFilterId
                ? "Selectionne plusieurs pieces pour les associer rapidement a un autre filtre."
                : "Choisis un filtre dans la liste pour voir les pieces associees."}
            </p>
          </div>

          {!activeFilterId ? (
            <p className="empty-state">Aucun filtre selectionne.</p>
          ) : associatedCoins.length === 0 ? (
            <p className="empty-state">Aucune piece n'est encore associee a ce filtre.</p>
          ) : (
            <>
              <div className="bulk-association-bar">
                <label className="field-group">
                  <span>Associer la selection a un autre filtre</span>
                  <select
                    className="field"
                    value={targetFilterId}
                    onChange={(event) => setTargetFilterId(event.target.value)}
                  >
                    <option value="">Choisir un filtre</option>
                    {availableTargetFilters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="primary-button"
                  onClick={() => onAssignSelectedCoinsToFilter(selectedCoinIds, targetFilterId)}
                  disabled={selectedCoinIds.length === 0 || targetFilterId === ""}
                >
                  Associer la selection
                </button>
              </div>

              <ul className="filter-associated-list">
                {associatedCoins.map((coin) => (
                  <li key={coin.id} className="associated-coin-card">
                    <label className="associated-coin-select">
                      <input
                        type="checkbox"
                        checked={selectedCoinIds.includes(coin.id)}
                        onChange={() => toggleCoinSelection(coin.id)}
                      />
                      <div>
                        <strong>{coin.title}</strong>
                        <p>
                          {coin.displayDate ?? "Sans date"} · {coin.personalReference ?? "Sans reference perso"}
                        </p>
                      </div>
                    </label>
                    <button
                      className="secondary-button"
                      onClick={() => onRemoveCoinFromFilter(coin.id, activeFilterId)}
                    >
                      Retirer du filtre
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
