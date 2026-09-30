import { Request, Response, NotFoundError, sql } from "@elements/app";
import { Form, formFields } from "#app/shared/services/forms";
import html from "./template";

export default function route(req: Request, res: Response) {
  let form = sql<Form>(`select * from forms where slug = ${req.params.slug}`).first();

  if (!form) {
    throw new NotFoundError("No form lives at this link.");
  }

  return new html({
    form: {
      id: form.id,
      title: form.title,
      description: form.description,
      themeColor: form.themeColor,
      thankYouMessage: form.thankYouMessage,
    },
    fields: form.published ? formFields(form.id) : [],
    open: form.published,
  });
}
