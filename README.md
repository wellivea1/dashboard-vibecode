# Zeitlog

Zeitlog is a browser-based sleep and circadian-rhythm tracker for people managing circadian rhythm disorders (CRDs), including Non-24-Hour Sleep-Wake Disorder. It charts your sleep over time and imports data directly from **Fitbit** and the **Google Health API**.

It is a fork of the [Sleep Diary Project](https://sleepdiary.github.io/) dashboard, adding hosted Fitbit and Google Health import for circadian monitoring.

👉 **[Open Zeitlog](https://wellivea1.github.io/dashboard-vibecode/)**

> Circadian-rhythm documentation and resources for CRDs are planned as the companion **Zeitdex** project.

## Configuration

To enable the hosted Google Health import without asking each user for an OAuth Client ID, build the dashboard with:

```text
VUE_APP_GOOGLE_HEALTH_CLIENT_ID=<Google OAuth Web Client ID>
```

The Google Cloud OAuth client must be a **Web application** with the deployment origin (e.g. `https://wellivea1.github.io`) listed under Authorized JavaScript origins. If this value is omitted, no Google OAuth client is bundled; the import dialog shows the Google Cloud setup instructions and asks each user for their own Client ID.

The app is static and browser-only: it uses the Google Identity Services token flow, so there is no client secret and no backend.

## Get Involved

Bug reports and feature requests are welcome via [the issue tracker](https://github.com/wellivea1/dashboard-vibecode/issues). Contributions to circadian-rhythm-disorder documentation and resources are especially appreciated.

## License

Zeitlog is a fork of the Sleep Diary dashboard, Copyright © 2021 [Sleepdiary Developers](mailto:sleepdiary@pileofstuff.org).

Zeitlog comes with ABSOLUTELY NO WARRANTY. This is free software (GPL-2.0-only), and you are welcome to redistribute it under certain conditions. For details, see [the license statement](LICENSE).
