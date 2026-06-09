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

            <div
                v-if="!diaries.length"
                class="mb-8"
                style="text-align:center"
            >
                <img :src="logo_url" alt="" width="88" height="88">
                <h1 class="text-h4 font-weight-medium mt-2">Zeit<span style="color:#E0A93B">log</span></h1>
                <p class="text--secondary mt-1 mb-0">Sleep tracking for circadian rhythm disorders</p>
            </div>

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
                        @click="open_health_import_popup"
                    >
                        Import sleep data
                    </v-btn>
                </div>

                <p class="mt-3" v-if="!diaries.length">
                    Google/Fitbit exports can be incomplete or slow.<br>
                    You can also import sleep records directly from Google Health or the legacy Fitbit API.
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
            v-model="health_import_popup"
            width="500"
        >

            <v-card>
                <v-card-title class="text-h5">
                    Import Sleep Data
                </v-card-title>

                <v-card-text>
                    <v-btn-toggle
                        v-model="health_import_provider_id"
                        mandatory
                        class="mb-4"
                    >
                        <v-btn
                            v-for="provider in health_import_providers"
                            :key="provider.id"
                            :value="provider.id"
                            small
                        >
                            {{provider.short_title}}
                        </v-btn>
                    </v-btn-toggle>

                    <p
                        v-for="(line,n) in health_import_provider.setup_lines"
                        :key="n"
                        :style="is_health_import_setup_url(line) ? 'word-break:break-all' : ''"
                    >
                        <code v-if="is_health_import_setup_url(line)">{{line}}</code>
                        <template v-else>{{line}}</template>
                    </p>

                    <v-text-field
                        v-if="health_import_needs_client_id"
                        v-model="health_import_client_id"
                        :label="health_import_provider.client_id_label"
                        :hint="health_import_provider.client_id_hint"
                        persistent-hint
                    />

                    <v-menu
                        ref="health_import_start"
                        v-model="show_health_import_start_picker"
                        :close-on-content-click="false"
                        :return-value.sync="health_import_start_date"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                    >
                        <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                                v-model="health_import_start_date"
                                label="Start date"
                                prepend-icon="mdi-calendar"
                                readonly
                                v-bind="attrs"
                                v-on="on"
                            />
                        </template>
                        <v-date-picker
                            v-model="health_import_start_date"
                            no-title
                            scrollable
                            :max="health_import_end_date || undefined"
                        >
                            <v-spacer></v-spacer>
                            <v-btn
                                text
                                color="primary"
                                @click="show_health_import_start_picker = false"
                            >
                                Cancel
                            </v-btn>
                            <v-btn
                                text
                                color="primary"
                                @click="$refs.health_import_start.save(health_import_start_date)"
                            >
                                OK
                            </v-btn>
                        </v-date-picker>
                    </v-menu>

                    <v-menu
                        ref="health_import_end"
                        v-model="show_health_import_end_picker"
                        :close-on-content-click="false"
                        :return-value.sync="health_import_end_date"
                        transition="scale-transition"
                        offset-y
                        min-width="auto"
                    >
                        <template v-slot:activator="{ on, attrs }">
                            <v-text-field
                                v-model="health_import_end_date"
                                label="End date"
                                prepend-icon="mdi-calendar"
                                readonly
                                v-bind="attrs"
                                v-on="on"
                            />
                        </template>
                        <v-date-picker
                            v-model="health_import_end_date"
                            no-title
                            scrollable
                            :min="health_import_start_date || undefined"
                        >
                            <v-spacer></v-spacer>
                            <v-btn
                                text
                                color="primary"
                                @click="show_health_import_end_picker = false"
                            >
                                Cancel
                            </v-btn>
                            <v-btn
                                text
                                color="primary"
                                @click="$refs.health_import_end.save(health_import_end_date)"
                            >
                                OK
                            </v-btn>
                        </v-date-picker>
                    </v-menu>

                    <p class="mb-0">
                        {{health_import_provider.scope_note}}
                    </p>
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        width="50%"
                        text
                        @click="health_import_popup = false"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        width="50%"
                        text
                        :disabled="!health_import_effective_client_id || !health_import_start_date || !health_import_end_date || health_import_loading"
                        :loading="health_import_loading"
                        @click="start_health_import"
                    >
                        <v-icon>mdi-cloud-download-outline</v-icon>
                        Connect
                    </v-btn>
                </v-card-actions>
            </v-card>

        </v-dialog>

        <v-dialog
            v-model="health_import_error_popup"
            width="400"
        >

            <v-card>
                <v-card-title class="text-h5">
                    Could not import sleep data
                </v-card-title>

                <v-card-text>
                    {{health_import_error_message}}
                </v-card-text>

                <v-card-actions>
                    <v-btn
                        color="primary"
                        width="100%"
                        text
                        @click="health_import_error_popup = false"
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
    HEALTH_IMPORT_PROVIDERS,
    get_health_import_provider,
} from "@/health_import.js";

function iso_today(days_ago) {
    return new Date(
        Date.now()
        - ( new Date() ).getTimezoneOffset() * 60*1000
        - 1000*60*60*24*(days_ago||0)
    ).toISOString().substr(0,10);
}

function get_saved_item(storage,key) {
    try {
        return storage.getItem(key) || "";
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
         logo_url: process.env.BASE_URL + 'logo.svg',
         demo_popup: false,
         common_sleep_diaries: 0,
         health_import_providers: HEALTH_IMPORT_PROVIDERS,
         health_import_provider_id: HEALTH_IMPORT_PROVIDERS[0].id,
         health_import_popup: false,
         health_import_loading: false,
         health_import_client_id: '',
         health_import_start_date: iso_today(365),
         health_import_end_date: iso_today(0),
         show_health_import_start_picker: false,
         show_health_import_end_picker: false,
         health_import_error_popup: false,
         health_import_error_message: '',
     }),

     computed: {
         diaries() {
             return this.trigger_rebuild && diary_manager.get_diaries();
         },
         health_import_provider() {
             return get_health_import_provider(this.health_import_provider_id);
         },
         health_import_effective_client_id() {
             return this.get_health_import_client_id();
         },
         health_import_needs_client_id() {
             return !this.health_import_provider.client_id;
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
         this.restore_health_import_settings();
         this.process_health_import_callback();
     },

     watch: {
         health_import_provider_id() {
             this.restore_health_import_settings();
             if ( this.health_import_popup && this.health_import_provider.preload ) {
                 this.health_import_provider.preload().catch( () => {} );
             }
         },
     },

     methods: {
         get_health_import_range() {
             return [
                 this.health_import_start_date,
                 this.health_import_end_date,
             ].filter( value => value ).slice().sort();
         },
         get_health_import_client_id(provider) {
             provider = provider || this.health_import_provider;
             return provider.client_id || this.health_import_client_id;
         },
         set_health_import_error(message) {
             this.health_import_error_message = message;
             this.health_import_error_popup = true;
         },
         is_health_import_setup_url(line) {
             return /^https?:/.test(line);
         },
         restore_health_import_settings(provider) {
             provider = provider || this.health_import_provider;
             try {
                 this.health_import_client_id = (
                     get_saved_item(window.sessionStorage,provider.client_id_storage_key)
                     || get_saved_item(window.localStorage,provider.client_id_storage_key)
                     || ""
                 );
                 const start = get_saved_item(window.sessionStorage,provider.range_start_storage_key),
                       end = get_saved_item(window.sessionStorage,provider.range_end_storage_key)
                 ;
                 if ( start && end ) {
                     this.health_import_start_date = start;
                     this.health_import_end_date = end;
                 }
             } catch (e) {
                 // Ignore browsers that block storage access.
             }
         },
         open_health_import_popup() {
             this.restore_health_import_settings();
             this.health_import_popup = true;
             if ( this.health_import_provider.preload ) {
                 this.health_import_provider.preload().catch( () => {} );
             }
         },
         async process_health_import_callback() {
             const provider = this.health_import_providers.filter(
                 provider => provider.get_callback_code && ( provider.get_callback_code() || provider.get_callback_error() )
             )[0];
             if ( !provider ) return;

             const callback_error = provider.get_callback_error(),
                   code = provider.get_callback_code(),
                   state = provider.get_callback_state()
             ;
             if ( !code && !callback_error ) return;

             this.health_import_provider_id = provider.id;
             provider.clear_callback();

             if ( callback_error ) {
                 return this.set_health_import_error(provider.short_title + " authorization failed: " + callback_error);
             }

             if ( !provider.validate_callback_state(state) ) {
                 return this.set_health_import_error(provider.short_title + " authorization could not be verified. Please try again.");
             }

             this.restore_health_import_settings(provider);

             const client_id = this.get_health_import_client_id(provider);

             if ( !client_id ) {
                 return this.set_health_import_error("No " + provider.short_title + " Client ID was saved for this authorization.");
             }

             const range = this.get_health_import_range();
             if ( range.length != 2 ) {
                 return this.set_health_import_error("Please choose a start and end date.");
             }

             this.health_import_loading = true;
             this.$emit("busy");

             try {
                 const token = await provider.exchange_code(client_id,code),
                       sleep_data = await provider.fetch_sleep_range(
                           token.access_token,
                           range[0],
                           range[1],
                       )
                 ;

                 diary_manager.add_diary_contents(JSON.stringify(sleep_data));
                 this.health_import_popup = false;
             } catch (error) {
                 this.$emit("idle");
                 this.set_health_import_error(error && error.message ? error.message : provider.short_title + " import failed.");
             } finally {
                 this.health_import_loading = false;
                 try {
                     sessionStorage.removeItem(provider.range_start_storage_key);
                     sessionStorage.removeItem(provider.range_end_storage_key);
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
         async start_health_import() {
             const provider = this.health_import_provider,
                   range = this.get_health_import_range(),
                   client_id = this.get_health_import_client_id(provider)
             ;

             if ( range.length != 2 ) {
                 return this.set_health_import_error("Please choose a start and end date.");
             }

             if ( !client_id ) {
                 return this.set_health_import_error("Please enter a " + provider.short_title + " Client ID.");
             }

             try {
                 if ( !provider.client_id ) {
                     window.localStorage.setItem(provider.client_id_storage_key,this.health_import_client_id);
                 }
             } catch (e) {
                 // Ignore browsers that block storage access.
             }

             try {
                 if ( !provider.client_id ) {
                     window.sessionStorage.setItem(provider.client_id_storage_key,this.health_import_client_id);
                 }
                 window.sessionStorage.setItem(provider.range_start_storage_key,range[0]);
                 window.sessionStorage.setItem(provider.range_end_storage_key,range[1]);
             } catch (e) {
                 return this.set_health_import_error("Session storage is required for sleep data import.");
             }

             this.health_import_loading = true;

             try {
                 const token = await provider.start_auth(client_id);
                 if ( provider.exchange_code ) return;

                 this.$emit("busy");
                 const sleep_data = await provider.fetch_sleep_range(
                     token.access_token,
                     range[0],
                     range[1],
                 );
                 diary_manager.add_diary_contents(JSON.stringify(sleep_data));
                 this.health_import_popup = false;
             } catch (error) {
                 this.$emit("idle");
                 this.set_health_import_error(error && error.message ? error.message : "Could not start " + provider.short_title + " authorization.");
             } finally {
                 if ( !provider.exchange_code ) {
                     this.health_import_loading = false;
                     try {
                         sessionStorage.removeItem(provider.range_start_storage_key);
                         sessionStorage.removeItem(provider.range_end_storage_key);
                     } catch (e) {
                         // Ignore storage cleanup failures.
                     }
                 }
             }
         },
     },

 }
</script>
