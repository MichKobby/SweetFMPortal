# SweetFM Database Schema

## Overview

This directory contains the PostgreSQL schema for the SweetFM platform, designed for use with Supabase.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Run the Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `schema.sql`
3. Paste and run the SQL

### 3. Update Environment Variables

Update your `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Database Tables

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase auth.users) |
| `clients` | Advertising clients/companies |
| `employees` | Radio station staff |
| `invoices` | Client invoices |
| `invoice_items` | Line items for invoices |

### Broadcasting

| Table | Description |
|-------|-------------|
| `shows` | Radio show schedules |
| `ad_slots` | Advertising slots/campaigns |
| `campaigns` | Client advertising campaigns |

### HR & Payroll

| Table | Description |
|-------|-------------|
| `payroll_records` | Monthly payroll records |
| `leave_requests` | Employee leave requests |
| `time_off_balances` | Annual leave balances |
| `shifts` | Employee work shifts |
| `announcements` | Company announcements |
| `announcement_reads` | Track who read announcements |

### Finance

| Table | Description |
|-------|-------------|
| `expenses` | Company expenses |
| `cash_flow` | Monthly cash flow records |
| `profit_loss` | Monthly P&L statements |
| `revenue_recognition` | Revenue tracking by client |
| `accounts_receivable` | AR aging tracking |
| `payment_history` | Payment records |

### Support

| Table | Description |
|-------|-------------|
| `support_tickets` | Client support tickets |
| `ticket_responses` | Ticket conversation threads |
| `notifications` | User notifications |

## Views

Pre-built views for common queries:

- `invoices_with_clients` - Invoices joined with client info
- `shifts_with_details` - Shifts with employee and show names
- `ad_slots_with_details` - Ad slots with client and show info
- `leave_requests_with_employees` - Leave requests with employee details

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Admins/Managers**: Full access to all data
- **Employees**: Read access to most data, write access to own records
- **Clients**: Access only to their own data

## Triggers

Automatic triggers handle:

- `updated_at` timestamp updates
- Invoice balance calculation
- Client balance updates when invoices change
- Employee net pay calculation
- Profile creation on user signup

## Custom Types (Enums)

The schema includes PostgreSQL enums for type safety:

- `user_role`: admin, manager, employee, client
- `client_status`: active, overdue, inactive
- `invoice_status`: paid, pending, overdue, draft, sent, cancelled
- `show_category`: music, talk, news, sports, etc.
- `ad_type`: spot, sponsorship, promo, psa
- And many more...

## Entity Relationship Diagram

```
profiles (users)
    │
    ├── employees (1:1 optional)
    │       ├── payroll_records (1:N)
    │       ├── leave_requests (1:N)
    │       ├── shifts (1:N)
    │       └── time_off_balances (1:N)
    │
    └── clients (via email match)
            ├── invoices (1:N)
            │       ├── invoice_items (1:N)
            │       ├── accounts_receivable (1:1)
            │       └── payment_history (1:N)
            ├── campaigns (1:N)
            ├── ad_slots (1:N)
            ├── support_tickets (1:N)
            │       └── ticket_responses (1:N)
            └── revenue_recognition (1:N)

shows
    ├── ad_slots (1:N optional)
    └── shifts (1:N optional)
```

## Indexes

Performance indexes are created on:

- Foreign keys
- Status columns
- Date columns
- Frequently queried columns

## Notes

- All monetary values use `DECIMAL(12,2)` for precision
- UUIDs are used for all primary keys
- Timestamps use `TIMESTAMPTZ` for timezone awareness
- Arrays are used for `days_of_week` and `target_roles`
