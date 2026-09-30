import { Request, Response, redirect, session } from "@elements/app";

export default function route(req: Request, res: Response) {
  redirect(session.isLoggedIn() ? "/forms" : "/signin");
}
