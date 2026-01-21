# OAuth Authentication Troubleshooting

## Google OAuth Timeout Error

### Problem
You're seeing this error:
```
[next-auth][error][SIGNIN_OAUTH_ERROR] 
outgoing request timed out after 3500ms
providerId: 'google'
```

### What Was Fixed

I've updated the Google OAuth configuration to:
1. ✅ Explicitly specify OAuth endpoints (avoiding slow discovery)
2. ✅ Increased timeout from 3.5s to 10s
3. ✅ Added proper authorization parameters

### Solutions (Try in Order)

#### Solution 1: Restart Development Server (RECOMMENDED)

The changes won't take effect until you restart the dev server:

```powershell
# In your terminal, press Ctrl+C to stop the server
# Then restart:
npm run dev
```

#### Solution 2: Verify Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID: `552721878915-5p0emn7gnr775oqt6arjsbn4u648okci`
3. Check **Authorized redirect URIs** includes:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. If missing, add it and save

#### Solution 3: Check Network/Firewall

If you're behind a corporate firewall or proxy:

**Option A: Disable OAuth Temporarily**

Comment out Google/GitHub providers in `.env.local`:
```env
# GOOGLE_ID=your-google-oauth-client-id
# GOOGLE_SECRET=your-google-oauth-client-secret
# GITHUB_ID=your-github-oauth-client-id
# GITHUB_SECRET=your-github-oauth-client-secret
```

Then use **email/password authentication** instead (which works fine).

**Option B: Configure Proxy (if applicable)**

If you're using a proxy, add to `.env.local`:
```env
HTTP_PROXY=http://your-proxy:port
HTTPS_PROXY=http://your-proxy:port
```

#### Solution 4: Verify Internet Connection

Test connectivity to Google OAuth:
```powershell
# Test if you can reach Google's OAuth endpoints
curl https://accounts.google.com/.well-known/openid-configuration
```

If this fails, you have network connectivity issues.

#### Solution 5: Use Credentials Provider Only

PulseOps has a built-in email/password authentication that doesn't require OAuth. To disable OAuth providers:

**Edit `lib/auth.ts`:**

Comment out the OAuth providers:
```typescript
providers: [
  // GithubProvider({
  //   clientId: process.env.GITHUB_ID || "",
  //   clientSecret: process.env.GITHUB_SECRET || "",
  // }),
  // GoogleProvider({
  //   clientId: process.env.GOOGLE_ID || "",
  //   clientSecret: process.env.GOOGLE_SECRET || "",
  // }),
  CredentialsProvider({
    // ... existing credentials config
  }),
],
```

Then restart the server.

## Testing After Fixes

### Test Google OAuth
1. Restart dev server: `npm run dev`
2. Go to http://localhost:3000/login
3. Click "Sign in with Google"
4. Check if the error is resolved

### Test Email/Password (Always Works)
1. Go to http://localhost:3000/register
2. Create an account with email/password
3. Verify your email (check console logs for verification link in dev mode)
4. Login with credentials

## Common Errors and Solutions

### Error: "Invalid OAuth Credentials"
- **Cause**: Wrong Client ID or Secret
- **Fix**: Verify credentials in Google Cloud Console

### Error: "Redirect URI Mismatch"
- **Cause**: Callback URL not authorized
- **Fix**: Add `http://localhost:3000/api/auth/callback/google` to authorized URIs

### Error: "Access Blocked"
- **Cause**: App not verified by Google
- **Fix**: In development, add your email as a test user in Google Cloud Console

### Error: Persistent Timeouts
- **Cause**: Network/firewall blocking requests
- **Fix**: Use credentials provider only (email/password)

## Next Steps

1. **Restart your dev server** to apply the fixes
2. **Test OAuth again** - should work now with increased timeout
3. **If still failing**, use email/password authentication (100% reliable)

## Configuration Summary

### Current OAuth Setup

**Google OAuth:**
- Client ID: `your-google-oauth-client-id.apps.googleusercontent.com`
- Callback URL: `http://localhost:3000/api/auth/callback/google`
- Status: ✅ Configured with explicit endpoints & 10s timeout

**GitHub OAuth:**
- Client ID: `your-github-oauth-client-id`
- Callback URL: `http://localhost:3000/api/auth/callback/github`
- Status: ✅ Configured with 10s timeout

**Email/Password:**
- Status: ✅ Always works (no external dependencies)

## Production Deployment Notes

For production deployment (Vercel, Railway, etc.):

1. Update callback URLs to production domain:
   ```
   https://your-domain.com/api/auth/callback/google
   https://your-domain.com/api/auth/callback/github
   ```

2. Update `NEXTAUTH_URL` in production environment:
   ```env
   NEXTAUTH_URL=https://your-domain.com
   ```

3. OAuth timeouts are less common in production (better network)

## Need Help?

If issues persist:
1. Check dev server terminal for errors
2. Check browser console (F12) for client-side errors
3. Verify all environment variables are set correctly
4. Try email/password authentication as fallback
