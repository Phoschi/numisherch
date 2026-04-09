import type { CoinDraft, CoinRecord } from "../types/domain";

type DraftsViewProps = {
  drafts: CoinDraft[];
  coins: CoinRecord[];
  onResumeDraft: (draft: CoinDraft) => void;
  onDeleteDraft: (draft: CoinDraft) => void;
};

function getDraftLabel(draft: CoinDraft, coins: CoinRecord[]) {
  if (draft.mode === "create") {
    return draft.title ?? "Nouvelle piece non enregistree";
  }

  const linkedCoin = coins.find((coin) => coin.id === draft.coinId);
  return draft.title ?? linkedCoin?.title ?? "Piece en edition";
}

export function DraftsView({ drafts, coins, onResumeDraft, onDeleteDraft }: DraftsViewProps) {
  return (
    <section className="drafts-page panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Travail en cours</p>
          <h2>Brouillons</h2>
          <p className="panel-subtitle">
            Les brouillons s'ouvrent maintenant dans la meme fenetre modale que la creation et l'edition.
          </p>
        </div>
        <span>{drafts.length}</span>
      </div>

      {drafts.length === 0 ? (
        <p className="empty-state">Aucun brouillon pour le moment.</p>
      ) : (
        <ul className="drafts-list">
          {drafts.map((draft) => (
            <li key={draft.id} className="draft-card">
              <div className="draft-card-head">
                <div>
                  <strong>{getDraftLabel(draft, coins)}</strong>
                  <p>{draft.mode === "create" ? "Brouillon de creation" : "Brouillon d'edition"}</p>
                </div>
                <span>{new Date(draft.updatedAt).toLocaleString()}</span>
              </div>

              <div className="draft-card-meta">
                <span>{draft.displayDate ?? "Sans date libre"}</span>
                <span>{draft.personalReference ?? "Sans reference perso"}</span>
              </div>

              <div className="draft-card-actions">
                <button className="secondary-button" onClick={() => onDeleteDraft(draft)}>
                  Supprimer
                </button>
                <button className="primary-button" onClick={() => onResumeDraft(draft)}>
                  Reprendre
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
