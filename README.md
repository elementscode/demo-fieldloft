![A form builder with live responses, built by Claude Code on Elements: the responses summary for a customer survey, with live counts, star ratings and bar charts for each rating question.](https://elements.dev/demos/01a0f435-685a-7329-902c-9c4ba3cc9e14/poster?v=ff8dd25d5659)

# A form builder with live responses, built by Claude Code on Elements

> Fieldloft is a full-stack app built with Claude Code on Elements.

Build forms with nine field types, publish them at a themed public link, and watch responses fill a live table and charts, with CSV export and an email per response.

[Run this app on your machine](https://elements.dev/demos/01a0f435-685a-7329-902c-9c4ba3cc9e14). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Fieldloft needed a drag-to-reorder form builder, public forms with file uploads, a responses table and summary charts that fill in as people answer, CSV export, and owner emails. Each of those is a part of Elements, so the agent spent its 21 minutes on the forms themselves.

- **Live responses and charts.** Forms, fields and responses are LiveTables. Each submission is inserted through the responses table, and the owner's responses page draws its table and its choice and rating charts from it, so both update as answers arrive.

- **A drag-to-reorder builder.** Dragging a field places it between its new neighbors and saves it through the fields LiveTable. Publishing, the theme color, the thank-you message and the email setting save the same way, checked against the form's owner.

- **File uploads.** A public form sends file answers to an `@rpc` function, which checks every answer again on the server and stores the files with the response in one transaction.

- **Owner emails from a job.** When the form's email setting is on, each response schedules a job that emails the owner from a template.

- **CSV export.** One route serves every form's responses as CSV with a column per field.

- **Data from SQL files.** Migrations define the schema and seed two accounts, four published forms and 153 responses over the past month, including résumé files on the job application. The project server applied each one as soon as it was saved.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
