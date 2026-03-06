import { Hono } from "hono";
import clientRoute from "./client-route";
import fileRoute from "./file-route";

const appRoutes = new Hono();

appRoutes.route("/clients", clientRoute);
appRoutes.route("/files", fileRoute);

export default appRoutes;
