export type SortDatePrecision = "year" | "month" | "day" | "unknown";

export type Coin = {
  id: string;
  title: string;
  documentType: string | null;
  subject: string | null;
  location: string | null;
  reference: string | null;
  personalReference: string | null;
  note: string | null;
  displayDate: string | null;
  revolutionaryDate: string | null;
  sortDate: string | null;
  sortDatePrecision: SortDatePrecision | null;
  isDraftPromoted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CoinRecord = Coin & {
  filterIds: string[];
};

export type Filter = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DraftMode = "create" | "edit";

export type CoinDraft = {
  id: string;
  coinId: string | null;
  mode: DraftMode;
  title: string | null;
  documentType: string | null;
  subject: string | null;
  location: string | null;
  reference: string | null;
  personalReference: string | null;
  note: string | null;
  displayDate: string | null;
  revolutionaryDate: string | null;
  sortDate: string | null;
  sortDatePrecision: SortDatePrecision | null;
  selectedFilterIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type AppOverview = {
  databasePath: string;
  coinCount: number;
  filterCount: number;
  draftCount: number;
};

export type CreateCoinInput = {
  title: string;
  documentType: string | null;
  subject: string | null;
  location: string | null;
  reference: string | null;
  personalReference: string | null;
  note: string | null;
  displayDate: string | null;
  revolutionaryDate: string | null;
  sortDate: string | null;
  sortDatePrecision: SortDatePrecision | null;
  filterIds: string[];
};

export type UpdateCoinInput = CreateCoinInput;

export type CreateFilterInput = {
  name: string;
  description: string | null;
  color: string | null;
};

export type UpdateFilterInput = {
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
};

export type SaveDraftInput = {
  id?: string;
  coinId: string | null;
  mode: DraftMode;
  title: string | null;
  documentType: string | null;
  subject: string | null;
  location: string | null;
  reference: string | null;
  personalReference: string | null;
  note: string | null;
  displayDate: string | null;
  revolutionaryDate: string | null;
  sortDate: string | null;
  sortDatePrecision: SortDatePrecision | null;
  selectedFilterIds: string[];
};
