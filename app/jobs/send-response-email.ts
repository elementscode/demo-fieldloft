import { Job, email, sql } from "@elements/app";
import NewResponseEmail from "#app/emails/new-response";
import { Field, Form, Submission, answerOf, formatAnswer } from "#app/shared/services/forms";

export interface SendResponseEmailJobFields {
  responseId: string;
}

export class SendResponseEmailJob extends Job<SendResponseEmailJobFields> {
  static maxAttempts = 5;

  run() {
    let response = sql<Submission>(`select * from responses where id = ${this.fields.responseId}`).first();

    // Deleted before the worker got to it: nothing to tell anyone.
    if (!response) {
      return;
    }

    let form = sql<Form & { ownerEmail: string; ownerName: string }>(`
      select f.*, u.email as ownerEmail, u.name as ownerName
        from forms f
        join users u on u.id = f.ownerId
       where f.id = ${response.formId}
    `).firstOrThrow();

    if (!form.notifyOwner) {
      return;
    }

    let fieldList = sql<Field>(`select * from fields where formId = ${form.id} order by position`).all();
    let total = sql<{ n: number }>(`select count(*)::int as n from responses where formId = ${form.id}`).firstOrThrow().n;

    email({
      to: form.ownerEmail,
      subject: `New response: ${form.title}`,
      body: new NewResponseEmail({
        ownerName: form.ownerName.split(" ")[0],
        formTitle: form.title,
        formId: form.id,
        total,
        answers: fieldList.map((f) => ({ id: f.id, label: f.label, value: formatAnswer(f, answerOf(response, f)) })),
      }),
    });
  }
}
