use std::{
    fs,
    path::{Path, PathBuf},
};

use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

use crate::models::{
    AppOverview, Coin, CoinDraft, CoinRecord, CreateCoinInput, CreateFilterInput, DraftMode, Filter,
    SaveDraftInput, SortDatePrecision, UpdateCoinInput, UpdateFilterInput,
};

pub struct DatabaseState {
    pub db_path: PathBuf,
}

pub fn initialize_database(app: &AppHandle) -> Result<DatabaseState, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Impossible de resoudre le dossier applicatif: {error}"))?;

    fs::create_dir_all(&app_dir)
        .map_err(|error| format!("Impossible de creer le dossier applicatif: {error}"))?;

    let db_path = app_dir.join("numisherch.sqlite");
    let connection = open_connection(&db_path)?;
    run_migrations(&connection)?;

    Ok(DatabaseState { db_path })
}

pub fn open_connection(path: &Path) -> Result<Connection, String> {
    let connection = Connection::open(path)
        .map_err(|error| format!("Impossible d'ouvrir la base de donnees: {error}"))?;

    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(|error| format!("Impossible d'activer les cles etrangeres: {error}"))?;

    Ok(connection)
}

pub fn open_connection_from_state(state: &State<'_, DatabaseState>) -> Result<Connection, String> {
    open_connection(&state.db_path)
}

fn run_migrations(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS coins (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              document_type TEXT,
              subject TEXT,
              location TEXT,
              reference TEXT,
              personal_reference TEXT,
              note TEXT,
              display_date TEXT,
              revolutionary_date TEXT,
              sort_date TEXT,
              sort_date_precision TEXT,
              is_draft_promoted INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS filters (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL UNIQUE,
              description TEXT,
              color TEXT,
              sort_order INTEGER NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS coin_filters (
              coin_id TEXT NOT NULL,
              filter_id TEXT NOT NULL,
              created_at TEXT NOT NULL,
              PRIMARY KEY (coin_id, filter_id),
              FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE,
              FOREIGN KEY (filter_id) REFERENCES filters(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS coin_drafts (
              id TEXT PRIMARY KEY,
              coin_id TEXT,
              mode TEXT NOT NULL,
              title TEXT,
              document_type TEXT,
              subject TEXT,
              location TEXT,
              reference TEXT,
              personal_reference TEXT,
              note TEXT,
              display_date TEXT,
              revolutionary_date TEXT,
              sort_date TEXT,
              sort_date_precision TEXT,
              selected_filter_ids TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (coin_id) REFERENCES coins(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_coins_title ON coins(title);
            CREATE INDEX IF NOT EXISTS idx_coins_sort_date ON coins(sort_date);
            CREATE INDEX IF NOT EXISTS idx_coins_updated_at ON coins(updated_at);
            CREATE INDEX IF NOT EXISTS idx_filters_sort_order ON filters(sort_order);
            CREATE INDEX IF NOT EXISTS idx_coin_filters_coin_id ON coin_filters(coin_id);
            CREATE INDEX IF NOT EXISTS idx_coin_filters_filter_id ON coin_filters(filter_id);
            CREATE INDEX IF NOT EXISTS idx_coin_drafts_coin_id ON coin_drafts(coin_id);
            CREATE INDEX IF NOT EXISTS idx_coin_drafts_updated_at ON coin_drafts(updated_at);
            ",
        )
        .map_err(|error| format!("Impossible d'initialiser le schema SQLite: {error}"))
}

pub fn get_overview(connection: &Connection, db_path: &Path) -> Result<AppOverview, String> {
    let coin_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM coins", [], |row| row.get(0))
        .map_err(|error| format!("Impossible de compter les pieces: {error}"))?;
    let filter_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM filters", [], |row| row.get(0))
        .map_err(|error| format!("Impossible de compter les filtres: {error}"))?;
    let draft_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM coin_drafts", [], |row| row.get(0))
        .map_err(|error| format!("Impossible de compter les brouillons: {error}"))?;

    Ok(AppOverview {
        database_path: db_path.display().to_string(),
        coin_count,
        filter_count,
        draft_count,
    })
}

pub fn list_filters(connection: &Connection) -> Result<Vec<Filter>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, name, description, color, sort_order, created_at, updated_at
             FROM filters
             ORDER BY sort_order ASC, name COLLATE NOCASE ASC",
        )
        .map_err(|error| format!("Impossible de preparer la lecture des filtres: {error}"))?;

    let rows = statement
        .query_map([], map_filter)
        .map_err(|error| format!("Impossible de lire les filtres: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Impossible de mapper les filtres: {error}"))
}

pub fn create_filter(connection: &mut Connection, input: CreateFilterInput) -> Result<Filter, String> {
    let name = normalize_required_text(&input.name, "Le nom du filtre est obligatoire")?;
    let now = now_iso();
    let filter_id = Uuid::new_v4().to_string();
    let next_order = next_filter_order(connection)?;

    connection
        .execute(
            "INSERT INTO filters (id, name, description, color, sort_order, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                filter_id,
                name,
                normalize_optional_text(input.description),
                normalize_optional_text(input.color),
                next_order,
                now,
                now
            ],
        )
        .map_err(map_constraint_error)?;

    get_filter_by_id(connection, &filter_id)?.ok_or_else(|| "Filtre cree mais introuvable".to_string())
}

pub fn update_filter(
    connection: &Connection,
    filter_id: &str,
    input: UpdateFilterInput,
) -> Result<Filter, String> {
    let name = normalize_required_text(&input.name, "Le nom du filtre est obligatoire")?;
    let updated = connection
        .execute(
            "UPDATE filters
             SET name = ?1, description = ?2, color = ?3, sort_order = ?4, updated_at = ?5
             WHERE id = ?6",
            params![
                name,
                normalize_optional_text(input.description),
                normalize_optional_text(input.color),
                input.sort_order,
                now_iso(),
                filter_id
            ],
        )
        .map_err(map_constraint_error)?;

    if updated == 0 {
        return Err("Filtre introuvable".to_string());
    }

    get_filter_by_id(connection, filter_id)?.ok_or_else(|| "Filtre mis a jour mais introuvable".to_string())
}

pub fn delete_filter(connection: &Connection, filter_id: &str) -> Result<(), String> {
    let deleted = connection
        .execute("DELETE FROM filters WHERE id = ?1", params![filter_id])
        .map_err(|error| format!("Impossible de supprimer le filtre: {error}"))?;

    if deleted == 0 {
        return Err("Filtre introuvable".to_string());
    }

    Ok(())
}

pub fn list_coins(connection: &Connection) -> Result<Vec<CoinRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
               id, title, document_type, subject, location, reference, personal_reference,
               note, display_date, revolutionary_date, sort_date, sort_date_precision,
               is_draft_promoted, created_at, updated_at
             FROM coins
             ORDER BY sort_date IS NULL ASC, sort_date ASC, title COLLATE NOCASE ASC",
        )
        .map_err(|error| format!("Impossible de preparer la lecture des pieces: {error}"))?;

    let rows = statement
        .query_map([], map_coin)
        .map_err(|error| format!("Impossible de lire les pieces: {error}"))?;

    let coins = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Impossible de mapper les pieces: {error}"))?;

    coins
        .into_iter()
        .map(|coin| {
            let filter_ids = list_filter_ids_for_coin(connection, &coin.id)?;
            Ok(CoinRecord { coin, filter_ids })
        })
        .collect()
}

pub fn create_coin(connection: &mut Connection, input: CreateCoinInput) -> Result<CoinRecord, String> {
    let title = normalize_required_text(&input.title, "Le titre est obligatoire")?;
    let coin_id = Uuid::new_v4().to_string();
    let now = now_iso();
    let transaction = connection
        .transaction()
        .map_err(|error| format!("Impossible d'ouvrir la transaction de creation: {error}"))?;

    transaction
        .execute(
            "INSERT INTO coins (
                id, title, document_type, subject, location, reference, personal_reference,
                note, display_date, revolutionary_date, sort_date, sort_date_precision,
                is_draft_promoted, created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                coin_id,
                title,
                normalize_optional_text(input.document_type),
                normalize_optional_text(input.subject),
                normalize_optional_text(input.location),
                normalize_optional_text(input.reference),
                normalize_optional_text(input.personal_reference),
                normalize_optional_text(input.note),
                normalize_optional_text(input.display_date),
                normalize_optional_text(input.revolutionary_date),
                normalize_optional_text(input.sort_date),
                serialize_precision(input.sort_date_precision),
                0_i64,
                now,
                now
            ],
        )
        .map_err(|error| format!("Impossible de creer la piece: {error}"))?;

    replace_coin_filters(&transaction, &coin_id, &input.filter_ids)?;
    transaction
        .commit()
        .map_err(|error| format!("Impossible de valider la creation de la piece: {error}"))?;

    get_coin_by_id(connection, &coin_id)?.ok_or_else(|| "Piece creee mais introuvable".to_string())
}

pub fn update_coin(
    connection: &mut Connection,
    coin_id: &str,
    input: UpdateCoinInput,
) -> Result<CoinRecord, String> {
    let title = normalize_required_text(&input.title, "Le titre est obligatoire")?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("Impossible d'ouvrir la transaction de mise a jour: {error}"))?;

    let updated = transaction
        .execute(
            "UPDATE coins
             SET title = ?1, document_type = ?2, subject = ?3, location = ?4, reference = ?5,
                 personal_reference = ?6, note = ?7, display_date = ?8, revolutionary_date = ?9,
                 sort_date = ?10, sort_date_precision = ?11, updated_at = ?12
             WHERE id = ?13",
            params![
                title,
                normalize_optional_text(input.document_type),
                normalize_optional_text(input.subject),
                normalize_optional_text(input.location),
                normalize_optional_text(input.reference),
                normalize_optional_text(input.personal_reference),
                normalize_optional_text(input.note),
                normalize_optional_text(input.display_date),
                normalize_optional_text(input.revolutionary_date),
                normalize_optional_text(input.sort_date),
                serialize_precision(input.sort_date_precision),
                now_iso(),
                coin_id
            ],
        )
        .map_err(|error| format!("Impossible de mettre a jour la piece: {error}"))?;

    if updated == 0 {
        return Err("Piece introuvable".to_string());
    }

    replace_coin_filters(&transaction, coin_id, &input.filter_ids)?;
    transaction
        .commit()
        .map_err(|error| format!("Impossible de valider la mise a jour de la piece: {error}"))?;

    get_coin_by_id(connection, coin_id)?.ok_or_else(|| "Piece mise a jour mais introuvable".to_string())
}

pub fn delete_coin(connection: &Connection, coin_id: &str) -> Result<(), String> {
    let deleted = connection
        .execute("DELETE FROM coins WHERE id = ?1", params![coin_id])
        .map_err(|error| format!("Impossible de supprimer la piece: {error}"))?;

    if deleted == 0 {
        return Err("Piece introuvable".to_string());
    }

    Ok(())
}

pub fn get_creation_draft(connection: &Connection) -> Result<Option<CoinDraft>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, coin_id, mode, title, document_type, subject, location, reference,
                    personal_reference, note, display_date, revolutionary_date, sort_date,
                    sort_date_precision, selected_filter_ids, created_at, updated_at
             FROM coin_drafts
             WHERE mode = 'create'
             ORDER BY updated_at DESC
             LIMIT 1",
        )
        .map_err(|error| format!("Impossible de preparer la lecture du brouillon de creation: {error}"))?;

    statement
        .query_row([], map_draft)
        .optional()
        .map_err(|error| format!("Impossible de lire le brouillon de creation: {error}"))
}

pub fn get_coin_draft(connection: &Connection, coin_id: &str) -> Result<Option<CoinDraft>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, coin_id, mode, title, document_type, subject, location, reference,
                    personal_reference, note, display_date, revolutionary_date, sort_date,
                    sort_date_precision, selected_filter_ids, created_at, updated_at
             FROM coin_drafts
             WHERE coin_id = ?1 AND mode = 'edit'
             ORDER BY updated_at DESC
             LIMIT 1",
        )
        .map_err(|error| format!("Impossible de preparer la lecture du brouillon: {error}"))?;

    statement
        .query_row(params![coin_id], map_draft)
        .optional()
        .map_err(|error| format!("Impossible de lire le brouillon: {error}"))
}

pub fn list_drafts(connection: &Connection) -> Result<Vec<CoinDraft>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, coin_id, mode, title, document_type, subject, location, reference,
                    personal_reference, note, display_date, revolutionary_date, sort_date,
                    sort_date_precision, selected_filter_ids, created_at, updated_at
             FROM coin_drafts
             ORDER BY updated_at DESC",
        )
        .map_err(|error| format!("Impossible de preparer la lecture des brouillons: {error}"))?;

    let rows = statement
        .query_map([], map_draft)
        .map_err(|error| format!("Impossible de lire les brouillons: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Impossible de mapper les brouillons: {error}"))
}

pub fn save_draft(connection: &Connection, input: SaveDraftInput) -> Result<CoinDraft, String> {
    let draft_id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing_created_at = get_draft_created_at(connection, &draft_id)?;
    let created_at = existing_created_at.unwrap_or_else(now_iso);
    let updated_at = now_iso();
    let selected_filter_ids =
        serde_json::to_string(&input.selected_filter_ids).map_err(|error| format!("Impossible de serialiser les filtres du brouillon: {error}"))?;

    connection
        .execute(
            "INSERT INTO coin_drafts (
               id, coin_id, mode, title, document_type, subject, location, reference,
               personal_reference, note, display_date, revolutionary_date, sort_date,
               sort_date_precision, selected_filter_ids, created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
             ON CONFLICT(id) DO UPDATE SET
               coin_id = excluded.coin_id,
               mode = excluded.mode,
               title = excluded.title,
               document_type = excluded.document_type,
               subject = excluded.subject,
               location = excluded.location,
               reference = excluded.reference,
               personal_reference = excluded.personal_reference,
               note = excluded.note,
               display_date = excluded.display_date,
               revolutionary_date = excluded.revolutionary_date,
               sort_date = excluded.sort_date,
               sort_date_precision = excluded.sort_date_precision,
               selected_filter_ids = excluded.selected_filter_ids,
               updated_at = excluded.updated_at",
            params![
                draft_id,
                input.coin_id,
                serialize_draft_mode(input.mode),
                normalize_optional_text(input.title),
                normalize_optional_text(input.document_type),
                normalize_optional_text(input.subject),
                normalize_optional_text(input.location),
                normalize_optional_text(input.reference),
                normalize_optional_text(input.personal_reference),
                normalize_optional_text(input.note),
                normalize_optional_text(input.display_date),
                normalize_optional_text(input.revolutionary_date),
                normalize_optional_text(input.sort_date),
                serialize_precision(input.sort_date_precision),
                selected_filter_ids,
                created_at,
                updated_at
            ],
        )
        .map_err(|error| format!("Impossible d'enregistrer le brouillon: {error}"))?;

    get_draft_by_id(connection, &draft_id)?.ok_or_else(|| "Brouillon enregistre mais introuvable".to_string())
}

pub fn delete_draft(connection: &Connection, draft_id: &str) -> Result<(), String> {
    let deleted = connection
        .execute("DELETE FROM coin_drafts WHERE id = ?1", params![draft_id])
        .map_err(|error| format!("Impossible de supprimer le brouillon: {error}"))?;

    if deleted == 0 {
        return Err("Brouillon introuvable".to_string());
    }

    Ok(())
}

fn get_coin_by_id(connection: &Connection, coin_id: &str) -> Result<Option<CoinRecord>, String> {
    let mut statement = connection
        .prepare(
            "SELECT
               id, title, document_type, subject, location, reference, personal_reference,
               note, display_date, revolutionary_date, sort_date, sort_date_precision,
               is_draft_promoted, created_at, updated_at
             FROM coins
             WHERE id = ?1",
        )
        .map_err(|error| format!("Impossible de preparer la lecture de la piece: {error}"))?;

    let coin = statement
        .query_row(params![coin_id], map_coin)
        .optional()
        .map_err(|error| format!("Impossible de lire la piece: {error}"))?;

    coin.map(|coin| {
        let filter_ids = list_filter_ids_for_coin(connection, &coin.id)?;
        Ok(CoinRecord { coin, filter_ids })
    })
    .transpose()
}

fn get_filter_by_id(connection: &Connection, filter_id: &str) -> Result<Option<Filter>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, name, description, color, sort_order, created_at, updated_at
             FROM filters
             WHERE id = ?1",
        )
        .map_err(|error| format!("Impossible de preparer la lecture du filtre: {error}"))?;

    statement
        .query_row(params![filter_id], map_filter)
        .optional()
        .map_err(|error| format!("Impossible de lire le filtre: {error}"))
}

fn get_draft_by_id(connection: &Connection, draft_id: &str) -> Result<Option<CoinDraft>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, coin_id, mode, title, document_type, subject, location, reference,
                    personal_reference, note, display_date, revolutionary_date, sort_date,
                    sort_date_precision, selected_filter_ids, created_at, updated_at
             FROM coin_drafts
             WHERE id = ?1",
        )
        .map_err(|error| format!("Impossible de preparer la lecture du brouillon: {error}"))?;

    statement
        .query_row(params![draft_id], map_draft)
        .optional()
        .map_err(|error| format!("Impossible de lire le brouillon: {error}"))
}

fn get_draft_created_at(connection: &Connection, draft_id: &str) -> Result<Option<String>, String> {
    connection
        .query_row(
            "SELECT created_at FROM coin_drafts WHERE id = ?1",
            params![draft_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|error| format!("Impossible de lire la date de creation du brouillon: {error}"))
}

fn replace_coin_filters(
    connection: &Connection,
    coin_id: &str,
    filter_ids: &[String],
) -> Result<(), String> {
    connection
        .execute("DELETE FROM coin_filters WHERE coin_id = ?1", params![coin_id])
        .map_err(|error| format!("Impossible de vider les filtres de la piece: {error}"))?;

    let now = now_iso();
    for filter_id in filter_ids {
        connection
            .execute(
                "INSERT INTO coin_filters (coin_id, filter_id, created_at) VALUES (?1, ?2, ?3)",
                params![coin_id, filter_id, now],
            )
            .map_err(|error| format!("Impossible d'associer le filtre a la piece: {error}"))?;
    }

    Ok(())
}

fn list_filter_ids_for_coin(connection: &Connection, coin_id: &str) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare("SELECT filter_id FROM coin_filters WHERE coin_id = ?1 ORDER BY created_at ASC")
        .map_err(|error| format!("Impossible de preparer la lecture des associations de filtres: {error}"))?;

    let rows = statement
        .query_map(params![coin_id], |row| row.get::<_, String>(0))
        .map_err(|error| format!("Impossible de lire les associations de filtres: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Impossible de mapper les associations de filtres: {error}"))
}

fn next_filter_order(connection: &Connection) -> Result<i64, String> {
    let last_order: Option<i64> = connection
        .query_row("SELECT MAX(sort_order) FROM filters", [], |row| row.get(0))
        .optional()
        .map_err(|error| format!("Impossible de lire le prochain ordre de filtre: {error}"))?
        .flatten();

    Ok(last_order.unwrap_or(0) + 1)
}

fn map_coin(row: &rusqlite::Row<'_>) -> rusqlite::Result<Coin> {
    Ok(Coin {
        id: row.get(0)?,
        title: row.get(1)?,
        document_type: row.get(2)?,
        subject: row.get(3)?,
        location: row.get(4)?,
        reference: row.get(5)?,
        personal_reference: row.get(6)?,
        note: row.get(7)?,
        display_date: row.get(8)?,
        revolutionary_date: row.get(9)?,
        sort_date: row.get(10)?,
        sort_date_precision: deserialize_precision(row.get(11)?),
        is_draft_promoted: row.get::<_, i64>(12)? == 1,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
    })
}

fn map_filter(row: &rusqlite::Row<'_>) -> rusqlite::Result<Filter> {
    Ok(Filter {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        color: row.get(3)?,
        sort_order: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

fn map_draft(row: &rusqlite::Row<'_>) -> rusqlite::Result<CoinDraft> {
    let selected_filter_ids_raw: Option<String> = row.get(14)?;
    let selected_filter_ids = selected_filter_ids_raw
        .as_deref()
        .map(|value| serde_json::from_str::<Vec<String>>(value).unwrap_or_default())
        .unwrap_or_default();

    Ok(CoinDraft {
        id: row.get(0)?,
        coin_id: row.get(1)?,
        mode: deserialize_draft_mode(row.get(2)?),
        title: row.get(3)?,
        document_type: row.get(4)?,
        subject: row.get(5)?,
        location: row.get(6)?,
        reference: row.get(7)?,
        personal_reference: row.get(8)?,
        note: row.get(9)?,
        display_date: row.get(10)?,
        revolutionary_date: row.get(11)?,
        sort_date: row.get(12)?,
        sort_date_precision: deserialize_precision(row.get(13)?),
        selected_filter_ids,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

fn normalize_required_text(value: &str, error_message: &str) -> Result<String, String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(error_message.to_string());
    }
    Ok(trimmed.to_string())
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|item| {
        let trimmed = item.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    })
}

fn serialize_precision(value: Option<SortDatePrecision>) -> Option<String> {
    value.map(|precision| match precision {
        SortDatePrecision::Year => "year".to_string(),
        SortDatePrecision::Month => "month".to_string(),
        SortDatePrecision::Day => "day".to_string(),
        SortDatePrecision::Unknown => "unknown".to_string(),
    })
}

fn deserialize_precision(value: Option<String>) -> Option<SortDatePrecision> {
    value.and_then(|item| match item.as_str() {
        "year" => Some(SortDatePrecision::Year),
        "month" => Some(SortDatePrecision::Month),
        "day" => Some(SortDatePrecision::Day),
        "unknown" => Some(SortDatePrecision::Unknown),
        _ => None,
    })
}

fn serialize_draft_mode(value: DraftMode) -> String {
    match value {
        DraftMode::Create => "create".to_string(),
        DraftMode::Edit => "edit".to_string(),
    }
}

fn deserialize_draft_mode(value: String) -> DraftMode {
    match value.as_str() {
        "edit" => DraftMode::Edit,
        _ => DraftMode::Create,
    }
}

fn map_constraint_error(error: rusqlite::Error) -> String {
    let raw = error.to_string();
    if raw.contains("UNIQUE constraint failed: filters.name") {
        "Un filtre avec ce nom existe deja".to_string()
    } else {
        format!("Erreur SQLite: {raw}")
    }
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{CreateCoinInput, CreateFilterInput, DraftMode, SaveDraftInput, UpdateCoinInput};

    fn temp_db_path() -> PathBuf {
        std::env::temp_dir().join(format!("numisherch-test-{}.sqlite", Uuid::new_v4()))
    }

    #[test]
    fn creates_schema_and_runs_basic_crud() {
        let db_path = temp_db_path();
        let mut connection = open_connection(&db_path).expect("db open");
        run_migrations(&connection).expect("migrations");

        let filter = create_filter(
            &mut connection,
            CreateFilterInput {
                name: "Atelier Paris".into(),
                description: Some("atelier".into()),
                color: None,
            },
        )
        .expect("create filter");

        let created = create_coin(
            &mut connection,
            CreateCoinInput {
                title: "5 sols a la balance".into(),
                document_type: Some("Piece".into()),
                subject: Some("Monnaie".into()),
                location: None,
                reference: None,
                personal_reference: Some("COL-001".into()),
                note: Some("Premiere fiche".into()),
                display_date: Some("1792".into()),
                revolutionary_date: Some("an I".into()),
                sort_date: Some("1792-01-01".into()),
                sort_date_precision: Some(SortDatePrecision::Year),
                filter_ids: vec![filter.id.clone()],
            },
        )
        .expect("create coin");

        assert_eq!(created.coin.title, "5 sols a la balance");
        assert_eq!(created.filter_ids, vec![filter.id.clone()]);

        let updated = update_coin(
            &mut connection,
            &created.coin.id,
            UpdateCoinInput {
                title: "5 sols a la balance modifie".into(),
                document_type: Some("Piece".into()),
                subject: None,
                location: Some("Paris".into()),
                reference: None,
                personal_reference: Some("COL-001".into()),
                note: None,
                display_date: Some("1793".into()),
                revolutionary_date: Some("an II".into()),
                sort_date: Some("1793-01-01".into()),
                sort_date_precision: Some(SortDatePrecision::Year),
                filter_ids: vec![filter.id.clone()],
            },
        )
        .expect("update coin");

        assert_eq!(updated.coin.title, "5 sols a la balance modifie");

        let draft = save_draft(
            &connection,
            SaveDraftInput {
                id: None,
                coin_id: Some(updated.coin.id.clone()),
                mode: DraftMode::Edit,
                title: Some("Brouillon".into()),
                document_type: None,
                subject: None,
                location: None,
                reference: None,
                personal_reference: None,
                note: None,
                display_date: None,
                revolutionary_date: None,
                sort_date: None,
                sort_date_precision: None,
                selected_filter_ids: vec![filter.id.clone()],
            },
        )
        .expect("save draft");

        assert_eq!(draft.mode as u8, DraftMode::Edit as u8);
        assert!(get_coin_draft(&connection, &updated.coin.id)
            .expect("get coin draft")
            .is_some());

        delete_draft(&connection, &draft.id).expect("delete draft");
        delete_coin(&connection, &updated.coin.id).expect("delete coin");
        delete_filter(&connection, &filter.id).expect("delete filter");

        let overview = get_overview(&connection, &db_path).expect("overview");
        assert_eq!(overview.coin_count, 0);
        assert_eq!(overview.filter_count, 0);

        let _ = fs::remove_file(db_path);
    }
}
