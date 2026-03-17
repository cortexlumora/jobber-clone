# WorkPulse (Jobber Clone)

## Request Statuses

DB enum: `new`, `assessed`, `converted`, `archived`

| Display Status         | DB Status   | Derived From                                                                 |
|------------------------|-------------|------------------------------------------------------------------------------|
| **New**                | `new`       | Created internally or by client, no action taken yet                         |
| **Unscheduled**        | `new`       | Derived: no assessment record, or assessment has `scheduleLater = true`       |
| **Overdue**            | `new`/`assessed` | Derived: assessment `startDate` is in the past                          |
| **Assessment Complete**| `assessed`  | Assessment is done but not yet converted or archived                         |
| **Converted**          | `converted` | Request turned into a quote or job via "Convert" button (final status)        |
| **Archived**           | `archived`  | Request won't move forward, not visible to clients (final status)             |

- "Unscheduled" and "Overdue" are not DB statuses — they are computed from assessment data in the stats API
- Conversion rate = `converted requests / total requests` in the last 30 days
- A request is only marked `converted` when a job/quote is created via the convert flow (using `relatedRequestId`)

## TODOs

### Requests
- [ ] Auto-update request status to `converted` when a job/quote is created with `relatedRequestId`

### Jobs
- [ ] Visits tracking system — need a `visits` table to track individual visit records per job (date, status, assigned user, etc.)
- [ ] "Recent visits" card — count and revenue of visits completed in past 30 days (needs visits table)
- [ ] "Visits scheduled" card — count and revenue of visits scheduled for next 30 days (needs visits table)
- [ ] "Requires Invoicing" — needs invoice system to know which completed jobs are uninvoiced (currently counts all completed jobs)
- [ ] "Late" logic — currently checks if start date is past and status isn't active; may need refinement

### Quotes
- [ ] Quote create form — internal server error when creating quotes with multiple line items including text type (investigate)
