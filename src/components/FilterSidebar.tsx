import type { Filter } from "../types/domain";

type FilterSidebarProps = {
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

export function FilterSidebar({
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
}: FilterSidebarProps) {
  return (
    <aside className="sidebar panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Organisation</p>
          <h2>Filtres</h2>
          <p className="panel-subtitle">Creer des regroupements libres pour retrouver les pieces plus vite.</p>
        </div>
        <span>{filters.length}</span>
      </div>

      <div className="subsection-card filter-creation">
        <div className="subsection-header">
          <h3>Nouveau filtre</h3>
          <p>Ajoute une etiquette personnelle a reutiliser sur plusieurs pieces.</p>
        </div>
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

      <div className="subsection-header subsection-tight">
        <h3>Filtres existants</h3>
        <p>{activeFilterId === null ? "Toutes les pieces sont affichees." : "Un filtre est actuellement applique."}</p>
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
        <p className="empty-state">Cree un premier filtre pour organiser la collection.</p>
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
    </aside>
  );
}
