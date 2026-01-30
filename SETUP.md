# Sweet FM Platform - Setup Guide

## ⚠️ Important: Node.js Version Requirement

This project requires **Node.js 20.9.0 or higher** to run. Your current Node version (18.20.8) is not compatible with Next.js 16.

## Quick Setup

### Option 1: Using NVM (Recommended)

If you have NVM installed:

```bash
# Install and use Node 20
nvm install 20
nvm use 20

# Verify version
node --version  # Should show v20.x.x

# Navigate to project
cd /Users/michkobby/CascadeProjects/sweetfm-platform

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Option 2: Install Node 20 Directly

1. Download Node.js 20 LTS from: https://nodejs.org/
2. Install it on your system
3. Restart your terminal
4. Run the commands:

```bash
cd /Users/michkobby/CascadeProjects/sweetfm-platform
npm install
npm run dev
```

## After Starting the Server

1. Open your browser to: http://localhost:3000
2. You'll be redirected to the login page
3. Use these demo credentials:
   - **Email:** any@email.com (any email works)
   - **Password:** password (any password works)
   - **Role:** Select Admin, Manager, Employee, or Client

## Role-Based Access

### Admin/Manager Access
- Dashboard with full KPIs and analytics
- Client Management
- Employee Management
- Finance Module
- Broadcast Schedule
- Reports & Analytics
- Settings

### Employee Access
- Employee Portal (personal payroll, leave requests)
- Broadcast Schedule
- Settings

### Client Access
- Client Portal (invoices, campaigns, billing)
- Settings

## Project Structure

```
sweetfm-platform/
├── app/                    # All pages
│   ├── login/             # Login page
│   ├── dashboard/         # Admin dashboard
│   ├── clients/           # Client management
│   ├── employees/         # Employee management
│   ├── finance/           # Finance tracking
│   ├── schedule/          # Broadcast schedule
│   ├── reports/           # Reports & analytics
│   ├── client-portal/     # Client self-service
│   ├── employee-portal/   # Employee self-service
│   └── settings/          # User settings
├── components/            # Reusable components
├── data/                  # Mock data
├── store/                 # State management (Zustand)
├── types/                 # TypeScript definitions
└── utils/                 # Helper functions
```

## Features Implemented

✅ **Authentication System**
- Mock login with role selection
- Role-based routing and access control

✅ **Admin Dashboard**
- Revenue, Expenses, Payroll, Net Profit KPIs
- Revenue vs Expenses line chart
- Expense breakdown pie chart
- Quick actions and notifications
- AR aging summary

✅ **Client Management**
- Client list with search and filters
- Client profile modal with tabs:
  - Invoices
  - Campaigns
  - Documents
- Add client functionality

✅ **Employee Management**
- Employee cards with profiles
- Payroll summary table
- Employee details modal with:
  - Contact information
  - Employment details
  - Compensation breakdown
  - Payroll history
  - Attendance records

✅ **Finance Module**
- Expense tracker with categories
- Add expense form with receipt upload
- Budget variance tracking
- Revenue trend chart
- KPI cards

✅ **Broadcast Schedule**
- Weekly grid layout (Mon-Sun, 24 hours)
- Show blocks with presenter names
- Add show functionality
- Add ad slot functionality
- Day selector

✅ **Reports & Analytics**
- Report generator (PDF/CSV/Excel)
- Revenue vs Expense trend
- AR Aging analysis
- Payroll cost trend
- Expense category breakdown
- Recent reports table

✅ **Client Portal**
- Financial summary (billed, paid, outstanding)
- Active campaigns display
- Invoice list with download
- Messages and notifications

✅ **Employee Portal**
- Payroll summary (gross, deductions, net)
- Leave request form
- Payroll history
- Attendance records
- Announcements

✅ **Settings Page**
- Profile management
- Password change
- Notification preferences
- Display preferences

## Mock Data

All data is currently mocked in `/data/mockData.ts`:
- 5 sample clients
- 6 sample employees
- 5 sample expenses
- 4 sample shows
- Invoices, campaigns, payroll records
- Revenue and expense trends

## Next Steps

### For Development
1. Customize the color scheme in `tailwind.config.ts`
2. Add more mock data in `/data/mockData.ts`
3. Implement additional features

### For Production
1. Connect to a real backend API
2. Update API endpoints in `/utils/api.ts`
3. Add authentication with JWT tokens
4. Implement file upload functionality
5. Add PDF/CSV export features
6. Set up email notifications

## Troubleshooting

### "Node.js version required" Error
- Install Node 20+ using NVM or direct download

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + ShadCN/UI
- **State:** Zustand
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

## Support

For questions or issues, refer to the main README.md file or contact the development team.
