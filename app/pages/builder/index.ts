import { Request, Response, getAppUrl, redirect, session, sql } from "@elements/app";
import { fields, forms, ownedForm } from "#app/shared/services/forms";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  let form = ownedForm(req.params.id);
  let responseCount = sql<{ n: number }>(`select count(*)::int as n from responses where formId = ${form.id}`).firstOrThrow().n;

  return new html({
    forms: forms.view({ id: form.id }),
    fields: fields.view({ formId: form.id }),
    appUrl: getAppUrl(),
    responseCount,
  });
}
