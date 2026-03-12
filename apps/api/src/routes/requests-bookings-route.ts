import { zValidator } from "@hono/zod-validator";
import { createRequestFormSchema } from "@repo/zod/request-form";
import { createBookableServiceSchema, updateBookableServiceSchema } from "@repo/zod/bookable-service";
import { updateRequestsBookingsSettingsSchema } from "@repo/zod/requests-bookings-settings";
import type { APIResponse, RequestFormDTO, BookableServiceDTO, RequestsBookingsSettingsDTO } from "@repo/dto";
import { Hono } from "hono";
import { getUserIdFromCTX } from "../lib/helpers";
import {
	getRequestForms,
	createRequestForm,
	deleteRequestForm,
	getBookableServices,
	createBookableService,
	updateBookableService,
	deleteBookableService,
	getRequestsBookingsSettings,
	upsertRequestsBookingsSettings,
} from "../services/requests-bookings-service";

const requestsBookingsRoute = new Hono()
	// Settings
	.get("/settings", async (c) => {
		const userId = getUserIdFromCTX(c);
		const settings = await getRequestsBookingsSettings(userId);
		return c.json<APIResponse<RequestsBookingsSettingsDTO | null>>({ data: settings });
	})
	.put("/settings", zValidator("json", updateRequestsBookingsSettingsSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = c.req.valid("json");
		const settings = await upsertRequestsBookingsSettings(userId, data);
		return c.json<APIResponse<RequestsBookingsSettingsDTO>>({ data: settings });
	})
	// Request Forms
	.get("/forms", async (c) => {
		const userId = getUserIdFromCTX(c);
		const forms = await getRequestForms(userId);
		return c.json<APIResponse<RequestFormDTO[]>>({ data: forms });
	})
	.post("/forms", zValidator("json", createRequestFormSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = c.req.valid("json");
		const form = await createRequestForm(userId, data);
		return c.json<APIResponse<RequestFormDTO>>({ data: form }, 201);
	})
	.delete("/forms/:id", async (c) => {
		const userId = getUserIdFromCTX(c);
		const id = c.req.param("id");
		const deleted = await deleteRequestForm(userId, id);
		return c.json<APIResponse<RequestFormDTO>>({ data: deleted! });
	})
	// Bookable Services
	.get("/services", async (c) => {
		const userId = getUserIdFromCTX(c);
		const services = await getBookableServices(userId);
		return c.json<APIResponse<BookableServiceDTO[]>>({ data: services });
	})
	.post("/services", zValidator("json", createBookableServiceSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const data = c.req.valid("json");
		const service = await createBookableService(userId, data);
		return c.json<APIResponse<BookableServiceDTO>>({ data: service }, 201);
	})
	.put("/services/:id", zValidator("json", updateBookableServiceSchema), async (c) => {
		const userId = getUserIdFromCTX(c);
		const id = c.req.param("id");
		const data = c.req.valid("json");
		const service = await updateBookableService(userId, id, data);
		return c.json<APIResponse<BookableServiceDTO>>({ data: service! });
	})
	.delete("/services/:id", async (c) => {
		const userId = getUserIdFromCTX(c);
		const id = c.req.param("id");
		const deleted = await deleteBookableService(userId, id);
		return c.json<APIResponse<BookableServiceDTO>>({ data: deleted! });
	});

export default requestsBookingsRoute;
