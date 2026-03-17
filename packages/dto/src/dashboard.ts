export interface DashboardDTO {
	requests: {
		new: number;
		assessmentsComplete: number;
		overdue: number;
	};
	quotes: {
		approved: number;
		draft: number;
		changesRequested: number;
	};
	jobs: {
		requiresInvoicing: number;
		active: number;
		actionRequired: number;
	};
	invoices: {
		awaitingPayment: number;
		draft: number;
		pastDue: number;
	};
}
