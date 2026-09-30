import { Request, Response, redirect, session, sql } from "@elements/app";
import { Submission, answerOf, formFields, formatAnswer, ownedForm } from "#app/shared/services/forms";

export function cell(value: string): string {
  // A leading = + - @ turns a cell into a formula in a spreadsheet; quote it as text.
  let safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export default function exportCsv(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  let form = ownedForm(req.params.id);
  let fields = formFields(form.id);
  let rows = sql<Submission>(`select * from responses where formId = ${form.id} order by createdAt`).all();

  let lines = [["Submitted", ...fields.map((f) => f.label)].map(cell).join(",")];

  for (let r of rows) {
    let values = fields.map((f) => {
      let v = answerOf(r, f);
      return (f.kind === "rating" || f.kind === "date") && v !== undefined ? String(v) : formatAnswer(f, v);
    });

    lines.push([r.createdAt.toISOString(), ...values].map(cell).join(","));
  }

  let name = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "responses";

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${name}-responses.csv"`);

  return Buffer.from("﻿" + lines.join("\r\n") + "\r\n", "utf8");
}
