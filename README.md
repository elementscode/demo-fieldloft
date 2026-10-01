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

## How it's built

Fieldloft needed a drag-to-reorder form builder, public forms with file uploads, a responses table and summary charts that fill in as people answer, CSV export, and owner emails. Each of those is a part of Elements, so the agent spent its 21 minutes on the forms themselves.

### What Elements gave the app

- **Live responses and charts.** Forms, fields and responses are LiveTables. Each submission is inserted through the responses table, and the owner's responses page draws its table and its choice and rating charts from it, so both update as answers arrive.
- **A drag-to-reorder builder.** Dragging a field places it between its new neighbors and saves it through the fields LiveTable. Publishing, the theme color, the thank-you message and the email setting save the same way, checked against the form's owner.
- **File uploads.** A public form sends file answers to an `@rpc` function, which checks every answer again on the server and stores the files with the response in one transaction.
- **Owner emails from a job.** When the form's email setting is on, each response schedules a job that emails the owner from a template.
- **CSV export.** One route serves every form's responses as CSV with a column per field.
- **Data from SQL files.** Migrations define the schema and seed two accounts, four published forms and 153 responses over the past month, including résumé files on the job application. The project server applied each one as soon as it was saved.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 22 tests pass. Every page works on desktop and phone, and live updates arrive as people answer, such as a response submitted from a phone updating the owner's open summary.

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
