import { zValidator } from "@hono/zod-validator";
import { createExpenseSchema } from "@repo/zod/expense";
import { paginationSchema } from "@repo/zod/pagination";
import type { APIResponse, ExpenseDTO, PaginatedResponse } from "@repo/dto";
import { Hono } from "hono";
import {
	createExpense,
	updateExpense,
	getExpensesByJobId,
	deleteExpense,
} from "../services/expense-service";

const expenseRoute = new Hono()
	.post("/:jobId/expenses", zValidator("json", createExpenseSchema), async (c) => {
		const jobId = c.req.param("jobId");
		const data = c.req.valid("json");

		const expense = await createExpense(jobId, data);
		return c.json<APIResponse<ExpenseDTO>>({ data: expense });
	})
	.get("/:jobId/expenses", zValidator("query", paginationSchema), async (c) => {
		const jobId = c.req.param("jobId");
		const pagination = c.req.valid("query");

		const result = await getExpensesByJobId(jobId, pagination);
		return c.json<PaginatedResponse<ExpenseDTO>>(result);
	})
	.put("/:jobId/expenses/:id", zValidator("json", createExpenseSchema), async (c) => {
		const id = c.req.param("id");
		const data = c.req.valid("json");

		const expense = await updateExpense(id, data);
		return c.json<APIResponse<ExpenseDTO>>({ data: expense });
	})
	.delete("/:jobId/expenses/:id", async (c) => {
		const id = c.req.param("id");

		await deleteExpense(id);
		return c.json<APIResponse<null>>({ data: null });
	});

export default expenseRoute;
