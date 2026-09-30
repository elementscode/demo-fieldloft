import { test, assert, NotFoundError } from "@elements/app";
import route from "./index";
import { makeForm, makeUser } from "#app/shared/services/fixtures";

test("public form", () => {
  test("an unknown link is a 404", () => {
    let err: unknown;

    try {
      route({ params: { slug: "no-such-form" } } as any, {} as any);
    } catch (e) {
      err = e;
    }

    assert(err instanceof NotFoundError, `expected NotFoundError, got ${err}`);
  });

  test("a draft renders the closed notice, not its questions", () => {
    makeForm(makeUser("o@example.com"), false, "draft-form");
    let page: any = route({ params: { slug: "draft-form" } } as any, {} as any);

    assert(page, "renders a page");
  });
});
