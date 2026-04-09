import type { CoinRecord, Filter } from "../types/domain";

type CoinListProps = {
  coins: CoinRecord[];
  selectedCoinId: string | null;
  activeFilterId: string | null;
  filters: Filter[];
  loading: boolean;
  totalCoinCount: number;
  onSelectCoin: (coin: CoinRecord) => void;
};

export function CoinList({
  coins,
  selectedCoinId,
  activeFilterId,
  filters,
  loading,
  totalCoinCount,
  onSelectCoin,
}: CoinListProps) {
  const activeFilter = filters.find((filter) => filter.id === activeFilterId);

  return (
    <section className="list-panel panel">
      <div className="panel-header list-panel-header">
        <div>
          <p className="panel-kicker">Collection</p>
          <h2>Pieces</h2>
          <p className="panel-subtitle">
            {activeFilter ? `Filtre actif : ${activeFilter.name}` : "Toutes les pieces classees par date"}
          </p>
        </div>
        <div className="list-toolbar">
          <span className="soft-counter">
            {coins.length}/{totalCoinCount}
          </span>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Chargement des pieces...</p>
      ) : coins.length === 0 ? (
        <div className="empty-state-card">
          <strong>{activeFilter ? "Aucune piece dans ce filtre" : "Aucune piece enregistree"}</strong>
          <p className="empty-state">
            {activeFilter
              ? "Change de filtre ou cree une nouvelle piece pour commencer a remplir cette categorie."
              : "Commence par creer une premiere piece, puis organise-la avec des filtres."}
          </p>
        </div>
      ) : (
        <ul className="coin-list">
          {coins.map((coin) => {
            const selected = coin.id === selectedCoinId;

            return (
              <li key={coin.id}>
                <button
                  className={`coin-card ${selected ? "coin-card-selected" : ""}`}
                  onClick={() => onSelectCoin(coin)}
                >
                  <div className="coin-card-head">
                    <div className="coin-card-title-wrap">
                      <strong>{coin.title}</strong>
                      <small>{selected ? "Fiche ouverte dans l'editeur" : "Cliquer pour ouvrir la fiche"}</small>
                    </div>
                    <span>{coin.displayDate ?? "Date libre non renseignee"}</span>
                  </div>

                  <div className="coin-card-meta">
                    <span>{coin.personalReference ?? "Sans reference perso"}</span>
                    <span>{coin.subject ?? "Sujet libre"}</span>
                  </div>

                  {coin.filterIds.length > 0 && (
                    <div className="coin-card-tags">
                      {coin.filterIds.map((filterId) => {
                        const filter = filters.find((item) => item.id === filterId);
                        return (
                          <span key={filterId} className="mini-tag">
                            {filter?.name ?? "Filtre"}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="coin-card-footer">
                    <span>{coin.location ?? "Localisation non renseignee"}</span>
                    <span className="coin-card-cta">{selected ? "Fiche en cours" : "Ouvrir la fiche"}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
