# Zeitlog

Zeitlog is a browser-based sleep and circadian-rhythm tracker for people managing circadian rhythm disorders (CRDs), including Non-24-Hour Sleep-Wake Disorder. It charts your sleep over time and imports data directly from **Fitbit** and the **Google Health API**.

It is a fork of the [Sleep Diary Project](https://sleepdiary.github.io/) dashboard, adding hosted Fitbit and Google Health import for circadian monitoring.

👉 **[Open Zeitlog](https://zeitlog.github.io/)** — pre-production / testing instance: **[wellivea1.github.io/dashboard-vibecode](https://wellivea1.github.io/dashboard-vibecode/)**

> Circadian-rhythm documentation and resources for CRDs live in the companion **Zeitdex** site: [zeitdex.github.io](https://zeitdex.github.io/).

## Environments

- **Production:** <https://zeitlog.github.io/>
- **Pre-production / testing:** <https://wellivea1.github.io/dashboard-vibecode/>

## Configuration

To enable the hosted Google Health import without asking each user for an OAuth Client ID, build the dashboard with:

```text
VUE_APP_GOOGLE_HEALTH_CLIENT_ID=<Google OAuth Web Client ID>
```

The Google Cloud OAuth client must be a **Web application** with the deployment origins listed under Authorized JavaScript origins — `https://zeitlog.github.io` (production) and `https://wellivea1.github.io` (pre-production / testing). If `VUE_APP_GOOGLE_HEALTH_CLIENT_ID` is omitted, no Google OAuth client is bundled; the import dialog shows the Google Cloud setup instructions and asks each user for their own Client ID.

The app is static and browser-only: it uses the Google Identity Services token flow, so there is no client secret and no backend.

## Get Involved

Bug reports and feature requests are welcome via [the issue tracker](https://github.com/wellivea1/dashboard-vibecode/issues). Documentation and resources for circadian rhythm disorders live in the companion **[Zeitdex](https://zeitdex.github.io/)** site, where every page can be edited via a pull request — contributions are especially appreciated.

## Project map

Zeitlog (the tracker) and Zeitdex (docs & resources) for circadian rhythm disorders span a few repos across two GitHub orgs and one account:

**Zeitlog — tracker** · [@zeitlog](https://github.com/zeitlog) · <https://zeitlog.github.io/>

| Repo | Role |
|---|---|
| [zeitlog.github.io](https://github.com/zeitlog/zeitlog.github.io) | The tracker web app |
| [core](https://github.com/zeitlog/core) | Sleep-diary format engines (parsing) |
| [report](https://github.com/zeitlog/report) | Sleep-doctor report bundle |
| [info](https://github.com/zeitlog/info) | Analysis & charts bundle |

**Zeitdex — docs & resources** · [@zeitdex](https://github.com/zeitdex) · <https://zeitdex.github.io/>

| Repo | Role |
|---|---|
| [zeitdex.github.io](https://github.com/zeitdex/zeitdex.github.io) | Docs & resources site (MkDocs) |
| [docs](https://github.com/zeitdex/docs) | Documentation source |
| [resources](https://github.com/zeitdex/resources) | Specialist & software directory data |

**Pre-production** · [@wellivea1](https://github.com/wellivea1)

| Repo | Role |
|---|---|
| [dashboard-vibecode](https://github.com/wellivea1/dashboard-vibecode) | Pre-prod tracker · <https://wellivea1.github.io/dashboard-vibecode/> |
| [core-vibecode](https://github.com/wellivea1/core-vibecode) | Pre-prod core |

Forked from the [Sleep Diary Project](https://github.com/sleepdiary).

## License

Zeitlog is a fork of the Sleep Diary dashboard, Copyright © 2021 [Sleepdiary Developers](mailto:sleepdiary@pileofstuff.org).

Zeitlog comes with ABSOLUTELY NO WARRANTY. This is free software (GPL-2.0-only), and you are welcome to redistribute it under certain conditions. For details, see [the license statement](LICENSE).
