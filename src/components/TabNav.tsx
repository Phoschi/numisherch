export type AppTab = "pieces" | "filters" | "drafts";

type TabNavProps = {
  activeTab: AppTab;
  draftsCount: number;
  onTabChange: (tab: AppTab) => void;
};

export function TabNav({ activeTab, draftsCount, onTabChange }: TabNavProps) {
  return (
    <nav className="tab-nav panel" aria-label="Navigation principale">
      <button
        className={`tab-button ${activeTab === "pieces" ? "tab-button-active" : ""}`}
        onClick={() => onTabChange("pieces")}
      >
        Pieces
      </button>
      <button
        className={`tab-button ${activeTab === "filters" ? "tab-button-active" : ""}`}
        onClick={() => onTabChange("filters")}
      >
        Filtres
      </button>
      <button
        className={`tab-button ${activeTab === "drafts" ? "tab-button-active" : ""}`}
        onClick={() => onTabChange("drafts")}
      >
        Brouillons
        {draftsCount > 0 && <span className="tab-badge">{draftsCount}</span>}
      </button>
    </nav>
  );
}
