# Sweet FM 106.5 - Integrated Management Platform

A modern, comprehensive web platform for Sweet FM 106.5, a Ghana-based radio station. This industry-standard platform unifies client management, employee operations, finance, broadcast scheduling, and self-service portals under one digital ecosystem.

## 🎯 Features

### Core Modules

- **Authentication & Authorization** - Role-based access control (Admin, Manager, Employee, Client)
- **Role-Based Dashboards** - Customized dashboards for each user role with relevant KPIs
- **Client Management** - Complete client lifecycle management with contracts and billing
- **Employee/HR Module** - Employee profiles, payroll, attendance, and leave management
- **Finance Module** - Comprehensive expense tracking, revenue monitoring, and budget management
- **Broadcast Scheduling** - Industry-standard scheduling with shows, ad slots, and recurrence patterns
- **Reports & Analytics** - Advanced reporting with charts and exportable formats
- **Client Portal** - Full-featured self-service portal with campaigns, invoices, and support
- **Employee Portal** - Personal workspace for schedules, leave requests, and announcements

## 🛠️ Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + ShadCN/UI
- **State Management:** Zustand
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Animations:** Framer Motion

## 📁 Project Structure

```
/sweetfm-platform
├── app/                      # Next.js app directory
│   ├── dashboard/           # Role-based dashboard (Admin/Manager/Employee/Client)
│   ├── clients/             # Client management (Admin/Manager)
│   ├── employees/           # Employee management (Admin/Manager)
│   ├── finance/             # Finance module (Admin/Manager)
│   ├── schedule/            # Broadcast scheduling (Admin/Manager)
│   ├── reports/             # Reports & analytics (Admin/Manager)
│   ├── settings/            # User settings & user management (Admin)
│   ├── login/               # Authentication
│   │
│   ├── # Employee Features
│   ├── my-schedule/         # Employee personal schedule
│   ├── leave/               # Leave request management
│   ├── announcements/       # Company announcements
│   │
│   ├── # Client Features
│   ├── my-campaigns/        # Client campaign analytics
│   ├── my-invoices/         # Client invoice management
│   └── support/             # Client support tickets
│
├── components/              # Reusable components
│   ├── layout/             # Layout components (Sidebar, Navbar, MainLayout)
│   ├── schedule/           # Schedule-specific components (ShowForm, AdSlotForm)
│   └── ui/                 # ShadCN UI components (Button, Card, Dialog, etc.)
│
├── data/                   # Mock data
│   ├── mockData.ts         # Core mock data (clients, employees, expenses)
│   ├── mockUsers.ts        # User authentication data
│   ├── mockScheduleData.ts # Shows and ad slots data
│   ├── mockEmployeeData.ts # Employee-specific data (leaves, shifts, announcements)
│   └── mockClientPortalData.ts # Client portal data (invoices, campaigns, tickets)
│
├── store/                  # Zustand state management
│   └── useStore.ts         # Global store with all state and actions
│
├── types/                  # TypeScript type definitions
│   └── index.ts            # All interfaces and types
│
└── utils/                  # Utility functions
    ├── formatters.ts       # Currency and date formatters
    └── api.ts              # API helper functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (Note: Next.js 16 requires Node 20.9.0+, but works with 18.20.8)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sweetfm-platform
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Login

The platform uses mock authentication. You can log in with any credentials:

**Admin Account:**
- Email: `admin@sweetfm.com`
- Password: `password`
- Role: `admin`

**Manager Account:**
- Email: `manager@sweetfm.com`
- Password: `password`
- Role: `manager`

**Employee Account:**
- Email: `employee@sweetfm.com`
- Password: `password`
- Role: `employee`

**Client Account:**
- Email: `client@example.com`
- Password: `password`
- Role: `client`

> **Note:** Any email/password combination will work - the role dropdown determines access level.

## 🎨 Design System

### Color Palette
- **Primary:** `#c81f25` (Sweet FM Red)
- **Accent:** `#facc15` (Sunshine Yellow)
- **Background:** `#f5f5f5`
- **Text:** `#1f2937` (Dark Gray)

### Key Components
- Responsive sidebar navigation
- Role-based menu items
- KPI cards with trend indicators
- Interactive charts and graphs
- Data tables with sorting and filtering
- Modal dialogs for detailed views
- Toast notifications for user feedback

## 📊 Mock Data

The platform currently uses comprehensive mock data for demonstration purposes:

**Core Data** (`/data/mockData.ts`):
- 5 sample clients with contracts and billing
- 6 sample employees with departments
- 5 sample expenses across categories
- Revenue and expense trends

**User Data** (`/data/mockUsers.ts`):
- Admin, Manager, Employee, and Client test accounts

**Schedule Data** (`/data/mockScheduleData.ts`):
- 8 radio shows with recurrence patterns
- 12 ad slots with client assignments
- Weekly scheduling with time slots

**Employee Data** (`/data/mockEmployeeData.ts`):
- Leave requests (vacation, sick, personal)
- Company announcements
- Employee shifts and schedules
- Time off balances

**Client Portal Data** (`/data/mockClientPortalData.ts`):
- Client invoices with line items
- Campaign analytics and performance
- Support tickets with conversations
- Payment history

## 🔮 Future Backend Integration

The codebase is structured for easy backend integration:

### API Endpoints (Prepared)
- `/api/auth/login` - Authentication
- `/api/clients` - Client management
- `/api/employees` - Employee management
- `/api/expenses` - Expense tracking
- `/api/schedule` - Broadcast scheduling
- `/api/reports` - Report generation

### API Helper
All API calls are centralized in `/utils/api.ts` with a consistent interface:
```typescript
apiRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>
```

### Environment Variables
Create a `.env.local` file for backend configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🧪 Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

## 📝 Key Features by Role

### 👨‍💼 Admin
**Full System Access:**
- Comprehensive dashboard with revenue, expenses, and KPIs
- Complete client management (CRUD operations)
- Complete employee management (CRUD operations)
- User management (create users, assign roles, reset passwords)
- Finance tracking (expenses, revenue, budgets)
- Broadcast schedule management (shows and ad slots)
- Advanced reports and analytics
- System settings and configuration
- Leave request approval
- Announcement management

### 👔 Manager
**Operational Management:**
- Dashboard with operational KPIs
- Client management and billing
- Employee management and payroll
- Finance tracking and expense approval
- Broadcast schedule management
- Reports and analytics
- Leave request approval
- Announcement management

### 👤 Employee
**Personal Workspace:**
- Employee dashboard with personal stats
- **My Schedule** - View personal shifts and work schedule
- **Leave Requests** - Request time off (vacation, sick, personal)
- **Announcements** - View company announcements
- Time off balance tracking
- Shift details and upcoming schedule
- ❌ No access to: Reports, Finance, Client/Employee Management, Settings

### 🏢 Client
**Self-Service Portal:**
- Client dashboard with account overview
- **My Campaigns** - Track advertising campaign performance
  - Campaign analytics and metrics
  - Audience demographics
  - Peak listening times
  - Performance scores
- **My Invoices** - View and manage billing
  - Invoice history with detailed line items
  - Payment tracking
  - Download invoices (PDF)
  - Online payment options
  - Payment history
- **Support** - Get help and support
  - Create support tickets
  - Track ticket status
  - View conversation history
  - Priority and category management
- Account status and payment terms
- Broadcast schedule viewing (read-only)
- ❌ No access to: Admin features, Employee features, Other clients' data

## ✨ Detailed Feature List

### 🎛️ Dashboard System
- **Role-Based Dashboards** - Separate dashboards for Admin, Manager, Employee, and Client
- **KPI Cards** - Real-time metrics with trend indicators
- **Quick Actions** - Role-specific action buttons
- **Summary Cards** - Clickable cards that navigate to detailed pages
- **Notification Badges** - Unread counts on action buttons
- **Overdue Alerts** - Visual alerts for overdue payments/tasks

### 👥 Client Management
- **Client Profiles** - Complete client information with contracts
- **Contract Management** - Start/end dates, amounts, service descriptions
- **Billing Tracking** - Total billed, amount paid, balance
- **Payment Terms** - Configurable payment terms per client
- **Status Management** - Active, Overdue, Inactive statuses
- **Contact Management** - Multiple contact persons per client
- **Client Search & Filter** - Quick search and status filtering

### 👨‍💼 Employee Management
- **Employee Profiles** - Personal info, department, role, salary
- **Payroll Tracking** - Salary management and payment history
- **Department Organization** - Group employees by department
- **Employee Search** - Quick search functionality
- **User Account Linking** - Connect employees to user accounts

### 💰 Finance Module
- **Expense Tracking** - Categorized expense management
- **Revenue Monitoring** - Track all revenue sources
- **Budget Management** - Set and monitor budgets
- **Expense Categories** - Payroll, Marketing, Equipment, Utilities, etc.
- **Status Tracking** - Pending, Approved, Rejected expenses
- **Financial Charts** - Revenue vs Expenses visualization
- **Expense Breakdown** - Pie charts by category

### 📻 Broadcast Scheduling
- **Show Management** - Create and manage radio shows
- **Recurrence Patterns** - Daily, Weekly, Weekdays, Weekends, Custom
- **Time Slots** - Precise start/end times
- **Show Categories** - Music, Talk, News, Sports, etc.
- **Presenter Assignment** - Link shows to presenters
- **Ad Slot Management** - Schedule client advertisements
- **Ad Types** - Spot, Sponsorship, Jingle, Promo
- **Frequency Control** - Set ads per day/week
- **Client Linking** - Associate ads with clients
- **Cost Tracking** - Track ad slot costs
- **Weekly Calendar View** - Visual schedule grid
- **Status Management** - Active, Scheduled, Completed, Cancelled

### 📊 Reports & Analytics
- **Revenue Reports** - Comprehensive revenue analysis
- **Expense Reports** - Detailed expense breakdowns
- **Client Reports** - Per-client performance
- **Financial Trends** - Historical data visualization
- **Export Functionality** - PDF and CSV exports (prepared)

### 🔐 User Management (Admin Only)
- **User Creation** - Create new user accounts
- **Role Assignment** - Assign Admin, Manager, Employee, Client roles
- **Password Management** - Reset user passwords
- **User Deletion** - Remove user accounts
- **User Search** - Find users quickly

### 👤 Employee Features

#### My Schedule
- **Personal Schedule View** - See only assigned shifts
- **Weekly Calendar** - Visual weekly schedule
- **Shift Details** - Time, role, show name, location
- **Upcoming Shifts** - Next 7 days preview
- **Today's Schedule** - Current day focus
- **Shift Statistics** - Total hours, shift counts

#### Leave Management
- **Leave Requests** - Submit vacation, sick, personal leave
- **Leave History** - View all past requests
- **Approval Status** - Pending, Approved, Rejected
- **Time Off Balance** - Track remaining days
- **Leave Calendar** - Visual leave schedule
- **Manager Approval** - Admin/Manager can approve/reject

#### Announcements
- **View Announcements** - Company-wide communications
- **Unread Indicators** - Track unread announcements
- **Role Targeting** - Announcements for specific roles
- **Expiration Dates** - Time-limited announcements
- **Create Announcements** - Admin/Manager can create
- **Priority Levels** - High, Medium, Low priority

### 🏢 Client Portal Features

#### Campaign Analytics
- **Performance Metrics** - Campaign performance scores
- **Spots Tracking** - Aired vs Total spots
- **Reach & Impressions** - Estimated audience reach
- **Demographics** - Age group breakdowns
- **Peak Times** - Best listening times
- **Visual Analytics** - Progress bars and charts
- **Active Campaigns** - Currently running campaigns
- **Campaign History** - Past campaign performance

#### Invoice Management
- **Invoice List** - All invoices with status
- **Detailed View** - Line items, quantities, pricing
- **Payment Tracking** - Paid, pending, overdue
- **Payment History** - All completed payments
- **Download Invoices** - PDF download (prepared)
- **Online Payment** - Pay now functionality (prepared)
- **Payment Methods** - Bank Transfer, Credit Card, Cash, Check
- **Invoice Search** - Filter by status

#### Support Center
- **Ticket Creation** - Submit support requests
- **Ticket Categories** - Billing, Technical, Campaign, General
- **Priority Levels** - Low, Medium, High, Urgent
- **Status Tracking** - Open, In-Progress, Resolved, Closed
- **Conversation Threads** - Back-and-forth messaging
- **Staff Responses** - Support team replies
- **Ticket History** - All past tickets
- **Attachment Support** - File attachments (prepared)

## 🎯 Roadmap

### Phase 1 (Current) - Frontend ✅
- ✅ Complete UI/UX implementation
- ✅ Role-based navigation and dashboards
- ✅ Comprehensive mock data
- ✅ Responsive design
- ✅ Employee portal features
- ✅ Client portal features
- ✅ Advanced scheduling system
- ✅ User management

### Phase 2 - Backend Integration
- [ ] Connect to REST/GraphQL API
- [ ] Real-time data synchronization
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] File upload functionality
- [ ] PDF/CSV export implementation
- [ ] Email notifications (SMTP)
- [ ] SMS notifications (Twilio)
- [ ] Authentication (JWT/OAuth)
- [ ] Session management

### Phase 3 - Advanced Features
- [ ] Real-time broadcasting dashboard
- [ ] Advanced analytics and BI
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration (Paystack/Stripe)
- [ ] Automated invoicing and billing
- [ ] WhatsApp integration
- [ ] Audio streaming integration
- [ ] Social media integration
- [ ] Calendar synchronization (Google/Outlook)
- [ ] Multi-language support

## 📄 License

This project is proprietary software for Sweet FM 106.5.

## 👥 Support

For support and questions, contact the development team.
