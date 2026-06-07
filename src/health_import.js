"use strict";

import {
    clear_fitbit_callback_code,
    exchange_fitbit_code,
    fetch_fitbit_sleep_range,
    get_fitbit_callback_code,
    get_fitbit_callback_error,
    get_fitbit_callback_state,
    get_fitbit_redirect_uri,
    start_fitbit_auth,
    validate_fitbit_callback_state,
} from "@/fitbit_api.js";

import {
    fetch_google_health_sleep_range,
    get_google_health_scope,
    load_google_health_auth,
    start_google_health_auth,
} from "@/google_health_api.js";

const GOOGLE_HEALTH_CLIENT_ID = process.env.VUE_APP_GOOGLE_HEALTH_CLIENT_ID || "";

export const HEALTH_IMPORT_PROVIDERS = [
    {
        "id": "google_health",
        "title": "Google Health",
        "short_title": "Google Health",
        "client_id": GOOGLE_HEALTH_CLIENT_ID,
        "client_id_label": "OAuth Client ID",
        "client_id_hint": "Paste the Google OAuth Web Client ID for this dashboard",
        "client_id_storage_key": "dashboard.google_health.client_id",
        "range_start_storage_key": "dashboard.google_health.range.start",
        "range_end_storage_key": "dashboard.google_health.range.end",
        "setup_lines": GOOGLE_HEALTH_CLIENT_ID ? [] : [
            "Create a Google Cloud Web application client, enable Google Health API, and add this site as an authorized JavaScript origin:",
            "https://wellivea1.github.io",
        ],
        "scope_note": "Zeitlog requests only the " + get_google_health_scope() + " scope, and your Google Health data stays in your browser.",
        "preload": load_google_health_auth,
        "start_auth": start_google_health_auth,
        "fetch_sleep_range": fetch_google_health_sleep_range,
    },
    {
        "id": "fitbit",
        "title": "Fitbit Web API",
        "short_title": "Fitbit",
        "client_id_label": "Client ID",
        "client_id_hint": "Paste the Fitbit OAuth 2.0 Client ID for your Personal app",
        "client_id_storage_key": "dashboard.fitbit.client_id",
        "range_start_storage_key": "dashboard.fitbit.range.start",
        "range_end_storage_key": "dashboard.fitbit.range.end",
        "setup_lines": [
            "Create a Fitbit Personal app, then register this exact callback URL in Fitbit:",
            get_fitbit_redirect_uri(),
            "The redirect URI must exactly match a callback URL registered with Fitbit, including the trailing slash.",
        ],
        "scope_note": "Zeitlog only requests the sleep scope, and your Fitbit data stays in your browser. Fitbit Web API is a legacy path scheduled for deprecation in September 2026.",
        "get_callback_code": get_fitbit_callback_code,
        "get_callback_error": get_fitbit_callback_error,
        "get_callback_state": get_fitbit_callback_state,
        "clear_callback": clear_fitbit_callback_code,
        "validate_callback_state": validate_fitbit_callback_state,
        "start_auth": start_fitbit_auth,
        "exchange_code": exchange_fitbit_code,
        "fetch_sleep_range": fetch_fitbit_sleep_range,
    },
];

export function get_health_import_provider(id) {
    return HEALTH_IMPORT_PROVIDERS.filter( provider => provider.id == id )[0] || HEALTH_IMPORT_PROVIDERS[0];
}
