import { Hono } from "hono";
import clientRoute from "./client-route";
import fileRoute from "./file-route";
import requestRoute from "./request-route";

const appRoutes = new Hono();

appRoutes.route("/clients", clientRoute);
appRoutes.route("/files", fileRoute);
appRoutes.route("/requests", requestRoute);

export default appRoutes;
