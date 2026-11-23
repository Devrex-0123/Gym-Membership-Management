# 🏋️ Gym Management & POS System

A lightweight, full-stack web application designed to streamline local gym operations. This system eliminates front-desk pricing errors, automates membership expiry tracking, manages cashier shifts, and empowers gym members to track their subscriptions via a mobile-responsive web portal.

## ✨ Key Features

### 👤 Admin / Owner Dashboard
* **Staff & Shift Management:** Create cashier accounts and assign specific work shifts (Morning, Afternoon, Flexible) to track daily sales per shift.
* **Financial Reporting:** View comprehensive daily summaries including total revenue, walk-in counts, new memberships, and renewals.
* **Rate Card Configuration:** Easily update walk-in prices and membership package rates without touching the code.

### 💻 Cashier POS Dashboard (Desktop/Tablet)
* **Smart Member Search:** Instantly find members by name, phone number, or scan their Digital QR Code.
* **Visual Status Badges:** Clear indicators for 🟢 Active, 🔴 Expired, and 🟡 Expiring Soon members.
* **Guided Manual Walk-in:** Quick-select buttons for standard rates (e.g., Morning Promo, Afternoon Student) to prevent calculation errors.
* **One-Click Renewals:** Process new memberships and renewals with automatic expiry date calculations.

### 📱 Member Mobile Portal (Responsive Web)
* **Membership Tracking:** Members can log in via mobile to view their current subscription status and exact expiry dates.
* **Digital QR ID:** Generates a unique QR code for fast, contactless front-desk check-ins.
* **Transaction History:** View a simple log of past payments and gym visits.
* *Note: All financial transactions are securely processed at the front desk by the cashier.*

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS, React Router DOM, Axios
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose (Strict Schema Validation)
* **Authentication:** JWT (JSON Web Tokens), Bcrypt.js
* **Utilities:** QR Code generation for member IDs

## 🚀 Getting Started

### Prerequisites
* Node.js (v16+)
* MongoDB Atlas account (or local MongoDB instance)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gym-management-system.git
   cd gym-management-system
