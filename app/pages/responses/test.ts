import { test, equal } from "@elements/app";
import { cell } from "#app/routes/export-csv";

test("csv export", () => {
  test("quotes commas, quotes and newlines", () => {
    equal(cell("plain"), "plain");
    equal(cell("a, b"), "\"a, b\"");
    equal(cell("say \"hi\""), "\"say \"\"hi\"\"\"");
    equal(cell("two\nlines"), "\"two\nlines\"");
  });

  test("defuses spreadsheet formulas", () => {
    equal(cell("=SUM(A1:A9)"), "'=SUM(A1:A9)");
    equal(cell("@cmd"), "'@cmd");
  });
});
