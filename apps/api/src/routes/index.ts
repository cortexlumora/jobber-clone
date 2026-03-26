import { Hono } from "hono";
import clientRoute from "./client-route";
import fileRoute from "./file-route";
import requestRoute from "./request-route";
import companySettingsRoute from "./company-settings-route";
import customFieldRoute from "./custom-field-route";

import teamRoute from "./team-route";
import quoteRoute from "./quote-route";
import jobRoute from "./job-route";
import requestsBookingsRoute from "./requests-bookings-route";
import productsServicesRoute from "./products-services-route";
import dashboardRoute from "./dashboard-route";
import tagRoute from "./tag-route";
import visitRoute from "./visit-route";
import timeEntryRoute from "./time-entry-route";
import expenseRoute from "./expense-route";
import invoiceRoute from "./invoice-route";
import emailRoute from "./email-route";
import timesheetRoute from "./timesheet-route";
const appRoutes = new Hono();

appRoutes.route("/clients", clientRoute);
appRoutes.route("/files", fileRoute);
appRoutes.route("/requests", requestRoute);
appRoutes.route("/company-settings", companySettingsRoute);
appRoutes.route("/custom-fields", customFieldRoute);

appRoutes.route("/team", teamRoute);
appRoutes.route("/quotes", quoteRoute);
appRoutes.route("/jobs", jobRoute);
appRoutes.route("/requests-bookings", requestsBookingsRoute);
appRoutes.route("/products-services", productsServicesRoute);
appRoutes.route("/dashboard", dashboardRoute);
appRoutes.route("/tags", tagRoute);
appRoutes.route("/jobs", visitRoute);
appRoutes.route("/jobs", timeEntryRoute);
appRoutes.route("/jobs", expenseRoute);
appRoutes.route("/invoices", invoiceRoute);
appRoutes.route("/emails", emailRoute);
appRoutes.route("/timesheets", timesheetRoute);

export default appRoutes;
