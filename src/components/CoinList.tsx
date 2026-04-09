import type { CoinRecord, Filter } from "../types/domain";

type CoinListProps = {
  coins: CoinRecord[];
  selectedCoinId: string | null;
  activeFilterId: string | null;
  filters: Filter[];
  loading: boolean;
  onCreateCoin: () => void;
  onSelectCoin: (coin: CoinRecord) => void;
};

export function CoinList({
  coins,
  selectedCoinId,
  activeFilterId,
  filters,
  loading,
  onCreateCoin,
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
        <button className="primary-button" onClick={onCreateCoin}>
          Nouvelle piece
        </button>
      </div>

      {loading ? (
        <p className="empty-state">Chargement des pieces...</p>
      ) : coins.length === 0 ? (
        <p className="empty-state">
          {activeFilter
            ? "Aucune piece ne correspond au filtre selectionne."
            : "Aucune piece enregistree pour le moment. Cree la premiere fiche."}
        </p>
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
                    <strong>{coin.title}</strong>
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
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
