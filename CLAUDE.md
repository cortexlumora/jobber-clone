# WorkPulse (Jobber Clone)

## TODOs

### Requests
- [ ] Define "Overdue" logic for requests — what makes a request overdue? (assessment date passed? no response within X days?)
- [ ] Define "Unscheduled" logic for requests — requests with no assessment date? or no job scheduled?
- [ ] Conversion rate — clarify how to calculate comparison percentage (previous 30-day period?)

### Jobs
- [ ] Visits tracking system — need a `visits` table to track individual visit records per job (date, status, assigned user, etc.)
- [ ] "Recent visits" card — count and revenue of visits completed in past 30 days (needs visits table)
- [ ] "Visits scheduled" card — count and revenue of visits scheduled for next 30 days (needs visits table)
- [ ] "Requires Invoicing" — needs invoice system to know which completed jobs are uninvoiced (currently counts all completed jobs)
- [ ] "Late" logic — currently checks if start date is past and status isn't active; may need refinement

### Quotes
- [ ] Quote create form — internal server error when creating quotes with multiple line items including text type (investigate)
