import type { CoinDraft, CoinRecord, SortDatePrecision } from "../types/domain";

export type CoinEditorState = {
  id: string | null;
  title: string;
  documentType: string;
  subject: string;
  location: string;
  reference: string;
  personalReference: string;
  note: string;
  displayDate: string;
  revolutionaryDate: string;
  sortDate: string;
  sortDatePrecision: SortDatePrecision | "";
  filterIds: string[];
};

export function createEmptyEditorState(): CoinEditorState {
  return {
    id: null,
    title: "",
    documentType: "",
    subject: "",
    location: "",
    reference: "",
    personalReference: "",
    note: "",
    displayDate: "",
    revolutionaryDate: "",
    sortDate: "",
    sortDatePrecision: "",
    filterIds: [],
  };
}

export function coinToEditorState(coin: CoinRecord): CoinEditorState {
  return {
    id: coin.id,
    title: coin.title,
    documentType: coin.documentType ?? "",
    subject: coin.subject ?? "",
    location: coin.location ?? "",
    reference: coin.reference ?? "",
    personalReference: coin.personalReference ?? "",
    note: coin.note ?? "",
    displayDate: coin.displayDate ?? "",
    revolutionaryDate: coin.revolutionaryDate ?? "",
    sortDate: coin.sortDate ?? "",
    sortDatePrecision: coin.sortDatePrecision ?? "",
    filterIds: [...coin.filterIds],
  };
}

export function draftToEditorState(draft: CoinDraft): CoinEditorState {
  return {
    id: draft.coinId,
    title: draft.title ?? "",
    documentType: draft.documentType ?? "",
    subject: draft.subject ?? "",
    location: draft.location ?? "",
    reference: draft.reference ?? "",
    personalReference: draft.personalReference ?? "",
    note: draft.note ?? "",
    displayDate: draft.displayDate ?? "",
    revolutionaryDate: draft.revolutionaryDate ?? "",
    sortDate: draft.sortDate ?? "",
    sortDatePrecision: draft.sortDatePrecision ?? "",
    filterIds: [...draft.selectedFilterIds],
  };
}

export function isEditorStateEmpty(state: CoinEditorState): boolean {
  return (
    state.title.trim() === "" &&
    state.documentType.trim() === "" &&
    state.subject.trim() === "" &&
    state.location.trim() === "" &&
    state.reference.trim() === "" &&
    state.personalReference.trim() === "" &&
    state.note.trim() === "" &&
    state.displayDate.trim() === "" &&
    state.revolutionaryDate.trim() === "" &&
    state.sortDate.trim() === "" &&
    state.sortDatePrecision === "" &&
    state.filterIds.length === 0
  );
}

export function normalizeNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
