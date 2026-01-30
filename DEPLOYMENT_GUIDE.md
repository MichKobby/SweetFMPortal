# Sweet FM Platform - Deployment Guide

## 🚀 Quick Start

### Step 1: Node.js Version
Ensure you have Node.js 20.9.0 or higher installed:

```bash
node --version
```

If you need to upgrade:
- **Using NVM:** `nvm install 20 && nvm use 20`
- **Direct Download:** https://nodejs.org/

### Step 2: Install Dependencies
```bash
cd /Users/michkobby/CascadeProjects/sweetfm-platform
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Access the Application
Open your browser to: **http://localhost:3000**

---

## 🔐 Demo Login Credentials

The platform uses mock authentication for demonstration:

- **Email:** Any email address (e.g., `admin@sweetfm.com`)
- **Password:** Any password (e.g., `password`)
- **Role:** Select from dropdown:
  - **Admin** - Full access to all features
  - **Manager** - Full access to all features
  - **Employee** - Limited to schedule, employee portal, settings
  - **Client** - Limited to client portal, settings

---

## 📱 Application Features

### For Admin/Manager Users

1. **Dashboard** (`/dashboard`)
   - View KPIs: Revenue, Expenses, Payroll, Net Profit
   - Analyze charts: Revenue vs Expenses, Expense Breakdown
   - Quick actions: Add Client, Add Employee, Upload Expense
   - View alerts and notifications

2. **Client Management** (`/clients`)
   - Browse all clients with search and filters
   - View client profiles with invoices and campaigns
   - Add new clients
   - Track payment status

3. **Employee Management** (`/employees`)
   - View all employees in card grid
   - Access employee details and payroll history
   - Manage payroll records
   - Add new employees

4. **Finance** (`/finance`)
   - Track all expenses by category
   - Add new expenses with receipts
   - Monitor budget variance
   - View revenue trends

5. **Broadcast Schedule** (`/schedule`)
   - View weekly programming grid
   - Add new shows with presenters
   - Schedule ad slots for clients
   - Filter by day of week

6. **Reports & Analytics** (`/reports`)
   - Generate reports (PDF/CSV/Excel)
   - View analytics charts
   - Download historical reports
   - Analyze AR aging and payroll trends

7. **Settings** (`/settings`)
   - Update profile information
   - Change password
   - Configure notifications
   - Set display preferences

### For Employee Users

1. **Employee Portal** (`/employee-portal`)
   - View personal payroll information
   - Request leave
   - Check attendance records
   - Read announcements

2. **Broadcast Schedule** (`/schedule`)
   - View programming schedule
   - Check assigned shows

3. **Settings** (`/settings`)
   - Update personal information
   - Change password

### For Client Users

1. **Client Portal** (`/client-portal`)
   - View billing summary
   - Track active campaigns
   - Download invoices
   - View payment history
   - Read messages and notifications

2. **Settings** (`/settings`)
   - Update contact information
   - Change password

---

## 🎨 Customization

### Brand Colors
The platform uses Sweet FM's brand colors:
- **Primary Red:** `#c81f25`
- **Accent Yellow:** `#facc15`

To customize, update colors in:
- `/app/globals.css` - CSS variables
- Component files - Tailwind classes

### Mock Data
All sample data is in `/data/mockData.ts`:
- Clients
- Employees
- Expenses
- Shows
- Invoices
- Campaigns

Edit this file to add or modify demo data.

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

---

## 📦 Production Build

### Prerequisites
- Node.js 20.9.0+
- All dependencies installed

### Build Steps
```bash
# 1. Build the application
npm run build

# 2. Test the production build locally
npm start

# 3. Deploy to your hosting platform
# (Vercel, Netlify, AWS, etc.)
```

### Environment Variables
Create `.env.local` for production:
```env
NEXT_PUBLIC_API_URL=https://api.sweetfm.com
NEXT_PUBLIC_APP_URL=https://platform.sweetfm.com
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod
```

### Option 3: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔌 Backend Integration

### Step 1: Update API Base URL
Edit `/utils/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.sweetfm.com';
```

### Step 2: Implement Real Authentication
Replace mock login in `/store/useStore.ts` with actual API call:
```typescript
login: async (email: string, password: string, role: string) => {
  const response = await authApi.login(email, password, role);
  if (response.data) {
    set({ user: response.data.user, isAuthenticated: true });
    return true;
  }
  return false;
}
```

### Step 3: Connect Data Sources
Update Zustand store to fetch from API instead of mock data:
```typescript
// Example for clients
const response = await clientApi.getAll();
if (response.data) {
  set({ clients: response.data });
}
```

### Step 4: Implement File Uploads
Add actual file upload logic in forms (Finance, Client Management)

### Step 5: Add PDF/CSV Export
Implement real export functionality in Reports module

---

## 🐛 Troubleshooting

### Issue: "Node.js version required"
**Solution:** Install Node 20+ using NVM or direct download

### Issue: Port 3000 already in use
**Solution:** 
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### Issue: Module not found errors
**Solution:**
```bash
rm -rf node_modules package-lock.json .next
npm install
```

### Issue: Build fails
**Solution:** Ensure Node version is 20.9.0+

---

## 📊 Performance Optimization

### For Production
1. Enable Next.js Image Optimization
2. Implement code splitting
3. Add caching headers
4. Optimize bundle size
5. Enable compression

### Monitoring
- Add error tracking (Sentry)
- Implement analytics (Google Analytics)
- Monitor performance (Vercel Analytics)

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Implement real authentication with JWT
- [ ] Add CSRF protection
- [ ] Enable HTTPS only
- [ ] Sanitize user inputs
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Enable Content Security Policy
- [ ] Implement proper session management
- [ ] Add audit logging
- [ ] Regular security updates

---

## 📈 Scaling Considerations

### Database
- Choose appropriate database (PostgreSQL, MongoDB)
- Implement connection pooling
- Add database indexes
- Set up backups

### Caching
- Implement Redis for session storage
- Cache API responses
- Use CDN for static assets

### Load Balancing
- Set up multiple instances
- Implement health checks
- Configure auto-scaling

---

## 📞 Support

### Documentation
- **README.md** - Project overview
- **SETUP.md** - Installation guide
- **PROJECT_SUMMARY.md** - Feature list
- **DEPLOYMENT_GUIDE.md** - This file

### Resources
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- ShadCN/UI: https://ui.shadcn.com

---

## ✅ Pre-Launch Checklist

- [ ] Node 20+ installed
- [ ] All dependencies installed
- [ ] Development server runs successfully
- [ ] All pages load without errors
- [ ] Forms submit correctly
- [ ] Charts render properly
- [ ] Role-based access works
- [ ] Mock data displays correctly
- [ ] Responsive design verified
- [ ] Browser compatibility tested

---

**Ready to launch!** 🚀

The Sweet FM Platform is fully functional and ready for demonstration. Connect to your backend API when ready for production use.
