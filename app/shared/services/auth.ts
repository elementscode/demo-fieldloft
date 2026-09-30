import { sql, session, AuthError } from "@elements/app";

interface User {
  id: string;
  email: string;
  name: string;
}

export const MIN_PASSWORD = 8;

/** Seeded by the development migration and listed on the sign-in page. */
export const DEMO_PASSWORD = "fieldloft";

export const DEMO_ACCOUNTS = [
  { name: "Maya Chen", email: "maya@fieldloft.dev", forms: "Event registration, Customer feedback" },
  { name: "Theo Okafor", email: "theo@fieldloft.dev", forms: "Job application, Team lunch poll" },
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** @rpc */
export function signin(email: string, password: string) {
  let address = normalizeEmail(email);

  if (!address || !password) {
    throw new AuthError("Enter your email and password.");
  }

  let user = sql<User>(`
    select id, email, name from users
     where email = ${address}
       and passwordHash = crypt(${password}, passwordHash)
  `).first();

  if (!user) {
    throw new AuthError("Invalid email or password.");
  }

  session.login({ userId: user.id, userName: user.name });
}

/** @rpc */
export function signup(name: string, email: string, password: string) {
  let address = normalizeEmail(email);
  let displayName = name.trim();

  if (!displayName) {
    throw new AuthError("Enter your name.");
  }

  if (!isEmail(address)) {
    throw new AuthError("Enter a valid email address.");
  }

  if (password.length < MIN_PASSWORD) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD} characters.`);
  }

  let taken = !sql(`select 1 from users where email = ${address}`).empty();

  if (taken) {
    throw new AuthError("That email is already registered.");
  }

  let user = sql<{ id: string }>(`
    insert into users (name, email, passwordHash)
         values (${displayName}, ${address}, crypt(${password}, genSalt('bf', 12)))
      returning id
  `).firstOrThrow();

  session.login({ userId: user.id, userName: displayName });
}

/** @rpc */
export function signout() {
  session.logout();
}
