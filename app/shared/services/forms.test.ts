import { test, assert, equal, errorf, sql, File, ValidationError, ForbiddenError } from "@elements/app";
import {
  Submission,
  answerKey,
  checkAnswers,
  fields,
  formatAnswer,
  responses,
  submitResponse,
} from "#app/shared/services/forms";
import { loginAs, makeField, makeForm, makeUser } from "#app/shared/services/fixtures";

async function thrown(fn: () => void | Promise<void>): Promise<any> {
  try {
    await fn();
  } catch (err) {
    return err;
  }

  return undefined;
}

test("forms", () => {
  test("checkAnswers enforces required fields and each kind's shape", () => {
    let owner = makeUser("o@example.com");
    let form = makeForm(owner);
    let name = makeField(form.id, "short", 1, true);
    let mail = makeField(form.id, "email", 2);
    let pick = makeField(form.id, "single", 3, false, ["A", "B"]);
    let many = makeField(form.id, "multiple", 4, false, ["X", "Y", "Z"]);
    let stars = makeField(form.id, "rating", 5);
    let list = [name, mail, pick, many, stars];

    let bad = checkAnswers(list, { [mail.id]: "nope", [pick.id]: "C", [many.id]: ["X", "Q"], [stars.id]: 9 });
    equal(Object.keys(bad.errors).sort(), [name.id, mail.id, pick.id, many.id, stars.id].sort());

    let good = checkAnswers(list, { [name.id]: " Ada ", [mail.id]: "a@b.co", [pick.id]: "B", [many.id]: ["Z", "X"], [stars.id]: "4" });
    equal(good.errors, {});
    equal(good.clean[answerKey(name.id)], "Ada");
    equal(good.clean[answerKey(many.id)], ["X", "Z"], "multiple choice keeps option order");
    equal(good.clean[answerKey(stars.id)], 4);
  });

  test("answer keys have no dashes, so a broadcast cannot rename them", () => {
    assert(!answerKey("13deef86-ab10-41d0-b646-e1f40a097c97").includes("-"));
  });

  test("submitResponse stores cleaned answers and the uploaded file", () => {
    let owner = makeUser("o@example.com");
    let form = makeForm(owner);
    let rating = makeField(form.id, "rating", 1, true);
    let upload = makeField(form.id, "file", 2, true);
    let file = new File({ name: "cv.pdf", contentType: "application/pdf", data: new TextEncoder().encode("%PDF-1.4"), size: 8, lastModified: 0 } as any);

    let id = submitResponse({ formId: form.id, answers: { [rating.id]: 5 }, files: { [upload.id]: file } });

    let row = sql<Submission>(`select * from responses where id = ${id}`).firstOrThrow();
    equal(row.answers[answerKey(rating.id)], 5);

    let stored = sql<{ name: string; size: number }>(`select name, size from responseFiles where responseId = ${id}`).firstOrThrow();
    equal(stored.name, "cv.pdf");
    equal(stored.size, 8);
    equal(formatAnswer(upload, row.answers[answerKey(upload.id)]), "cv.pdf");
  });

  test("submitResponse reports missing required answers per field", async () => {
    let form = makeForm(makeUser("o@example.com"));
    let q = makeField(form.id, "long", 1, true);

    let err = await thrown(async () => { submitResponse({ formId: form.id, answers: {}, files: {} }); });

    assert(err instanceof ValidationError, `expected ValidationError, got ${err}`);
    equal(err.errors?.[q.id], ["This question is required."]);
    equal(sql(`select 1 from responses`).all().length, 0);
  });

  test("an unpublished form takes no responses", async () => {
    let form = makeForm(makeUser("o@example.com"), false);
    let err = await thrown(async () => { submitResponse({ formId: form.id, answers: {}, files: {} }); });

    assert(err instanceof ForbiddenError, `expected ForbiddenError, got ${err}`);
  });

  test("only the owner can change a form's questions or delete its responses", async () => {
    let owner = makeUser("o@example.com");
    let stranger = makeUser("s@example.com");
    let form = makeForm(owner);
    let q = makeField(form.id, "short", 1);

    loginAs(stranger);

    if (!await thrown(async () => { fields.view({ formId: form.id }).insert({ kind: "short", label: "sneaky", position: 2, options: [] }); })) {
      errorf("a stranger added a question");
    }

    let id = submitResponse({ formId: form.id, answers: { [q.id]: "hi" }, files: {} });
    let view = responses.view({ formId: form.id });
    let row = view.get(id)!;

    if (!await thrown(async () => { view.delete(row); })) {
      errorf("a stranger deleted a response");
    }

    loginAs(owner);
    responses.view({ formId: form.id }).delete(row);
    equal(sql(`select 1 from responses`).all().length, 0);
  });
});
