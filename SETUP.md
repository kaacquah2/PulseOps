# PulseOps Setup Guide

This guide will walk you through setting up PulseOps from scratch.

## Prerequisites Checklist

- [ ] Node.js 20 or higher installed
- [ ] PostgreSQL 14+ installed or cloud database ready
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Step-by-Step Setup

### 1. Install Dependencies

After cloning the repository, install all dependencies:

```bash
npm install
```

This will install all required packages including:
- Next.js 16
- React 19
- Prisma
- NextAuth.js
- Tailwind CSS
- And more...

### 2. Database Configuration

#### Option A: Local PostgreSQL

If using a local PostgreSQL instance:

```bash
# Start PostgreSQL (macOS)
brew services start postgresql

# Create database
createdb pulseops

# Update .env with local connection
DATABASE_URL="postgresql://localhost:5432/pulseops?schema=public"
```

#### Option B: Cloud Database (Recommended)

**Neon (Free Tier Available):**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env` as `DATABASE_URL`

**Supabase:**
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Add to `.env` as `DATABASE_URL`

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Database Connection
DATABASE_URL="postgresql://user:password@host:5432/database"

# Required: NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Optional: OAuth Providers
GITHUB_ID=""
GITHUB_SECRET=""
GOOGLE_ID=""
GOOGLE_SECRET=""

# Required: Cron Security
CRON_SECRET="generate-a-random-string"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Initialize Database

Run Prisma migrations to create all database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# View database in Prisma Studio (optional)
npx prisma studio
```

This will create the following tables:
- `User` - User accounts
- `Account` - OAuth accounts
- `Session` - User sessions
- `Monitor` - Monitor configurations
- `Metric` - Performance metrics
- `Incident` - Incident records
- `Alert` - Alert configurations
- `VerificationToken` - Email verification tokens

### 5. Configure OAuth (Optional)

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: PulseOps Local
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret
6. Add to your `.env`:
   ```env
   GITHUB_ID="your_client_id"
   GITHUB_SECRET="your_client_secret"
   ```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure OAuth consent screen if prompted
6. Select "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret
9. Add to your `.env`:
   ```env
   GOOGLE_ID="your_client_id"
   GOOGLE_SECRET="your_client_secret"
   ```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 7. Create Your First Account

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Get Started" or "Sign Up"
3. Fill in your details:
   - Name
   - Email
   - Password (minimum 6 characters)
4. Click "Create Account"
5. You'll be redirected to login
6. Log in with your credentials

### 8. Create Your First Monitor

1. After logging in, you'll see the dashboard
2. Click "Monitors" in the navigation
3. Click "Add Monitor"
4. Fill in the monitor details:
   - **Name**: e.g., "My API"
   - **URL**: e.g., "https://api.example.com/health"
   - **Type**: Select HTTPS
   - **Interval**: 5 minutes (recommended)
   - **Timeout**: 30 seconds
   - **Expected Status Code**: 200
5. Click "Create Monitor"

### 9. Set Up Automated Monitoring

For development, you can manually trigger the monitoring check:

```bash
curl -X GET http://localhost:3000/api/cron/check-monitors \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

For production, see the Deployment section in README.md

## Troubleshooting

### Database Connection Issues

**Error: Can't reach database server**
- Check if PostgreSQL is running: `brew services list` (macOS)
- Verify DATABASE_URL is correct
- Ensure database exists: `psql -l`

**Error: SSL connection required**
- Add `?sslmode=require` to your DATABASE_URL if using cloud database

### Prisma Issues

**Error: Prisma Client not generated**
```bash
npx prisma generate
```

**Error: Database is out of sync**
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### NextAuth Issues

**Error: Missing NEXTAUTH_SECRET**
- Ensure `.env` contains NEXTAUTH_SECRET
- Generate new one: `openssl rand -base64 32`

**OAuth not working**
- Verify callback URLs match exactly
- Check OAuth credentials are in `.env`
- Ensure OAuth app is not restricted to specific domains

### Build Errors

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
```

**TypeScript errors**
```bash
# Check types
npx tsc --noEmit
```

## Next Steps

After setup is complete:

1. ✅ Create multiple monitors for different services
2. ✅ Configure alert notifications (email, Slack)
3. ✅ Set up automated cron job for monitoring
4. ✅ Customize the dashboard
5. ✅ Deploy to production (see README.md)

## Getting Help

- 📖 Check the [README.md](./README.md) for detailed documentation
- 🐛 Found a bug? [Open an issue](https://github.com/yourusername/pulseops/issues)
- 💬 Questions? [Start a discussion](https://github.com/yourusername/pulseops/discussions)

---

Happy monitoring! 🚀
