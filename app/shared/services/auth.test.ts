import { test, assert, equal, session, sql } from "@elements/app";
import { signin, signup } from "#app/shared/services/auth";
import { makeUser, uniqueEmail } from "#app/shared/services/fixtures";

test("auth", () => {
  test("signup creates the account, lowercases the email and signs in", () => {
    signup("Ada Lovelace", "  Ada@Example.com ", "longenough");

    let user = sql<{ email: string; name: string }>(`select email, name from users where email = 'ada@example.com'`).firstOrThrow();
    equal(user.email, "ada@example.com");
    equal(user.name, "Ada Lovelace");
    assert(session.isLoggedIn(), "signed in after signup");
  });

  test("signup rejects a short password", () => {
    let message = "";

    try {
      signup("Ada", "ada@example.com", "short");
    } catch (err: any) {
      message = err.message;
    }

    assert(message.includes("at least"), `got ${message}`);
    equal(sql(`select 1 from users where email = 'ada@example.com'`).all().length, 0);
  });

  test("signup refuses a taken email", () => {
    let taken = uniqueEmail("taken@example.com");
    makeUser(taken);
    let message = "";

    try {
      signup("Other", taken, "longenough");
    } catch (err: any) {
      message = err.message;
    }

    equal(message, "That email is already registered.");
  });

  test("signin checks the password", () => {
    let grace = uniqueEmail("grace@example.com");
    makeUser(grace, "Grace");
    let message = "";

    try {
      signin(grace, "wrong-password");
    } catch (err: any) {
      message = err.message;
    }

    equal(message, "Invalid email or password.");
    assert(!session.isLoggedIn());

    signin(grace.toUpperCase(), "password1");
    equal(session.get("userName"), "Grace");
  });
});
