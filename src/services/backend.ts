import { invoke } from "@tauri-apps/api/core";

import type {
  AppOverview,
  CoinDraft,
  CoinRecord,
  CreateCoinInput,
  CreateFilterInput,
  Filter,
  SaveDraftInput,
  UpdateCoinInput,
  UpdateFilterInput,
} from "../types/domain";

export function getAppOverview() {
  return invoke<AppOverview>("get_app_overview");
}

export function getCoins() {
  return invoke<CoinRecord[]>("get_coins");
}

export function createCoin(input: CreateCoinInput) {
  return invoke<CoinRecord>("create_coin_command", { input });
}

export function updateCoin(coinId: string, input: UpdateCoinInput) {
  return invoke<CoinRecord>("update_coin_command", { coinId, input });
}

export function deleteCoin(coinId: string) {
  return invoke<void>("delete_coin_command", { coinId });
}

export function getFilters() {
  return invoke<Filter[]>("get_filters");
}

export function createFilter(input: CreateFilterInput) {
  return invoke<Filter>("create_filter_command", { input });
}

export function updateFilter(filterId: string, input: UpdateFilterInput) {
  return invoke<Filter>("update_filter_command", { filterId, input });
}

export function deleteFilter(filterId: string) {
  return invoke<void>("delete_filter_command", { filterId });
}

export function getCreationDraft() {
  return invoke<CoinDraft | null>("get_creation_draft_command");
}

export function getCoinDraft(coinId: string) {
  return invoke<CoinDraft | null>("get_coin_draft_command", { coinId });
}

export function saveDraft(input: SaveDraftInput) {
  return invoke<CoinDraft>("save_draft_command", { input });
}

export function deleteDraft(draftId: string) {
  return invoke<void>("delete_draft_command", { draftId });
}
