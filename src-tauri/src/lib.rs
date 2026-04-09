mod commands;
mod db;
mod models;

use commands::{
    create_coin_command, create_filter_command, delete_coin_command, delete_draft_command,
    delete_filter_command, get_app_overview, get_coin_draft_command, get_coins, get_creation_draft_command,
    get_drafts_command, get_filters, save_draft_command, update_coin_command, update_filter_command,
};
use db::initialize_database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

            let database_state = initialize_database(app.handle())?;
            app.manage(database_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_overview,
            get_coins,
            create_coin_command,
            update_coin_command,
            delete_coin_command,
            get_filters,
            create_filter_command,
            update_filter_command,
            delete_filter_command,
            get_creation_draft_command,
            get_coin_draft_command,
            get_drafts_command,
            save_draft_command,
            delete_draft_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
