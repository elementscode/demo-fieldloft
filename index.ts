import { App } from "@elements/app";
import config from "#config";
import home from "#app/pages/home";
import signin from "#app/pages/signin";
import signup from "#app/pages/signup";
import forms from "#app/pages/forms";
import builder from "#app/pages/builder";
import preview from "#app/pages/preview";
import publicForm from "#app/pages/public-form";
import responses from "#app/pages/responses";
import exportCsv from "#app/routes/export-csv";
import serveFile from "#app/routes/files";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";

const app = new App();

app.route("/", home);
app.route("/signin", signin);
app.route("/signup", signup);
app.route("/forms", forms);
app.route("/forms/:id", builder);
app.route("/forms/:id/preview", preview);
app.route("/forms/:id/responses", responses);
app.route("/forms/:id/responses.csv", exportCsv);
app.route("/files/:id", serveFile);
app.route("/f/:slug", publicForm);

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 403:
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
