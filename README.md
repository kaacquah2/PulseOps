# PulseOps 🚀

**PulseOps** is a comprehensive, open-source infrastructure monitoring platform built with Next.js 16, React 19, and Prisma. Monitor your websites, APIs, and services in real-time with uptime checks, performance metrics, incident management, and intelligent alerting.

![PulseOps](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Monitoring
- **🔍 Multi-Protocol Support**: HTTP/HTTPS, TCP, DNS, and Ping monitoring
- **⏱️ Customizable Intervals**: Configure check intervals from 1-60 minutes
- **📊 Real-Time Metrics**: Track response times, uptime percentages, and status codes
- **🎯 Smart Health Checks**: Configurable timeout and expected status code validation
- **🔄 Automatic & Manual Checks**: Cron-based automatic monitoring + on-demand manual checks

### Incident Management
- **🚨 Automatic Incident Creation**: Auto-detect and create incidents when services go down
- **📝 Incident Tracking**: Full lifecycle management (open → investigating → resolved)
- **⚡ Severity Levels**: Low, Medium, High, and Critical classifications
- **🔄 Auto-Resolution**: Automatically resolve incidents when services recover
- **💬 Multi-Channel Alerts**: Email and Slack notifications for incidents and recoveries

### Authentication & Security
- **🔐 NextAuth.js Integration**: Secure authentication with multiple providers
- **🔑 Credential-Based Auth**: Email and password authentication with bcrypt hashing
- **🌐 OAuth Support**: GitHub and Google OAuth integration
- **🛡️ Protected Routes**: Middleware-based route protection for dashboard areas

### Dashboard & UI
- **📈 Real-Time Dashboard**: Comprehensive overview of all monitors and metrics
- **🎨 Modern UI**: Beautiful, responsive design with dark mode support
- **📱 Mobile-Friendly**: Fully responsive across all devices
- **🔔 Alert System**: Visual notifications for incidents and status changes

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **UI**: Tailwind CSS 4, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL 14+
- npm/yarn/pnpm/bun

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pulseops.git
cd pulseops
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pulseops?schema=public"

# NextAuth
NEXTAUTH_URL="https://pulse-ops-blue.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers (Optional)
GITHUB_ID="your-github-oauth-client-id"
GITHUB_SECRET="your-github-oauth-client-secret"
GOOGLE_ID="your-google-oauth-client-id"
GOOGLE_SECRET="your-google-oauth-client-secret"

# Cron Secret
CRON_SECRET="your-cron-secret-random-string"

# Email Notifications (Optional)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"

# Slack Notifications (Optional)
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Set Up the Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📚 Project Structure

```
pulseops/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── monitors/
│   │   ├── incidents/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── monitors/             # Monitor CRUD operations
│   │   ├── incidents/            # Incident management
│   │   └── cron/                 # Scheduled tasks
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/                   # React components
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── navbar.tsx
│   │   ├── stat-card.tsx
│   │   ├── monitor-status.tsx
│   │   └── incident-list.tsx
│   └── ui/                       # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       └── label.tsx
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Prisma client
│   ├── email.ts                  # Email notification service
│   ├── slack.ts                  # Slack notification service
│   ├── utils.ts                  # Helper functions
│   └── monitoring/
│       └── check.ts              # Health check logic
├── prisma/                       # Database schema
│   └── schema.prisma
├── types/                        # TypeScript types
│   ├── index.ts
│   └── next-auth.d.ts
└── middleware.ts                 # Route protection middleware
```

## 🔧 Configuration

### Database Setup

PulseOps uses PostgreSQL. You can use a local instance or a cloud provider:

**Local PostgreSQL:**
```bash
# Install PostgreSQL (macOS)
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb pulseops
```

**Cloud Options:**
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - Open-source Firebase alternative
- [Railway](https://railway.app) - Easy deployment platform
- [Vercel Postgres](https://vercel.com/storage/postgres) - Vercel's PostgreSQL

### OAuth Configuration

#### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Homepage URL: `https://pulse-ops-blue.vercel.app`
4. Set Authorization callback URL: `https://pulse-ops-blue.vercel.app/api/auth/callback/github`
5. Copy Client ID and Secret to `.env`

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origin: `https://pulse-ops-blue.vercel.app`
6. Add authorized redirect URI: `https://pulse-ops-blue.vercel.app/api/auth/callback/google`
7. Copy Client ID and Secret to `.env`

### Notification Configuration

PulseOps supports multiple notification channels for incident alerts:

#### Email Notifications (Gmail)

Configure Gmail SMTP for email alerts:

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other" (name it PulseOps)
   - Copy the 16-character password

3. Add to `.env.local`:
```env
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-char-app-password"
```

#### Slack Notifications

Configure Slack integration for real-time alerts:

1. Create a Slack App:
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name it "PulseOps" and select your workspace

2. Configure Bot Token Scopes:
   - Navigate to "OAuth & Permissions"
   - Add these Bot Token Scopes:
     - `chat:write` - Send messages
     - `chat:write.public` - Send messages to public channels

3. Install App to Workspace:
   - Click "Install to Workspace"
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)

4. Invite Bot to Channel:
   - In Slack, go to your alerts channel (e.g., `#alerts`)
   - Type `/invite @PulseOps`

5. Add to `.env.local`:
```env
SLACK_BOT_TOKEN="xoxb-your-bot-token"
```

6. Test Integration:
   - Go to Settings page in PulseOps dashboard
   - Navigate to "Slack Integration" card
   - Enter your channel name (e.g., `#alerts`)
   - Click "Send Test Notification"

**Features:**
- 🚨 Automatic alerts when monitors go down
- ✅ Recovery notifications when monitors come back online
- 📊 Formatted messages with severity levels and downtime duration
- 🔗 Quick links to dashboard and incident details

## 📊 Monitoring Setup

### Creating a Monitor

1. Navigate to the Monitors page
2. Click "Add Monitor"
3. Fill in the details:
   - **Name**: Descriptive name for your monitor
   - **URL**: The endpoint to monitor
   - **Type**: HTTP, HTTPS, TCP, DNS, or Ping
   - **Interval**: How often to check (1-60 minutes)
   - **Timeout**: Maximum wait time (1-120 seconds)
   - **Expected Status Code**: HTTP status code to expect (default: 200)

### Automated Monitoring

PulseOps uses a **unified master cron job** to perform all periodic tasks every 5 minutes:

**Tasks Performed:**
- ⏱️ Monitor health checks (HTTP, TCP, DNS, Ping)
- 🧹 Database cleanup (removes metrics older than 30 days)
- 📝 Auto-close resolved incidents (after 7 days)

**Using Vercel Cron (Included):**

The `vercel.json` file is already configured:
```json
{
  "crons": [
    {
      "path": "/api/cron/master",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Just deploy to Vercel - cron is automatically set up! ✅

**Using External Cron Service:**

Configure a service like [cron-job.org](https://cron-job.org) to call:
```
GET https://your-domain.com/api/cron/master
Authorization: Bearer YOUR_CRON_SECRET
```

**Note:** The unified cron fits within Vercel's free plan limit (2 cron jobs max). See `CRON_CONFIGURATION.md` for detailed configuration options.

### Manual Monitor Checks

Users can also check monitors on-demand without waiting for the cron job:

**Check All Monitors:**
- Navigate to `/monitors` page
- Click "Check All Now" button (top-right)
- All enabled monitors are checked immediately
- Perfect for verifying changes after deployment

**Check Individual Monitor:**
- Click the refresh icon (🔄) on any monitor card
- That specific monitor is checked instantly
- Great for testing newly created monitors

See `MANUAL_CHECK_FEATURE.md` for detailed documentation on manual checks.

## 🔐 API Routes

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Monitors
- `GET /api/monitors` - List all monitors
- `POST /api/monitors` - Create new monitor
- `GET /api/monitors/[id]` - Get monitor details
- `PATCH /api/monitors/[id]` - Update monitor
- `DELETE /api/monitors/[id]` - Delete monitor
- `GET /api/monitors/[id]/metrics` - Get monitor metrics

### Incidents
- `GET /api/incidents` - List all incidents
- `POST /api/incidents` - Create new incident
- `PATCH /api/incidents/[id]` - Update incident
- `DELETE /api/incidents/[id]` - Delete incident

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Cron Jobs
- `GET /api/cron/master` - Master cron job (monitors, cleanup, incidents)
- `GET /api/cron/check-monitors` - Legacy monitor checks (deprecated)

### Notifications
- `POST /api/slack/test` - Test Slack integration

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy!

### Deploy with Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t pulseops .
docker run -p 3000:3000 --env-file .env pulseops
```

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment tools
- Prisma for the excellent ORM
- The open-source community

## 📧 Support

For support, email support@pulseops.com or open an issue on GitHub.

---

Built with ❤️ by the PulseOps team
