"use strict";

const GOOGLE_IDENTITY_SERVICES_URL = "https://accounts.google.com/gsi/client";
const GOOGLE_HEALTH_API_URL = "https://health.googleapis.com/v4";
const GOOGLE_HEALTH_SCOPE = "https://www.googleapis.com/auth/googlehealth.sleep.readonly";

let google_identity_services_loading;

function add_days_to_iso_date(date_string,days) {
    const parts = date_string.split("-"),
          date = new Date(Date.UTC(
              parseInt(parts[0],10),
              parseInt(parts[1],10)-1,
              parseInt(parts[2],10) + days
          ))
    ;
    return date.toISOString().slice(0,10);
}

function get_google_health_error_message(error) {
    if ( !error ) return "Google Health authorization failed.";
    if ( error.message ) return error.message;
    if ( error.type ) return "Google Health authorization failed: " + error.type;
    if ( error.error ) return error.error_description || error.error;
    return "Google Health authorization failed.";
}

function google_identity_services_ready() {
    return !!(
        window.google
        && window.google.accounts
        && window.google.accounts.oauth2
        && window.google.accounts.oauth2.initTokenClient
    );
}

export function load_google_health_auth() {
    if ( google_identity_services_ready() ) return Promise.resolve();

    if ( !google_identity_services_loading ) {
        google_identity_services_loading = new Promise((resolve,reject) => {
            const existing_script = document.querySelector(
                'script[src="' + GOOGLE_IDENTITY_SERVICES_URL + '"]'
            );
            if ( existing_script ) {
                existing_script.addEventListener("load",() => resolve());
                existing_script.addEventListener("error",() => reject(new Error("Could not load Google Identity Services.")));
                return;
            }

            const script = document.createElement("script");
            script.src = GOOGLE_IDENTITY_SERVICES_URL;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Could not load Google Identity Services."));
            document.head.appendChild(script);
        }).then(() => {
            if ( !google_identity_services_ready() ) {
                throw new Error("Google Identity Services did not initialise.");
            }
        });
    }

    return google_identity_services_loading;
}

export async function start_google_health_auth(client_id) {
    if ( !client_id ) {
        throw new Error("Please enter a Google OAuth Client ID.");
    }

    await load_google_health_auth();

    return new Promise((resolve,reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
            "client_id": client_id,
            "scope": GOOGLE_HEALTH_SCOPE,
            "callback": response => {
                if ( response && response.access_token ) {
                    resolve(response);
                } else {
                    reject(new Error(get_google_health_error_message(response)));
                }
            },
            "error_callback": error => reject(new Error(get_google_health_error_message(error))),
        });

        client.requestAccessToken();
    });
}

async function google_health_fetch_json(url,access_token) {
    const response = await fetch(
        url,
        {
            "headers": {
                "Accept": "application/json",
                "Authorization": "Bearer " + access_token,
            },
            "mode": "cors",
        },
    );
    if ( !response.ok ) {
        throw new Error(
            "Google Health API request failed: "
            + response.status
            + " "
            + await response.text()
        );
    }
    return response.json();
}

function get_google_health_sleep_interval(record) {
    return record && record.sleep && record.sleep.interval ? record.sleep.interval : {};
}

function get_google_health_sleep_time(record,key) {
    const interval = get_google_health_sleep_interval(record),
          time = new Date(interval[key] || 0).getTime()
    ;
    return isNaN(time) ? 0 : time;
}

function get_google_health_sleep_key(record) {
    const interval = get_google_health_sleep_interval(record);
    if ( record.name ) return record.name;
    return [
        interval.startTime || "",
        interval.endTime || "",
        ((record.dataSource||{}).device||{}).displayName || "",
        (record.dataSource||{}).platform || "",
    ].join("|");
}

export async function fetch_google_health_sleep_range(access_token,start,end,progress_callback) {
    const exclusive_end = add_days_to_iso_date(end,1),
          filter = (
              'sleep.interval.civil_end_time >= "'
              + start
              + '" AND sleep.interval.civil_end_time < "'
              + exclusive_end
              + '"'
          )
    ;

    let records = [],
        pages = 0,
        seen = {},
        page_token = ""
    ;

    do {
        const params = new URLSearchParams({
            "pageSize": "25",
            "filter": filter,
        });
        if ( page_token ) params.set("pageToken",page_token);

        const json = await google_health_fetch_json(
            GOOGLE_HEALTH_API_URL
            + "/users/me/dataTypes/sleep/dataPoints?"
            + params.toString(),
            access_token,
        );

        (json.dataPoints || []).forEach( record => {
            const key = get_google_health_sleep_key(record);
            if ( seen[key] ) return;
            seen[key] = true;
            records.push(record);
        });

        ++pages;

        if ( progress_callback ) {
            progress_callback(records.length,pages);
        }

        page_token = json.nextPageToken || "";
    } while ( page_token );

    records.sort(
        (a,b) => (
            get_google_health_sleep_time(b,"startTime")
            - get_google_health_sleep_time(a,"startTime")
        ) || (
            get_google_health_sleep_time(b,"endTime")
            - get_google_health_sleep_time(a,"endTime")
        )
    );

    return { "dataPoints": records };
}

export function get_google_health_scope() {
    return GOOGLE_HEALTH_SCOPE;
}
