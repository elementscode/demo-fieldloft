import {
  LiveTable,
  File,
  session,
  sql,
  tx,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@elements/app";
import { SendResponseEmailJob } from "#app/jobs/send-response-email";

export type FieldKind = "short" | "long" | "email" | "number" | "single" | "multiple" | "date" | "rating" | "file";

export interface Form {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  themeColor: string;
  thankYouMessage: string;
  notifyOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Field {
  id: string;
  formId: string;
  position: number;
  kind: FieldKind;
  label: string;
  helpText: string;
  required: boolean;
  options: string[];
}

export interface FileAnswer {
  id: string;
  name: string;
  size: number;
  contentType: string;
}

export type Answer = string | number | string[] | FileAnswer;

export interface Submission {
  id: string;
  formId: string;
  answers: Record<string, Answer>;
  createdAt: Date;
}

/** What the respondent's browser sends: typed answers, plus the picked file for each file field. */
export interface SubmitForm {
  formId: string;
  answers: Record<string, Answer>;
  files: Record<string, File | undefined>;
}

export const FIELD_KINDS: { kind: FieldKind; label: string; hint: string }[] = [
  { kind: "short", label: "Short text", hint: "One line" },
  { kind: "long", label: "Long text", hint: "Paragraph" },
  { kind: "email", label: "Email", hint: "Checked address" },
  { kind: "number", label: "Number", hint: "Any number" },
  { kind: "single", label: "Single choice", hint: "Pick one" },
  { kind: "multiple", label: "Multiple choice", hint: "Pick any" },
  { kind: "date", label: "Date", hint: "Calendar" },
  { kind: "rating", label: "Rating", hint: "1 to 5 stars" },
  { kind: "file", label: "File upload", hint: "Up to 5 MB" },
];

export const THEME_COLORS = ["#4f46e5", "#0f766e", "#c2410c", "#be185d", "#1d4ed8", "#15803d", "#7c3aed", "#334155"];

export const RATING_MAX = 5;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Stored answers are keyed by the field id without its dashes. A live row's
 * broadcast camelCases the keys inside a jsonb column, which would turn
 * `13deef86-ab10-...` into `13deef86Ab10...`; a key of bare lowercase hex has
 * nothing to convert.
 */
export function answerKey(fieldId: string): string {
  return fieldId.replace(/-/g, "");
}

export function answerOf(response: { answers: Record<string, Answer> }, field: Field): Answer | undefined {
  return response.answers[answerKey(field.id)];
}

export function kindLabel(kind: FieldKind): string {
  return FIELD_KINDS.find((k) => k.kind === kind)?.label ?? kind;
}

export function isChoice(kind: FieldKind): boolean {
  return kind === "single" || kind === "multiple";
}

export function byPosition(a: Field, b: Field): number {
  return a.position - b.position;
}

export function newSlug(): string {
  let alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";

  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return out;
}

function currentUserId(): string {
  return session.getOrThrow("userId");
}

/** Throws unless the signed-in user owns the form. */
export function assertOwner(formId: string | undefined) {
  let owned = sql(`select 1 from forms where id = ${formId} and ownerId = ${currentUserId()}`).first();

  if (!owned) {
    throw new ForbiddenError("That form belongs to someone else.");
  }
}

export function ownedForm(formId: string): Form {
  let form = sql<Form>(`select * from forms where id = ${formId}`).first();

  if (!form) {
    throw new NotFoundError("That form does not exist.");
  }

  if (!session.isLoggedIn()) {
    throw new AuthError("Sign in to see this form.");
  }

  if (form.ownerId !== currentUserId()) {
    throw new ForbiddenError("That form belongs to someone else.");
  }

  return form;
}

export function formFields(formId: string): Field[] {
  return sql<Field>(`select * from fields where formId = ${formId} order by position`).all();
}

export let forms: LiveTable<Form> = new LiveTable<Form>({
  insert: () => {
    throw new ForbiddenError();
  },

  update: (item) => {
    assertOwner(item.id);

    let color = /^#[0-9a-f]{6}$/i.test(item.themeColor) ? item.themeColor : THEME_COLORS[0];

    return sql<Form>(`
      update forms
         set title = ${item.title.trim() || "Untitled form"},
             description = ${item.description},
             published = ${item.published},
             themeColor = ${color},
             thankYouMessage = ${item.thankYouMessage},
             notifyOwner = ${item.notifyOwner}
       where id = ${item.id}
   returning *
    `).firstOrThrow();
  },

  delete: () => {
    throw new ForbiddenError();
  },
});

export let fields: LiveTable<Field> = new LiveTable<Field>({
  insert: (item) => {
    assertOwner(item.formId);
    return fields.insert(item);
  },

  update: (item) => {
    assertOwner(item.formId);
    return fields.update(item);
  },

  delete: (item) => {
    assertOwner(item.formId);
    fields.delete(item);
  },
});

/**
 * Responses stream to the owner's open pages. The submit rpc writes each one
 * after validating it, and the handler refuses a form that is not published.
 */
export let responses: LiveTable<Submission> = new LiveTable<Submission>({
  insert: (item) => {
    if (!sql(`select 1 from forms where id = ${item.formId} and published`).first()) {
      throw new ForbiddenError("This form is not accepting responses.");
    }

    return responses.insert(item);
  },

  update: () => {
    throw new ForbiddenError();
  },

  delete: (item) => {
    assertOwner(item.formId);
    responses.delete(item);
  },
});

function isBlank(value: Answer | undefined): boolean {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

/**
 * Checks answers against the form's fields and returns the cleaned set, or a
 * map of field id to message. Answers come in keyed by field id and go out
 * keyed by `answerKey()`. Runs in the browser for instant feedback and in
 * the rpc, which is the check that counts.
 */
export function checkAnswers(
  fieldList: Field[],
  answers: Record<string, Answer>,
  files: Record<string, File | undefined> = {},
): { clean: Record<string, Answer>; errors: Record<string, string> } {
  let clean: Record<string, Answer> = {};
  let errors: Record<string, string> = {};

  for (let field of fieldList) {
    let value = answers[field.id];

    if (field.kind === "file") {
      let file = files[field.id];

      if (!file) {
        if (field.required) {
          errors[field.id] = "Attach a file.";
        }

        continue;
      }

      if (file.size > MAX_FILE_BYTES) {
        errors[field.id] = "That file is over 5 MB.";
      }

      continue;
    }

    if (isBlank(value)) {
      if (field.required) {
        errors[field.id] = "This question is required.";
      }

      continue;
    }

    switch (field.kind) {
      case "email": {
        let text = String(value).trim();

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text)) {
          errors[field.id] = "Enter a valid email address.";
        } else {
          clean[answerKey(field.id)] = text;
        }

        break;
      }

      case "number": {
        let n = Number(value);

        if (!Number.isFinite(n)) {
          errors[field.id] = "Enter a number.";
        } else {
          clean[answerKey(field.id)] = n;
        }

        break;
      }

      case "rating": {
        let n = Number(value);

        if (!Number.isInteger(n) || n < 1 || n > RATING_MAX) {
          errors[field.id] = "Pick a rating.";
        } else {
          clean[answerKey(field.id)] = n;
        }

        break;
      }

      case "single": {
        if (!field.options.includes(String(value))) {
          errors[field.id] = "Pick one of the options.";
        } else {
          clean[answerKey(field.id)] = String(value);
        }

        break;
      }

      case "multiple": {
        let picked = (Array.isArray(value) ? value : [value]).map(String);

        if (picked.some((p) => !field.options.includes(p))) {
          errors[field.id] = "Pick from the options.";
        } else {
          clean[answerKey(field.id)] = field.options.filter((o) => picked.includes(o));
        }

        break;
      }

      case "date": {
        let text = String(value);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
          errors[field.id] = "Enter a date.";
        } else {
          clean[answerKey(field.id)] = text;
        }

        break;
      }

      default:
        clean[answerKey(field.id)] = String(value).trim();
    }
  }

  return { clean, errors };
}

/** @rpc */
export function submitResponse(form: SubmitForm): string {
  let target = sql<Form>(`select * from forms where id = ${form.formId}`).first();

  if (!target || !target.published) {
    throw new ForbiddenError("This form is not accepting responses.");
  }

  let fieldList = formFields(target.id);
  let { clean, errors } = checkAnswers(fieldList, form.answers ?? {}, form.files ?? {});

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(Object.fromEntries(Object.entries(errors).map(([id, message]) => [id, [message]])));
  }

  let uploads: { fieldId: string; file: File; meta: FileAnswer }[] = [];

  for (let field of fieldList) {
    let file = field.kind === "file" ? form.files?.[field.id] : undefined;

    if (file) {
      let meta = { id: crypto.randomUUID(), name: file.name, size: file.size, contentType: file.contentType || "application/octet-stream" };
      clean[answerKey(field.id)] = meta;
      uploads.push({ fieldId: field.id, file, meta });
    }
  }

  return tx(() => {
    let row = responses.view({ formId: target.id }).insert({ answers: clean, createdAt: new Date() });

    for (let u of uploads) {
      sql(`
        insert into responseFiles (id, responseId, fieldId, name, contentType, size, data)
             values (${u.meta.id}, ${row.id}, ${u.fieldId}, ${u.meta.name}, ${u.meta.contentType}, ${u.meta.size}, ${u.file.data})
      `);
    }

    if (target.notifyOwner) {
      new SendResponseEmailJob({ responseId: row.id }).schedule();
    }

    return row.id;
  });
}

export function formatAnswer(field: Field, value: Answer | undefined): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return value.name;
  }

  if (field.kind === "rating") {
    return `${value} / ${RATING_MAX}`;
  }

  if (field.kind === "date") {
    let day = new Date(`${value}T00:00:00`);
    return day.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return String(value);
}
