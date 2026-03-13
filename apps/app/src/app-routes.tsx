import { createBrowserRouter } from "react-router";

const PlaceholderPage = ({ title }: { title: string }) => (
	<div>
		<h2 className="text-2xl font-semibold mb-8">{title}</h2>
		<p className="text-muted-foreground">Coming soon</p>
	</div>
);
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
import CreateClientPage from "./pages/clients/create/page";
import ClientDetailPage from "./pages/clients/detail/page";
import EditClientPage from "./pages/clients/edit/page";
import ClientContactsPage from "./pages/clients/contacts/page";
import CreateRequestPage from "./pages/requests/create/page";
import RequestDetailPage from "./pages/requests/detail/page";
import CreateQuotePage from "./pages/quotes/create/page";
import QuoteDetailPage from "./pages/quotes/detail/page";
import CreateJobPage from "./pages/jobs/create/page";
import JobDetailPage from "./pages/jobs/detail/page";
import SettingsLayout from "./pages/settings/layout";
import CompanySettingsPage from "./pages/settings/company/page";
import TeamSettingsPage from "./pages/settings/team/page";
import RequestsBookingsPage from "./pages/settings/requests-bookings/page";
import FormDetailPage from "./pages/settings/requests-bookings/form-detail";
import ProductsServicesPage from "./pages/settings/products-services/page";
import CustomFieldsPage from "./pages/settings/custom-fields/page";
import AppLayout from "./pages/app-layout";

const routes = createBrowserRouter([
	{ path: "/settings/requests-bookings/forms/:formId", element: <FormDetailPage /> },
	{
		element: <AppLayout />,
		children: [
			{ path: "/", element: <HomePage /> },
			{ path: "/create", element: <CreatePage /> },
			{ path: "/schedule", element: <SchedulePage /> },
			{ path: "/clients", element: <ClientsPage /> },
			{ path: "/clients/create", element: <CreateClientPage /> },
			{ path: "/clients/:id", element: <ClientDetailPage /> },
			{ path: "/clients/:id/edit", element: <EditClientPage /> },
			{ path: "/clients/:id/contacts", element: <ClientContactsPage /> },
			{ path: "/requests", element: <RequestsPage /> },
			{ path: "/requests/create", element: <CreateRequestPage /> },
			{ path: "/requests/:id", element: <RequestDetailPage /> },
			{ path: "/quotes", element: <QuotesPage /> },
			{ path: "/quotes/create", element: <CreateQuotePage /> },
			{ path: "/quotes/:id", element: <QuoteDetailPage /> },
			{ path: "/jobs", element: <JobsPage /> },
			{ path: "/jobs/create", element: <CreateJobPage /> },
			{ path: "/jobs/:id", element: <JobDetailPage /> },
			{ path: "/invoices", element: <InvoicesPage /> },
			{ path: "/marketing", element: <MarketingPage /> },
			{ path: "/reports", element: <ReportsPage /> },
			{ path: "/expenses", element: <ExpensesPage /> },
			{ path: "/timesheets", element: <TimesheetsPage /> },
			{ path: "/community", element: <CommunityPage /> },
			{ path: "/apps", element: <AppsPage /> },
			{
				path: "/settings",
				element: <SettingsLayout />,
				children: [
					{ index: true, element: <CompanySettingsPage /> },
					{ path: "company", element: <CompanySettingsPage /> },
					{ path: "business-profile", element: <PlaceholderPage title="Business Profile" /> },
					{ path: "products-services", element: <ProductsServicesPage /> },
					{ path: "custom-fields", element: <CustomFieldsPage /> },
					{ path: "payments", element: <PlaceholderPage title="Payments" /> },
					{ path: "expense-tracking", element: <PlaceholderPage title="Expense Tracking" /> },
					{ path: "automations", element: <PlaceholderPage title="Automations" /> },
					{ path: "team", element: <TeamSettingsPage /> },
					{ path: "work-settings", element: <PlaceholderPage title="Work Settings" /> },
					{ path: "schedule", element: <PlaceholderPage title="Schedule" /> },
					{ path: "location-services", element: <PlaceholderPage title="Location Services" /> },
					{ path: "job-forms", element: <PlaceholderPage title="Job Forms" /> },
					{ path: "client-hub", element: <PlaceholderPage title="Client Hub" /> },
					{ path: "emails", element: <PlaceholderPage title="Emails & Text Messages" /> },
					{ path: "requests-bookings", element: <RequestsBookingsPage /> },
				],
			},
		],
	},
]);

export default routes;
