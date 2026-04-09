use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SortDatePrecision {
    Year,
    Month,
    Day,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Coin {
    pub id: String,
    pub title: String,
    pub document_type: Option<String>,
    pub subject: Option<String>,
    pub location: Option<String>,
    pub reference: Option<String>,
    pub personal_reference: Option<String>,
    pub note: Option<String>,
    pub display_date: Option<String>,
    pub revolutionary_date: Option<String>,
    pub sort_date: Option<String>,
    pub sort_date_precision: Option<SortDatePrecision>,
    pub is_draft_promoted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinRecord {
    #[serde(flatten)]
    pub coin: Coin,
    pub filter_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Filter {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoinDraft {
    pub id: String,
    pub coin_id: Option<String>,
    pub mode: DraftMode,
    pub title: Option<String>,
    pub document_type: Option<String>,
    pub subject: Option<String>,
    pub location: Option<String>,
    pub reference: Option<String>,
    pub personal_reference: Option<String>,
    pub note: Option<String>,
    pub display_date: Option<String>,
    pub revolutionary_date: Option<String>,
    pub sort_date: Option<String>,
    pub sort_date_precision: Option<SortDatePrecision>,
    pub selected_filter_ids: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DraftMode {
    Create,
    Edit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCoinInput {
    pub title: String,
    pub document_type: Option<String>,
    pub subject: Option<String>,
    pub location: Option<String>,
    pub reference: Option<String>,
    pub personal_reference: Option<String>,
    pub note: Option<String>,
    pub display_date: Option<String>,
    pub revolutionary_date: Option<String>,
    pub sort_date: Option<String>,
    pub sort_date_precision: Option<SortDatePrecision>,
    pub filter_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCoinInput {
    pub title: String,
    pub document_type: Option<String>,
    pub subject: Option<String>,
    pub location: Option<String>,
    pub reference: Option<String>,
    pub personal_reference: Option<String>,
    pub note: Option<String>,
    pub display_date: Option<String>,
    pub revolutionary_date: Option<String>,
    pub sort_date: Option<String>,
    pub sort_date_precision: Option<SortDatePrecision>,
    pub filter_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFilterInput {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFilterInput {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDraftInput {
    pub id: Option<String>,
    pub coin_id: Option<String>,
    pub mode: DraftMode,
    pub title: Option<String>,
    pub document_type: Option<String>,
    pub subject: Option<String>,
    pub location: Option<String>,
    pub reference: Option<String>,
    pub personal_reference: Option<String>,
    pub note: Option<String>,
    pub display_date: Option<String>,
    pub revolutionary_date: Option<String>,
    pub sort_date: Option<String>,
    pub sort_date_precision: Option<SortDatePrecision>,
    pub selected_filter_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppOverview {
    pub database_path: String,
    pub coin_count: i64,
    pub filter_count: i64,
    pub draft_count: i64,
}
