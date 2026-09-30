import { test, equal } from "@elements/app";
import { Field } from "#app/shared/services/forms";
import { positionFor } from "./template";

function f(id: string, position: number): Field {
  return { id, formId: "form", position, kind: "short", label: id, helpText: "", required: false, options: [] };
}

test("builder", () => {
  let list = [f("a", 1), f("b", 2), f("c", 3)];

  test("dropping before the first field goes below it", () => {
    equal(positionFor(list, "c", "a", false), 0);
  });

  test("dropping between two fields lands halfway", () => {
    equal(positionFor(list, "c", "a", true), 1.5);
  });

  test("dropping after the last field goes past it", () => {
    equal(positionFor(list, "a", "c", true), 4);
  });

  test("an unknown target moves nothing", () => {
    equal(positionFor(list, "a", "zzz", true), undefined);
  });
});
