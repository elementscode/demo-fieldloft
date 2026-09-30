import { test, equal, sql } from "@elements/app";
import { SendResponseEmailJob } from "#app/jobs/send-response-email";
import { makeField, makeForm, makeUser } from "#app/shared/services/fixtures";
import { submitResponse } from "#app/shared/services/forms";

test("response email job", () => {
  test("runs for a new response", () => {
    let form = makeForm(makeUser("owner@example.com", "Owner Name"));
    let q = makeField(form.id, "short", 1);
    let id = submitResponse({ formId: form.id, answers: { [q.id]: "hello" }, files: {} });

    new SendResponseEmailJob({ responseId: id }).run();
  });

  test("is not scheduled when the owner turned emails off", () => {
    let form = makeForm(makeUser("owner@example.com"));
    let q = makeField(form.id, "short", 1);
    sql(`update forms set notifyOwner = false where id = ${form.id}`);

    let before = sql<{ n: number }>(`select count(*)::int as n from elements.jobs`).firstOrThrow().n;
    submitResponse({ formId: form.id, answers: { [q.id]: "quiet" }, files: {} });
    let after = sql<{ n: number }>(`select count(*)::int as n from elements.jobs`).firstOrThrow().n;

    equal(after, before);
  });

  test("does nothing for a response deleted before it ran", () => {
    new SendResponseEmailJob({ responseId: "00000000-0000-7000-8000-000000000000" }).run();
  });
});
