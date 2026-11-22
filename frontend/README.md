# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Testing cashier pricing

1. Configure the backend `.env` with a reachable MongoDB and JWT secret. Start the API from `backend` with `npm run dev`.
2. Start the frontend from `frontend` with `npm run dev`, then sign in with a cashier account.
3. In MongoDB Compass, update the active `walk_in_rates` and `membership_rates` in the `Settings` document. Reload the cashier dashboard and verify the displayed options and prices match.
4. Process a walk-in and a membership. Verify the resulting `Transaction.amount` values match the configured Settings prices.
5. To verify the API does not trust browser-submitted amounts, submit an authenticated `POST /api/transactions/walk-in` with a valid active `category_name` and a deliberately different `amount`. Confirm the transaction stores the Settings price. Try an inactive or unknown category and confirm the API rejects it.

## Testing cashier member registration

1. Sign in as a cashier and register a member with a unique phone number and a password of at least six characters. Confirm the new member is selected automatically.
2. Select an active membership package and process the sale. Confirm the member’s status and expiry update and the transaction is recorded at the configured package price.
3. Try registering the same phone number again. Confirm the duplicate is rejected and no second member is created.
4. To check the payment-failure path, register a member, then deactivate the selected membership package in MongoDB Compass before processing the sale. Confirm the UI explains that the member is saved and advises selecting them again rather than re-registering. Reactivate the package, select the saved member by phone, and retry the membership sale.

## Testing role modules

1. Sign in as an admin. Verify the Overview contains the daily summary, Cashier accounts has the staff creation form, and Cashier directory lists existing cashier accounts.
2. Sign in as a cashier. Verify Overview links to Member services, Member directory, Check-in, Renewals, Walk-in POS, and Transactions, and each module opens its own page from the navigation.
3. Use the browser address bar to open `/admin/cashiers` as a cashier and `/cashier/member-directory` as an admin or member. They should be denied access.

## Testing role-based directories

1. As an admin, open **Cashier directory**. Search by name or username and filter active/inactive accounts. Confirm only cashier accounts are shown, pagination works, and no password data is displayed.
2. Use **Add cashier** to create an account, return to the directory, and confirm the new account appears. The staff list endpoint must reject cashier and member tokens.
3. As a cashier, open **Member directory**. Browse members, search by name/phone/code, and filter active, expiring soon, expired, or no membership. Confirm expiry, last visit, and blacklist status display correctly.
4. Confirm the directory is paginated, excludes member passwords, and cannot be accessed with an admin or member token. Member registration and membership sales should remain in the separate **Member services** module.
5. From `backend`, run `npm test` to verify directory filtering, pagination, safe fields, and role gates.

## Testing the member portal

1. Start the backend and frontend as described above. Register a member from the cashier’s Members module, setting a phone number and a password of at least six characters, and complete a membership sale.
2. Log out of the cashier account. Open `/member/login`, sign in with that member’s phone and password, and verify the portal shows their member code, membership status, and expiry.
3. Scan the displayed QR code with a phone camera or QR reader. It should contain the member code only.
4. Test no-membership, expired, active, and expiring-soon states using member records with corresponding expiry dates. Check the page at a narrow phone viewport.
5. From `backend`, run `npm test` to verify member and staff tokens are accepted only by their matching protected routes.

## Testing admin pricing management

1. Sign in as an admin and open **Pricing & plans** from the admin navigation. Verify existing walk-in rates and membership packages, including inactive entries, are editable.
2. Change a price or package duration, toggle an entry inactive, and save. Reload the page and confirm the changes persist.
3. Sign in as a cashier and open Walk-in POS and Members. Confirm the changed active prices/packages appear and inactive entries are hidden.
4. Process a walk-in and membership sale; verify each transaction uses the saved Settings price. Existing transactions should keep their original amounts.
5. Try duplicate names, a negative price, or a zero/fractional package duration and confirm the server rejects the update. A cashier attempting `PUT /api/settings/rates` should receive a forbidden response.
6. From `backend`, run `npm test` for pricing controller and validation checks.

## Testing admin expense tracking

1. Sign in as an admin and open **Expenses**. Record an expense with a date, category, amount, description, and optional vendor. Confirm it appears in the expense history with the admin who recorded it.
2. Filter the history by date range, category, description, or vendor. Confirm pagination and the empty-results message work.
3. Try a zero/negative amount, invalid category, or malformed date through the API and confirm the server rejects it.
4. Sign in as a cashier and try to load or create expenses. Both requests should be forbidden; member accounts should also be unable to access the module.
5. From `backend`, run `npm test` to verify expense validation, filtering, pagination, and admin-only access.

## Testing transaction history and sales reports

1. Sign in as a cashier and open **Transactions**. Confirm the list shows your transactions, with 20 rows per page and working Previous/Next controls.
2. Search by transaction reference or category, then filter by date range, transaction type, and payment method. Confirm Clear restores the full history and an empty match displays a helpful message.
3. Sign in as an admin and open **Reports**. The report defaults to today; select another period and confirm the totals and breakdowns by cashier, payment method, and transaction type update.
4. Choose a period with no transactions and verify the report shows zero totals and empty breakdowns. Try a start date later than the end date and verify the API rejects the range.
5. From `backend`, run `npm test` to verify history filtering, cashier scoping, pagination, date validation, and report aggregation.

## Testing member attendance and check-in

1. Sign in as a cashier and open **Check-in**. Use **Open camera scanner** on localhost or HTTPS and scan the member QR from the member portal. If camera access is unavailable, enter the member code manually.
2. Verify an active, unexpired member is recorded with the cashier and current time and appears in Today’s check-ins. Scan or enter the same code again that day; it should report the existing check-in without adding another visit.
3. Try an unknown code, a member without an active membership, an expired membership, and a blacklisted member. Confirm each is rejected with a clear message.
4. Sign in to the member portal and verify **Recent visits** displays that member’s own check-in history. A different member account should not see those visits.
5. Sign in as an admin and open **Attendance**. Select a date range and verify totals and breakdowns by day, cashier, and check-in hour. A non-admin request to the attendance report should be forbidden.
6. From `backend`, run `npm test` to verify membership checks, duplicate prevention, member-scoped history, report filtering, and empty periods.

## Testing membership renewal reminders

1. Sign in as a cashier or admin and open **Renewals**. Confirm the default list includes memberships expiring within 7 days, with expired memberships available in their own filter.
2. Search by member name, code, or phone. Verify each row shows expiry date, most recent check-in (or no visit), and whether a reminder was recorded.
3. Contact a member outside the app, then select **Record sent**. Confirm the row shows the reminder timestamp and staff name, and the action cannot be recorded twice for that same expiry.
4. Renew a member’s membership and reload. The new expiry should have its own reminder status; the old reminder must not mark the renewed membership as contacted.
5. Confirm members with no membership and blacklisted members are not included. Verify a member token cannot access the staff renewal endpoints.
6. From `backend`, run `npm test` to verify renewal filtering, last-visit/reminder data, and idempotent reminder recording.
