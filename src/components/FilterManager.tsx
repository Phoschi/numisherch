import type { Filter } from "../types/domain";

type FilterManagerProps = {
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
};

export function FilterManager(props: FilterManagerProps) {
  const {
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
  } = props;

  return (
    <section className="filters-page panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Organisation</p>
          <h2>Filtres</h2>
          <p className="panel-subtitle">Gerer ici les categories. Elles s'appliquent ensuite dans l'onglet Pieces.</p>
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

          <button
            className={`filter-chip ${activeFilterId === null ? "filter-chip-active" : ""}`}
            onClick={() => onFilterSelect(null)}
          >
            Toutes les pieces
          </button>

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
                    <button className="filter-chip" onClick={() => onFilterSelect(active ? null : filter.id)}>
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
      </div>
    </section>
  );
}
