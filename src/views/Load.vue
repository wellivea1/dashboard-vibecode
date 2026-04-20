<template>
    <v-main
        style="padding-bottom:56px"
    >

        <div style="display:none">
            <input
                type="file"
                ref="opener"
                :accept="supported_extensions"
                @change="add_diaries"
                multiple
            >
        </div>

        <div style="height:100%;margin:auto;max-width:600px" class="d-flex flex-column justify-center">
            <v-list
                style="margin:auto;padding:1em"
                v-if="diaries.length"
                two-line
            >
                <v-list-item
                    v-for="[id,diary,engine] in diaries"
                    :key="id"
                >
                    <v-list-item-avatar>
                        <v-icon v-if="engine.icon">{{engine.icon}}</v-icon>
                        <v-img v-else-if="engine.logo" :src="engine.logo"/>
                        <span
                            v-else
                        >
                            {{engine.name.substr(0,1)}}
                        </span>
                    </v-list-item-avatar>

                    <v-list-item-content>
                        <v-list-item-title>{{engine.title}}</v-list-item-title>

                        <v-list-item-subtitle>Last updated {{get_last_update(diary)}}</v-list-item-subtitle>
                    </v-list-item-content>

                    <v-list-item-action @click="remove_diary(id)">
                        <v-btn icon>
                            <v-icon>
                                mdi-delete
                            </v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>
            </v-list>

            <div :class="diaries.length?'mt-8 mb-16':''" style="text-align:center">

                <v-btn
                    color="primary"
                    @click="$refs.opener.click()"
                >
                    Add a diary, export, or spreadsheet
                </v-btn>

                <div class="mt-4">
                    <v-btn
                        outlined
                        color="primary"
                        @click="fitbit_popup = true"
                    >
                        Import from Fitbit API
                    </v-btn>
                </div>

                <p class="mt-3" v-if="!diaries.length">
                    Google/Fitbit exports can be incomplete or slow.<br>
                    You can also import sleep records directly from the Fitbit API.
                </p>

                <p class="mt-6" v-if="!diaries.length">
                Don't have a diary yet?<br/>
                <a :href="docs_url+'create'">Create a diary</a> or <a @click.prevent="demo_popup=true" href="#demo">try an example</a>
                </p>

            </div>

        </div>

        <v-dialog
            v-model="demo_popup"
            width="400"
        >

            <v-card>
                <v-card-title class="text-h5">
                    Choose a diary...
                </v-card-title>

                <v-card-text>
                    <v-list v-if="common_sleep_diaries">
                        <v-list-item-group>
                            <v-list-item
                              v-for="diary in common_sleep_diaries"
                              :key="diary.filename"
                              @click="load_demo(diary.filename)"
                            >
                                <v-list-item-content>
                                    <v-list-item-title v-text="diary.short_title.replace(/^(.)/,(_,l)=>l.toUpperCase())"></v-list-item-title>
                                </v-list-item-content>
                            </v-list-item>
                        </v-list-item-group>
                    </v-list>
                    <template v-else>
                        Could not load the list of demo files.<br>
                        Please try again later.
                    </template>
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        width="50%"
                        text
                        href="/resources/common_sleep_diaries"
                    >
                        Learn more
                    </v-btn>
                    <v-btn
                        color="primary"
                        width="50%"
                        text
                        @click="demo_popup = false"
                    >
                        <v-icon>mdi-close</v-icon>
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>

        <v-dialog
            v-model="fitbit_popup"
            width="460"
        >

            <v-card>
                <v-card-title class="text-h5">
                    Import from Fitbit API
                </v-card-title>

                <v-card-text>
                    <p>
                        Create a Fitbit <strong>Personal</strong> app, then register this exact callback URL in Fitbit:
                    </p>
                    <p style="word-break:break-all">
                        <code>{{fitbit_redirect_uri}}</code>
                    </p>
                    <p>
                        The redirect URI must exactly match a callback URL registered with Fitbit, including the trailing slash.
                    </p>

                    <v-text-field
                        v-model="fitbit_client_id"
                        label="Client ID"
                        hint="Paste the Fitbit OAuth 2.0 Client ID for your Personal app"
                        persistent-hint
                    />

                    <v-menu
                        ref="fitbit_start"
                        v-model="show_fitbit_start_picker"
                        :close-on-content-click="false"
                        :return-value.sync="fitbit_start_date"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                    >
                        <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                                v-model="fitbit_start_date"
                                label="Start date"
                                prepend-icon="mdi-calendar"
                                readonly
                                v-bind="attrs"
                                v-on="on"
                            />
                        </template>
                        <v-date-picker
                            v-model="fitbit_start_date"
                            no-title
                            scrollable
                            :max="fitbit_end_date || undefined"
                        >
                            <v-spacer></v-spacer>
                            <v-btn
                                text
                                color="primary"
                                @click="show_fitbit_start_picker = false"
                            >
                                Cancel
                            </v-btn>
                            <v-btn
                                text
                                color="primary"
                                @click="$refs.fitbit_start.save(fitbit_start_date)"
                            >
                                OK
                            </v-btn>
                        </v-date-picker>
                    </v-menu>

                    <v-menu
                        ref="fitbit_end"
                        v-model="show_fitbit_end_picker"
                        :close-on-content-click="false"
                        :return-value.sync="fitbit_end_date"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                    >
                        <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                                v-model="fitbit_end_date"
                                label="End date"
                                prepend-icon="mdi-calendar"
                                readonly
                                v-bind="attrs"
                                v-on="on"
                            />
                        </template>
                        <v-date-picker
                            v-model="fitbit_end_date"
                            no-title
                            scrollable
                            :min="fitbit_start_date || undefined"
                        >
                            <v-spacer></v-spacer>
                            <v-btn
                                text
                                color="primary"
                                @click="show_fitbit_end_picker = false"
                            >
                                Cancel
                            </v-btn>
                            <v-btn
                                text
                                color="primary"
                                @click="$refs.fitbit_end.save(fitbit_end_date)"
                            >
                                OK
                            </v-btn>
                        </v-date-picker>
                    </v-menu>

                    <p class="mb-0">
                        Sleep Diary only requests the <code>sleep</code> scope, and your Fitbit data stays in your browser.
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        width="50%"
                        text
                        @click="fitbit_popup = false"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        width="50%"
                        text
                        :disabled="!fitbit_client_id || !fitbit_start_date || !fitbit_end_date || fitbit_loading"
                        :loading="fitbit_loading"
                        @click="start_fitbit_import"
                    >
                        <v-icon>mdi-cloud-download-outline</v-icon>
                        Connect
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>

        <v-dialog
            v-model="fitbit_error_popup"
            width="400"
        >

            <v-card>
                <v-card-title class="text-h5">
                    Could not import from Fitbit
                </v-card-title>

                <v-card-text>
                    {{fitbit_error_message}}
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        color="primary"
                        width="100%"
                        text
                        @click="fitbit_error_popup = false"
                    >
                        <v-icon>mdi-close</v-icon>
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>

        <v-dialog
            v-model="error"
            width="400"
        >

            <v-card>
                <v-card-title class="text-h5">
                    Could not load diary
                </v-card-title>

                <v-card-text>
                    This file does not appear to be in a supported format.<br>
                    Please try a different file.
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        width="50%"
                        text
                        href="/docs/create/formats"
                    >
                        Learn more
                    </v-btn>
                    <v-btn
                        color="primary"
                        width="50%"
                        text
                        @click="error = false"
                    >
                        <v-icon>mdi-close</v-icon>
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>

    </v-main>

</template>

<script>

import diary_manager from "@/diary_manager.js";
import { DOCS_URL } from "@/constants.js";
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

const FITBIT_CLIENT_ID_KEY = "dashboard.fitbit.client_id";
const FITBIT_RANGE_START_KEY = "dashboard.fitbit.range.start";
const FITBIT_RANGE_END_KEY = "dashboard.fitbit.range.end";

function iso_today(days_ago) {
    return new Date(
        Date.now()
        - ( new Date() ).getTimezoneOffset() * 60*1000
        - 1000*60*60*24*(days_ago||0)
    ).toISOString().substr(0,10);
}

function get_saved_fitbit_client_id() {
    try {
        return window.localStorage.getItem(FITBIT_CLIENT_ID_KEY) || "";
    } catch (e) {
        return "";
    }
}

export default {

     name: 'Load',

     data: () => ({
         supported_extensions: (
             window.sleepdiary_engines.map( f => f.extension ).join(",")
             + ',.sqlite,.db,History'
         ),
         sleepdiary_engines: (
             window.sleepdiary_engines
                   .filter( engine => engine.name != 'Standard' && engine.name != "ActivityLog" )
                   .sort( (a,b) => a.title.localeCompare(b.title) )
         ),
         activity_log: (
             window.sleepdiary_engines
                   .filter( engine => engine.name == "ActivityLog" )
         )[0],
         trigger_rebuild: 1,
         error: false,
         docs_url: DOCS_URL,
         demo_popup: false,
         common_sleep_diaries: 0,
         fitbit_popup: false,
         fitbit_loading: false,
         fitbit_client_id: get_saved_fitbit_client_id(),
         fitbit_start_date: iso_today(365),
         fitbit_end_date: iso_today(0),
         show_fitbit_start_picker: false,
         show_fitbit_end_picker: false,
         fitbit_redirect_uri: get_fitbit_redirect_uri(),
         fitbit_error_popup: false,
         fitbit_error_message: '',
     }),

     computed: {
         diaries() {
             return this.trigger_rebuild && diary_manager.get_diaries();
         },
     },

     mounted() {
         this.$emit('retitle',"Load diary");
         this.$emit("busy");
         diary_manager.on_init( (is_only_diary,is_error) => this.on_diary_load(is_only_diary,is_error) );
         diary_manager.add_permanent_callback( 'load', (is_only_diary,is_error) => this.on_diary_load(is_only_diary,is_error) );
         fetch("/resources/common_sleep_diaries.json")
           .then( r => r.json() )
           .then( j => this.common_sleep_diaries = j );
         this.restore_fitbit_settings();
         this.process_fitbit_callback();
     },

     methods: {
         get_fitbit_range() {
             return [
                 this.fitbit_start_date,
                 this.fitbit_end_date,
             ].filter( value => value ).slice().sort();
         },
         set_fitbit_error(message) {
             this.fitbit_error_message = message;
             this.fitbit_error_popup = true;
         },
         restore_fitbit_settings() {
             try {
                 this.fitbit_client_id = sessionStorage.getItem(FITBIT_CLIENT_ID_KEY) || this.fitbit_client_id;
                 const start = sessionStorage.getItem(FITBIT_RANGE_START_KEY),
                       end = sessionStorage.getItem(FITBIT_RANGE_END_KEY)
                 ;
                 if ( start && end ) {
                     this.fitbit_start_date = start;
                     this.fitbit_end_date = end;
                 }
             } catch (e) {
                 // Ignore browsers that block storage access.
             }
         },
         async process_fitbit_callback() {
             const callback_error = get_fitbit_callback_error(),
                   code = get_fitbit_callback_code(),
                   state = get_fitbit_callback_state()
             ;
             if ( !code && !callback_error ) return;

             clear_fitbit_callback_code();

             if ( callback_error ) {
                 return this.set_fitbit_error("Fitbit authorization failed: " + callback_error);
             }

             if ( !validate_fitbit_callback_state(state) ) {
                 return this.set_fitbit_error("Fitbit authorization could not be verified. Please try again.");
             }

             this.restore_fitbit_settings();

             if ( !this.fitbit_client_id ) {
                 return this.set_fitbit_error("No Fitbit Client ID was saved for this authorization.");
             }

             const range = this.get_fitbit_range();
             if ( range.length != 2 ) {
                 return this.set_fitbit_error("Please choose a start and end date.");
             }

             this.fitbit_loading = true;
             this.$emit("busy");

             try {
                 const token = await exchange_fitbit_code(this.fitbit_client_id,code),
                       sleep_data = await fetch_fitbit_sleep_range(
                           token.access_token,
                           range[0],
                           range[1],
                       )
                 ;

                 diary_manager.add_diary_contents(JSON.stringify(sleep_data));
                 this.fitbit_popup = false;
             } catch (error) {
                 this.$emit("idle");
                 this.set_fitbit_error(error && error.message ? error.message : "Fitbit import failed.");
             } finally {
                 this.fitbit_loading = false;
                 try {
                     sessionStorage.removeItem(FITBIT_RANGE_START_KEY);
                     sessionStorage.removeItem(FITBIT_RANGE_END_KEY);
                 } catch (e) {
                     // Ignore storage cleanup failures.
                 }
             }
         },
         on_diary_load(is_only_diary,is_error) {
             if ( is_error ) {
                 this.$emit("idle");
                 this.error = true;
             }  else if ( is_only_diary ) {
                 this.$router.push({ path: '/info' });
             } else {
                 this.$emit("idle");
                 ++this.trigger_rebuild;
             }
         },
         add_diaries(event) {
             this.$emit("busy");
             diary_manager.add_diaries(event);
         },
         get_last_update(diary) {
             const records = diary.to("Standard").records;
             for ( let n=records.length-1; n>=0; --n ) {
                 const ret = records[n].end||records[n].start;
                 if ( ret ) return new Date().toISOString().split("T")[0];
             }
             return "(never)";
         },
         remove_diary(id) {
             diary_manager.remove_diary(id);
             ++this.trigger_rebuild;
         },
         load_demo(filename) {
           this.$emit("busy");
           diary_manager.add_demo('/resources/common_sleep_diaries/'+filename);
         },
         async start_fitbit_import() {
             const range = this.get_fitbit_range();

             if ( range.length != 2 ) {
                 return this.set_fitbit_error("Please choose a start and end date.");
             }

             try {
                 window.localStorage.setItem(FITBIT_CLIENT_ID_KEY,this.fitbit_client_id);
             } catch (e) {
                 // Ignore browsers that block storage access.
             }

             try {
                 window.sessionStorage.setItem(FITBIT_CLIENT_ID_KEY,this.fitbit_client_id);
                 window.sessionStorage.setItem(FITBIT_RANGE_START_KEY,range[0]);
                 window.sessionStorage.setItem(FITBIT_RANGE_END_KEY,range[1]);
             } catch (e) {
                 return this.set_fitbit_error("Session storage is required for Fitbit API import.");
             }

             this.fitbit_loading = true;

             try {
                 await start_fitbit_auth(this.fitbit_client_id);
             } catch (error) {
                 this.fitbit_loading = false;
                 this.set_fitbit_error(error && error.message ? error.message : "Could not start Fitbit authorization.");
             }
         },
     },

 }
</script>
