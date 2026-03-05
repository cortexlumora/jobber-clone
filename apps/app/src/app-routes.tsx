import { createBrowserRouter } from "react-router";
import DashboardPage from "./pages/dashboard/page";
import CreatePage from "./pages/create/page";
import HomePage from "./pages/home/page";
import SchedulePage from "./pages/schedule/page";
import ClientsPage from "./pages/clients/page";
import RequestsPage from "./pages/requests/page";
import QuotesPage from "./pages/quotes/page";
import JobsPage from "./pages/jobs/page";
import InvoicesPage from "./pages/invoices/page";
import MarketingPage from "./pages/marketing/page";
import ReportsPage from "./pages/reports/page";
import ExpensesPage from "./pages/expenses/page";
import TimesheetsPage from "./pages/timesheets/page";
import CommunityPage from "./pages/community/page";
import AppsPage from "./pages/apps/page";

const routes = createBrowserRouter([
	{ path: "/", element: <HomePage /> },
	{ path: "/create", element: <CreatePage /> },
	{ path: "/dashboard", element: <DashboardPage /> },
	{ path: "/schedule", element: <SchedulePage /> },
	{ path: "/clients", element: <ClientsPage /> },
	{ path: "/requests", element: <RequestsPage /> },
	{ path: "/quotes", element: <QuotesPage /> },
	{ path: "/jobs", element: <JobsPage /> },
	{ path: "/invoices", element: <InvoicesPage /> },
	{ path: "/marketing", element: <MarketingPage /> },
	{ path: "/reports", element: <ReportsPage /> },
	{ path: "/expenses", element: <ExpensesPage /> },
	{ path: "/timesheets", element: <TimesheetsPage /> },
	{ path: "/community", element: <CommunityPage /> },
	{ path: "/apps", element: <AppsPage /> },
])

export default routes
