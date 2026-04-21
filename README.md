# Sleep Diary Dashboard

As part of the [Sleep Diary Project](https://sleepdiary.github.io/), this repository provides a dashboard to view your sleep diary.

[Click here to use the dashboard](https://sleepdiary.github.io/dashboard)

## Configuration

To enable the hosted Google Health import without asking each user for an OAuth Client ID, build the dashboard with:

```text
VUE_APP_GOOGLE_HEALTH_CLIENT_ID=<Google OAuth Web Client ID>
```

The Google Cloud OAuth client must be a Web application with `https://sleepdiary.github.io` in its authorized JavaScript origins. If this value is omitted, no Google OAuth client is bundled with the dashboard; the import dialog will show the Google Cloud setup instructions and ask each user for their own Client ID.

## Get Involved

### I found a bug, how should I tell you?

[Create a new bug report](https://github.com/sleepdiary/dashboard/issues/new?assignees=&labels=&template=bug_report.md&title=) and we'll get right on it.

### I'd like to request a new feature, what should I say?

Please [create a new feature request](https://github.com/sleepdiary/dashboard/issues/new?assignees=&labels=&template=feature_request.md&title=).  We'll try to sort out your problem.

### I'd like to change the code, how do I get started?

Take a look at our [getting started guide](https://github.com/sleepdiary/docs/blob/main/development/getting-started.md).  Or if you'd like to talk to someone first, [open a discussion](https://github.com/sleepdiary/sleepdiary.github.io/discussions) and describe what you're planning.

## License

Sleep Diary Dashboard, Copyright © 2021 [Sleepdiary Developers](mailto:sleepdiary@pileofstuff.org)

Sleep Diary Dashboard comes with ABSOLUTELY NO WARRANTY.  This is free software, and you are welcome to redistribute it under certain conditions.  For details, see [the license statement](LICENSE).
