import { Hono } from "hono";
import clientRoute from "./client-route";

const appRoutes = new Hono();

appRoutes.route("/clients", clientRoute);

export default appRoutes;
