"use strict";

const FITBIT_AUTHORIZE_URL = "https://www.fitbit.com/oauth2/authorize";
const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const FITBIT_API_URL = "https://api.fitbit.com";
const FITBIT_SCOPE = "sleep";
const PKCE_VERIFIER_KEY = "dashboard.fitbit.pkce_verifier";
const PKCE_STATE_KEY = "dashboard.fitbit.oauth_state";

function fitbit_redirect_uri() {
    return window.location.href.split(/[?#]/)[0];
}

function random_string(length=128) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",
          bytes = crypto.getRandomValues(new Uint8Array(length))
    ;
    return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
}

async function pkce_challenge(verifier) {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
    );
    return btoa(String.fromCharCode.apply(null,Array.from(new Uint8Array(digest))))
        .replace(/\+/g,"-")
        .replace(/\//g,"_")
        .replace(/=+$/,"")
    ;
}

async function fitbit_token_request(params) {
    const response = await fetch(
        FITBIT_TOKEN_URL,
        {
            "method": "POST",
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            "body": params.toString(),
        },
    );
    if ( !response.ok ) {
        throw new Error(
            "Fitbit token request failed: "
            + response.status
            + " "
            + await response.text()
        );
    }
    return response.json();
}

async function fitbit_fetch_json(url,access_token) {
    const response = await fetch(
        url,
        {
            "headers": {
                "Authorization": "Bearer " + access_token,
            },
            "mode": "cors",
        },
    );
    if ( !response.ok ) {
        throw new Error(
            "Fitbit API request failed: "
            + response.status
            + " "
            + await response.text()
        );
    }
    const json = await response.json();
    if ( json.meta && json.meta.state ) {
        throw new Error("Fitbit API returned: " + json.meta.state);
    }
    return json;
}

function get_first_defined_value(record,keys) {
    for ( let n=0; n!=keys.length; ++n ) {
        const value = record[keys[n]];
        if ( value !== undefined && value !== null && value !== "" ) {
            return value;
        }
    }
}

function get_fitbit_record_date(record) {
    const explicit_date = get_first_defined_value(record,["dateOfSleep","DateOfSleep"]);
    if ( explicit_date ) return explicit_date;
    const end_time = get_first_defined_value(record,["endTime","EndDate"]);
    if ( end_time && end_time.split ) return end_time.split("T")[0];
    const start_time = get_first_defined_value(record,["startTime","StartDate"]);
    if ( start_time && start_time.split ) return start_time.split("T")[0];
    return "";
}

function get_fitbit_record_sort_time(record) {
    const end_time = parse_fitbit_timestamp( get_first_defined_value(record,["endTime","EndDate"]) );
    if ( !isNaN(end_time) ) return end_time;
    const start_time = parse_fitbit_timestamp( get_first_defined_value(record,["startTime","StartDate"]) );
    return isNaN(start_time) ? 0 : start_time;
}

function parse_fitbit_timestamp(value) {
    if ( !value ) return NaN;
    value = new Date(value).getTime();
    return isNaN(value) ? NaN : value;
}

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

function get_fitbit_record_key(record) {
    const log_id = get_first_defined_value(record,["logId","LogId"]);
    if ( log_id !== undefined && log_id !== null && log_id !== "" ) {
        return "log:" + log_id;
    }
    return [
        get_fitbit_record_date(record),
        get_first_defined_value(record,["startTime","StartDate"]) || "",
        get_first_defined_value(record,["endTime","EndDate"]) || "",
    ].join("|");
}

export function get_fitbit_callback_code() {
    return new URL(window.location.href).searchParams.get("code");
}

export function get_fitbit_callback_error() {
    const url = new URL(window.location.href),
          error = url.searchParams.get("error")
    ;
    if ( !error ) return "";
    return url.searchParams.get("error_description") || error;
}

export function get_fitbit_callback_state() {
    return new URL(window.location.href).searchParams.get("state");
}

export function clear_fitbit_callback_code() {
    const url = new URL(window.location.href),
          hash = window.location.hash
    ;
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState(
        {},
        "",
        url.pathname + ( url.search ? url.search : "" ) + hash,
    );
}

export function get_fitbit_redirect_uri() {
    return fitbit_redirect_uri();
}

export function validate_fitbit_callback_state(state) {
    try {
        const expected_state = window.sessionStorage.getItem(PKCE_STATE_KEY);
        window.sessionStorage.removeItem(PKCE_STATE_KEY);
        return !!state && !!expected_state && state == expected_state;
    } catch (e) {
        return false;
    }
}

export async function start_fitbit_auth(client_id) {
    if ( !client_id ) {
        throw new Error("Please enter a Fitbit Client ID.");
    }
    const verifier = random_string(),
          challenge = await pkce_challenge(verifier),
          state = random_string(64),
          params = new URLSearchParams({
              "response_type": "code",
              "client_id": client_id,
              "redirect_uri": fitbit_redirect_uri(),
              "scope": FITBIT_SCOPE,
              "code_challenge": challenge,
              "code_challenge_method": "S256",
              "state": state,
          })
    ;
    window.sessionStorage.setItem(PKCE_VERIFIER_KEY,verifier);
    window.sessionStorage.setItem(PKCE_STATE_KEY,state);
    window.location.href = FITBIT_AUTHORIZE_URL + "?" + params.toString();
}

export async function exchange_fitbit_code(client_id,code) {
    const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if ( !verifier ) {
        throw new Error("No Fitbit PKCE verifier was found in this browser session.");
    }
    window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    return fitbit_token_request(
        new URLSearchParams({
            "client_id": client_id,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": fitbit_redirect_uri(),
            "code_verifier": verifier,
        })
    );
}

export async function fetch_fitbit_sleep_range(access_token,start,end,progress_callback) {
    let before_date = add_days_to_iso_date(end,1),
        records = [],
        pages = 0,
        seen = {}
    ;

    /*
     * Fitbit's sleep/list pagination can stop early without returning a next
     * cursor even when older records still exist. To avoid silently missing
     * days, keep restarting the query with beforeDate set to the oldest
     * dateOfSleep seen in the previous batch.
     */
    while ( before_date ) {
        let url = (
                FITBIT_API_URL
                + "/1.2/user/-/sleep/list.json?beforeDate="
                + encodeURIComponent(before_date)
                + "&sort=desc&offset=0&limit=100"
            ),
            oldest_date_in_batch = ""
        ;

        while ( url ) {
            const json = await fitbit_fetch_json(url,access_token),
                  raw_records = json.sleep || []
            ;

            raw_records.forEach( record => {
                const record_date = get_fitbit_record_date(record);
                if ( record_date && ( !oldest_date_in_batch || record_date < oldest_date_in_batch ) ) {
                    oldest_date_in_batch = record_date;
                }
                if ( record_date < start || record_date > end ) return;
                const key = get_fitbit_record_key(record);
                if ( seen[key] ) return;
                seen[key] = true;
                records.push(record);
            });

            ++pages;

            if ( progress_callback ) {
                progress_callback(records.length,pages);
            }

            url = json.pagination && json.pagination.next ? json.pagination.next : "";
        }

        if ( !oldest_date_in_batch || oldest_date_in_batch >= before_date ) break;
        if ( oldest_date_in_batch <= start ) break;
        before_date = oldest_date_in_batch;
    }

    records.sort( (a,b) => get_fitbit_record_sort_time(b) - get_fitbit_record_sort_time(a) );

    return { "sleep": records };
}
