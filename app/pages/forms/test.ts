import { test, equal } from "@elements/app";
import { listForms } from "./template";
import { makeField, makeForm, makeUser } from "#app/shared/services/fixtures";
import { submitResponse } from "#app/shared/services/forms";

test("forms dashboard", () => {
  test("lists only the owner's forms with their counts", () => {
    let me = makeUser("me@example.com");
    let other = makeUser("other@example.com");
    let form = makeForm(me);
    let q = makeField(form.id, "short", 1);
    makeForm(other);

    submitResponse({ formId: form.id, answers: { [q.id]: "one" }, files: {} });
    submitResponse({ formId: form.id, answers: { [q.id]: "two" }, files: {} });

    let rows = listForms(me);
    equal(rows.length, 1);
    equal(rows[0]?.fieldCount, 1);
    equal(rows[0]?.responseCount, 2);
  });
});
