use tauri::State;

use crate::{
    db::{
        create_coin, create_filter, delete_coin, delete_draft, delete_filter, get_coin_draft,
        get_creation_draft, get_overview, list_coins, list_drafts, list_filters, open_connection_from_state,
        save_draft, update_coin, update_filter, DatabaseState,
    },
    models::{
        AppOverview, CoinDraft, CoinRecord, CreateCoinInput, CreateFilterInput, Filter, SaveDraftInput,
        UpdateCoinInput, UpdateFilterInput,
    },
};

#[tauri::command]
pub fn get_app_overview(state: State<'_, DatabaseState>) -> Result<AppOverview, String> {
    let connection = open_connection_from_state(&state)?;
    get_overview(&connection, &state.db_path)
}

#[tauri::command]
pub fn get_coins(state: State<'_, DatabaseState>) -> Result<Vec<CoinRecord>, String> {
    let connection = open_connection_from_state(&state)?;
    list_coins(&connection)
}

#[tauri::command]
pub fn create_coin_command(
    state: State<'_, DatabaseState>,
    input: CreateCoinInput,
) -> Result<CoinRecord, String> {
    let mut connection = open_connection_from_state(&state)?;
    create_coin(&mut connection, input)
}

#[tauri::command]
pub fn update_coin_command(
    state: State<'_, DatabaseState>,
    coin_id: String,
    input: UpdateCoinInput,
) -> Result<CoinRecord, String> {
    let mut connection = open_connection_from_state(&state)?;
    update_coin(&mut connection, &coin_id, input)
}

#[tauri::command]
pub fn delete_coin_command(state: State<'_, DatabaseState>, coin_id: String) -> Result<(), String> {
    let connection = open_connection_from_state(&state)?;
    delete_coin(&connection, &coin_id)
}

#[tauri::command]
pub fn get_filters(state: State<'_, DatabaseState>) -> Result<Vec<Filter>, String> {
    let connection = open_connection_from_state(&state)?;
    list_filters(&connection)
}

#[tauri::command]
pub fn create_filter_command(
    state: State<'_, DatabaseState>,
    input: CreateFilterInput,
) -> Result<Filter, String> {
    let mut connection = open_connection_from_state(&state)?;
    create_filter(&mut connection, input)
}

#[tauri::command]
pub fn update_filter_command(
    state: State<'_, DatabaseState>,
    filter_id: String,
    input: UpdateFilterInput,
) -> Result<Filter, String> {
    let connection = open_connection_from_state(&state)?;
    update_filter(&connection, &filter_id, input)
}

#[tauri::command]
pub fn delete_filter_command(
    state: State<'_, DatabaseState>,
    filter_id: String,
) -> Result<(), String> {
    let connection = open_connection_from_state(&state)?;
    delete_filter(&connection, &filter_id)
}

#[tauri::command]
pub fn get_creation_draft_command(
    state: State<'_, DatabaseState>,
) -> Result<Option<CoinDraft>, String> {
    let connection = open_connection_from_state(&state)?;
    get_creation_draft(&connection)
}

#[tauri::command]
pub fn get_coin_draft_command(
    state: State<'_, DatabaseState>,
    coin_id: String,
) -> Result<Option<CoinDraft>, String> {
    let connection = open_connection_from_state(&state)?;
    get_coin_draft(&connection, &coin_id)
}

#[tauri::command]
pub fn get_drafts_command(state: State<'_, DatabaseState>) -> Result<Vec<CoinDraft>, String> {
    let connection = open_connection_from_state(&state)?;
    list_drafts(&connection)
}

#[tauri::command]
pub fn save_draft_command(
    state: State<'_, DatabaseState>,
    input: SaveDraftInput,
) -> Result<CoinDraft, String> {
    let connection = open_connection_from_state(&state)?;
    save_draft(&connection, input)
}

#[tauri::command]
pub fn delete_draft_command(
    state: State<'_, DatabaseState>,
    draft_id: String,
) -> Result<(), String> {
    let connection = open_connection_from_state(&state)?;
    delete_draft(&connection, &draft_id)
}
