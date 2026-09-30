import { Request, Response, redirect, session } from "@elements/app";
import { formFields, ownedForm, responses } from "#app/shared/services/forms";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  let form = ownedForm(req.params.id);

  return new html({
    form,
    fields: formFields(form.id),
    responses: responses.view({ formId: form.id }),
  });
}
