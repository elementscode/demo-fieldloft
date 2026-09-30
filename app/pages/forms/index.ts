import { Request, Response, redirect, session } from "@elements/app";
import html, { listForms } from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  return new html({ forms: listForms(session.getOrThrow("userId")) });
}
