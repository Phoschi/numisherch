import type { CoinEditorState } from "../lib/editor";
import type { Filter, SortDatePrecision } from "../types/domain";

type CoinEditorProps = {
  mode: "create" | "edit";
  editorState: CoinEditorState;
  filters: Filter[];
  saving: boolean;
  hasRecoveredDraft: boolean;
  onChange: <K extends keyof CoinEditorState>(field: K, value: CoinEditorState[K]) => void;
  onToggleFilter: (filterId: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

const precisionOptions: Array<{ value: SortDatePrecision | ""; label: string }> = [
  { value: "", label: "Aucune" },
  { value: "year", label: "Annee" },
  { value: "month", label: "Mois" },
  { value: "day", label: "Jour" },
  { value: "unknown", label: "Inconnue" },
];

export function CoinEditor({
  mode,
  editorState,
  filters,
  saving,
  hasRecoveredDraft,
  onChange,
  onToggleFilter,
  onSave,
  onDelete,
}: CoinEditorProps) {
  return (
    <aside className="editor-panel panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">{mode === "create" ? "Creation" : "Edition"}</p>
          <h2>{mode === "create" ? "Nouvelle piece" : "Fiche de piece"}</h2>
          <p className="panel-subtitle">
            {hasRecoveredDraft
              ? "Un brouillon restaure est actuellement ouvert."
              : "Les modifications sont enregistrees uniquement au clic sur Enregistrer."}
          </p>
        </div>
      </div>

      <div className="editor-form">
        <label className="field-group">
          <span>Titre *</span>
          <input
            className="field"
            type="text"
            value={editorState.title}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Nom de la piece"
          />
        </label>

        <label className="field-group">
          <span>Type de document</span>
          <input
            className="field"
            type="text"
            value={editorState.documentType}
            onChange={(event) => onChange("documentType", event.target.value)}
            placeholder="Piece, medaille, jeton..."
          />
        </label>

        <label className="field-group">
          <span>Sujet</span>
          <input
            className="field"
            type="text"
            value={editorState.subject}
            onChange={(event) => onChange("subject", event.target.value)}
            placeholder="Sujet libre"
          />
        </label>

        <label className="field-group">
          <span>Localisation</span>
          <input
            className="field"
            type="text"
            value={editorState.location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="Origine, lieu, rangement..."
          />
        </label>

        <div className="field-row">
          <label className="field-group">
            <span>Reference</span>
            <input
              className="field"
              type="text"
              value={editorState.reference}
              onChange={(event) => onChange("reference", event.target.value)}
              placeholder="Reference externe"
            />
          </label>

          <label className="field-group">
            <span>Reference perso</span>
            <input
              className="field"
              type="text"
              value={editorState.personalReference}
              onChange={(event) => onChange("personalReference", event.target.value)}
              placeholder="Code personnel"
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field-group">
            <span>Date affichage</span>
            <input
              className="field"
              type="text"
              value={editorState.displayDate}
              onChange={(event) => onChange("displayDate", event.target.value)}
              placeholder="1792, vers 1793..."
            />
          </label>

          <label className="field-group">
            <span>Date revolutionnaire</span>
            <input
              className="field"
              type="text"
              value={editorState.revolutionaryDate}
              onChange={(event) => onChange("revolutionaryDate", event.target.value)}
              placeholder="an I, an II..."
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field-group">
            <span>Date de tri</span>
            <input
              className="field"
              type="text"
              value={editorState.sortDate}
              onChange={(event) => onChange("sortDate", event.target.value)}
              placeholder="1792-01-01"
            />
          </label>

          <label className="field-group">
            <span>Precision</span>
            <select
              className="field"
              value={editorState.sortDatePrecision}
              onChange={(event) => onChange("sortDatePrecision", event.target.value as SortDatePrecision | "")}
            >
              {precisionOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-group">
          <span>Filtres associes</span>
          <div className="editor-tags">
            {filters.length === 0 ? (
              <p className="empty-state">Creer un filtre pour commencer a classer les pieces.</p>
            ) : (
              filters.map((filter) => {
                const selected = editorState.filterIds.includes(filter.id);

                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`tag-button ${selected ? "tag-button-selected" : ""}`}
                    onClick={() => onToggleFilter(filter.id)}
                  >
                    {filter.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <label className="field-group">
          <span>Note</span>
          <textarea
            className="field textarea-field"
            value={editorState.note}
            onChange={(event) => onChange("note", event.target.value)}
            placeholder="Observations, contexte historique, commentaires..."
          />
        </label>
      </div>

      <div className="editor-actions">
        {mode === "edit" && (
          <button className="danger-button" onClick={onDelete} disabled={saving}>
            Supprimer
          </button>
        )}
        <button className="primary-button" onClick={onSave} disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </aside>
  );
}
