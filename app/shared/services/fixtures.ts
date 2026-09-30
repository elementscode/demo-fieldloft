import { session, sql } from "@elements/app";
import { Field, FieldKind, Form } from "#app/shared/services/forms";

/** Rows for tests, which start from an empty database. */
export function makeUser(email: string, name = "Test User"): string {
  return sql<{ id: string }>(`
    insert into users (email, name, passwordHash)
         values (${email}, ${name}, crypt('password1', genSalt('bf', 4)))
      returning id
  `).firstOrThrow().id;
}

export function makeForm(ownerId: string, published = true, slug = `t${Math.random().toString(36).slice(2, 10)}`): Form {
  return sql<Form>(`
    insert into forms (ownerId, slug, title, published)
         values (${ownerId}, ${slug}, 'Test form', ${published})
      returning *
  `).firstOrThrow();
}

export function makeField(formId: string, kind: FieldKind, position: number, required = false, options: string[] = []): Field {
  return sql<Field>(`
    insert into fields (formId, position, kind, label, required, options)
         values (${formId}, ${position}, ${kind}, ${`Question ${position}`}, ${required}, ${options})
      returning *
  `).firstOrThrow();
}

export function loginAs(userId: string) {
  session.login({ userId, userName: "Test User" });
}
