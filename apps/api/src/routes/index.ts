import { Hono } from "hono";
import clientRoute from "./client-route";
import fileRoute from "./file-route";
import requestRoute from "./request-route";
import companySettingsRoute from "./company-settings-route";
import customFieldRoute from "./custom-field-route";
import clientContactRoute from "./client-contact-route";
import teamRoute from "./team-route";
import quoteRoute from "./quote-route";
import jobRoute from "./job-route";

const appRoutes = new Hono();

appRoutes.route("/clients", clientRoute);
appRoutes.route("/files", fileRoute);
appRoutes.route("/requests", requestRoute);
appRoutes.route("/company-settings", companySettingsRoute);
appRoutes.route("/custom-fields", customFieldRoute);
appRoutes.route("/client-contacts", clientContactRoute);
appRoutes.route("/team", teamRoute);
appRoutes.route("/quotes", quoteRoute);
appRoutes.route("/jobs", jobRoute);

export default appRoutes;
