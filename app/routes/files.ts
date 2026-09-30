import { Request, Response, redirect, session, sql, NotFoundError } from "@elements/app";

interface StoredFile {
  id: string;
  name: string;
  contentType: string;
  data: Buffer;
}

const INLINE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"]);

/** Uploaded files are served only to the owner of the form they were sent to. */
export default function serveFile(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  let file = sql<StoredFile>(`
    select rf.id, rf.name, rf.contentType, rf.data
      from responseFiles rf
      join responses r on r.id = rf.responseId
      join forms f on f.id = r.formId
     where rf.id = ${req.params.id}
       and f.ownerId = ${session.getOrThrow("userId")}
  `).first();

  if (!file) {
    throw new NotFoundError("That file does not exist.");
  }

  let filename = file.name.replace(/["\\\r\n]/g, "_");

  if (INLINE.has(file.contentType)) {
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  } else {
    // Not a type we render on our own origin: always a download.
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  }

  return file.data;
}
