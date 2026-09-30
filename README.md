![Fieldloft, a form builder built with Elements: the responses summary for a customer survey, with live counts, star ratings and bar charts for each rating question.](https://elements.dev/demos/01a0f435-685a-7329-902c-9c4ba3cc9e14/poster?v=ff8dd25d5659)

# Fieldloft

> A demo app built with [Elements](https://elements.dev).

Build forms with nine field types, publish them at a themed public link, and watch responses fill a live table and charts, with CSV export and an email per response.

**Demo:** [Fieldloft](https://elements.dev/demos/01a0f435-685a-7329-902c-9c4ba3cc9e14)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 21 min
- **Cost:** $7.48 at API rates, September 2026

## Get started

```bash
elements create fieldloft -scaffold=elementscode/demo-fieldloft
```

## Demo accounts

The seed creates two accounts with two published forms each, and 153
responses spread over the past month, including résumé files on the job
application. Both passwords are `fieldloft`, and the sign-in page lists the
accounts; click one to sign straight in.

| Email                | Forms                                            |
| -------------------- | ------------------------------------------------ |
| maya@fieldloft.dev   | Autumn Design Meetup registration, customer survey |
| theo@fieldloft.dev   | Senior Product Designer application, lunch poll  |

Public forms live at `/f/<slug>`, for example `/f/loftwork-feedback`. In
development, the email for each new response is written to
`.elements/logs/job.log`.

## The prompt

```text
Build a form builder named fieldloft.

- Accounts. Build a form with fields: short text, long text, email, number,
  single choice, multiple choice, date, rating, file upload. Each can be
  required, with help text.
- Reorder fields by dragging. Preview the form.
- Publish at a public url. A theme color and a thank-you message.
- Responses: a table with one column per field, a summary view with charts
  for choice and rating fields, and CSV export.
- An email to the owner for each new response (can be turned off).

Seed two users with four forms (event registration, customer feedback, job
application, a poll) and responses. Show the seeded logins on the sign-in page.

Responses and summary charts update in real time.
```

## License

MIT. See [LICENSE](LICENSE).
