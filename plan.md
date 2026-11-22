# PROJECT CONTEXT: Gym Membership & POS Management System (MVP)

## 1. Project Objective
Build a lightweight, web-based gym management system to eliminate front-desk pricing errors, automate membership expiry tracking, and provide a simple mobile view for members to check their status and show a digital QR ID.

## 2. Tech Stack
- **Frontend**: React 18 (Vite), React Router DOM, Axios, Tailwind CSS (v3).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose (Strict schemas).
- **Auth**: JWT (JSON Web Tokens), bcryptjs.
- **Utilities**: `qrcode.react` (for member IDs), `html5-qrcode` (optional for scanning).

## 3. Current Project Status
- ✅ **Backend**: 100% Complete. Models (`Staff`, `Member`, `Transaction`, `Settings`), Controllers, Routes, and `seed.js` are working. Server runs on port 5000.
- ✅ **Frontend Auth**: Complete. Login page, Protected Routes, and `utils/api.js` (with JWT interceptor) are working.
- ✅ **Frontend Admin**: Complete. `AdminDashboard.jsx` shows daily summary and allows creating Cashier accounts.
- 🚧 **NEXT IMMEDIATE TASK**: Build the `CashierDashboard.jsx`.

## 4. Core Business Logic & Rules (CRITICAL)
1. **Walk-in Pricing**: Do NOT auto-calculate based on server time. Use "Guided Manual" quick-select buttons: 
   - Morning Promo (₱50)
   - Afternoon Student (₱80)
   - Afternoon Regular (₱100)
2. **Membership Expiry**: When a membership is purchased/renewed, the backend automatically calculates `expiry_date` = `today + duration_days`.
3. **Member Status Badges**: 
   - 🟢 ACTIVE (expiry_date > today)
   - 🔴 EXPIRED (expiry_date < today)
   - 🟡 EXPIRING SOON (expiry_date is within 7 days of today)
4. **Transactions**: Every payment (walk-in, new, renewal) MUST create a `Transaction` document linked to the `cashier_id`.

## 5. Database Schema Summary (Mongoose)
- **Staff**: `username`, `password` (hashed), `full_name`, `role` ('admin' | 'cashier'), `shift_tag`.
- **Member**: `member_code` (e.g., GYM-1001), `first_name`, `last_name`, `phone`, `password` (hashed), `membership_status` ('active' | 'expired' | 'none'), `expiry_date` (Date).
- **Transaction**: `transaction_code`, `member_id` (null if walk-in), `cashier_id`, `transaction_type` ('walk_in' | 'membership_new' | 'membership_renewal'), `category_name`, `amount`, `payment_method`.
- **Settings**: `walk_in_rates` (array of {category_name, price}), `membership_rates` (array of {package_name, duration_days, price}).

## 6. API Endpoints Reference (Base URL: http://localhost:5000/api)
- `POST /auth/staff-login` -> Returns `{ token, role, full_name }`
- `POST /auth/register-staff` -> (Admin only) Creates cashier.
- `GET /members?search=query` -> Returns array of members.
- `POST /transactions/walk-in` -> Body: `{ category_name, amount, payment_method }`
- `POST /transactions/membership` -> Body: `{ member_id, package_name, payment_method }` (Auto-updates member expiry).
- `GET /transactions/summary` -> Returns today's revenue stats.

## 7. Coding Rules for Copilot
1. **Always use Tailwind CSS** for styling. No external CSS files unless absolutely necessary.
2. **Always use the `API` utility** from `../utils/api` for backend calls (it handles the JWT token automatically).
3. **Use functional components** with React Hooks (`useState`, `useEffect`).
4. **Handle loading and error states** gracefully in the UI (e.g., disable buttons while `isLoading` is true).
5. **Keep components modular**. If a section gets too large, suggest splitting it into a sub-component in the `components/` folder.
6. **Match the existing UI theme**: `bg-gray-50` backgrounds, `bg-blue-600` primary buttons, rounded corners (`rounded-lg`), and subtle shadows (`shadow-md`).

## 8. Immediate Next Step for Copilot
Generate the code for `frontend/src/pages/CashierDashboard.jsx`. 
It must include:
1. A header with the Cashier's name and a Logout button.
2. A prominent Search Bar to find members by name/phone/code.
3. A "Member Details Card" that appears on search, showing: Name, Member Code, Status Badge (Active/Expired), and Expiry Date.
4. Two main action sections below the search:
   - **"Process Walk-in"**: 3 large, colorful buttons for the walk-in categories.
   - **"Process Membership/Renewal"**: A dropdown to select package (Monthly/Yearly) and a "Renew/Register" button.
5. A "Recent Transactions" list at the bottom showing the last 5 transactions made by this cashier today.