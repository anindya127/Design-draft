# Environment Variables Documentation

## Development (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.gcss.hk/api
NEXT_PUBLIC_SITE_URL=https://gcss.hk

# Feature flags
# When enabled, forms (Contact / Payment request / Language request) will POST to NEXT_PUBLIC_API_URL.
# When disabled or unset, forms behave as demo-only (show a success state without network calls).
NEXT_PUBLIC_FORMS_API=false

# When enabled, auth pages (Login / Register / Forgot Password) will call the backend auth endpoints.
# When disabled or unset, auth pages behave as demo-only.
NEXT_PUBLIC_AUTH_API=false

# CAPTCHA (optional)
# Set to one of: none | auto | turnstile | tencent
# - none: CAPTCHA disabled (default)
# - auto: uses Tencent for zh locale, Turnstile otherwise
# - turnstile: always show Turnstile
# - tencent: always show Tencent Captcha
NEXT_PUBLIC_CAPTCHA_PROVIDER=none

# Cloudflare Turnstile (frontend site key)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# Tencent Captcha (frontend app id)
NEXT_PUBLIC_TENCENT_CAPTCHA_APP_ID=
```

## Deployment & Scripts

### Static export (out/)

This project uses **Next.js static export** when deploying (generates an `out/` folder).

- `npm run build` runs a normal production build (**no export**) for faster iteration and to avoid Windows/OneDrive occasionally locking `out/` (EBUSY).
- `npm run export` runs the build with static export enabled (creates/refreshes `out/`).
- `npm run deploy` runs `npm run export` and then uploads `out/` via SFTP.

```env
# When set to 1, Next.js will run with output: 'export' and generate the out/ directory.
# This is set automatically by `npm run export` / `npm run deploy`.
GCSS_EXPORT=1
```

### SFTP Deployment (deploy.js)

```env
# SFTP Server credentials - REQUIRED for deploy.js
SFTP_HOST=47.242.75.250
SFTP_PORT=22
SFTP_USER=root
SFTP_PASSWORD=<your-secure-password-here>
```

### SSH Server Setup (setup-server.js)

```env
# SSH Server credentials - REQUIRED for setup-server.js
SSH_HOST=47.242.75.250
SSH_PORT=22
SSH_USER=root
SSH_PASSWORD=<your-secure-password-here>
```

## Security Best Practices

⚠️ **IMPORTANT**: Never commit `.env.local` or credentials to version control!

### Setting up credentials securely

1. **Local Development**: Create `.env.local` in `frontend/` with your credentials
2. **CI/CD**: Use GitHub Secrets or your CI provider's secret management
3. **Production**: Use environment variable services (e.g., AWS Secrets Manager, Vercel Environment Variables)

### Example for GitHub Actions: Add secrets and reference in workflow

```yaml
- name: Deploy
  env:
    SFTP_PASSWORD: ${{ secrets.SFTP_PASSWORD }}
    SSH_PASSWORD: ${{ secrets.SSH_PASSWORD }}
  run: npm run deploy
```

### Example using direnv (local development)

```bash
# Create .envrc in project root
export SFTP_PASSWORD="your-password"
export SSH_PASSWORD="your-password"

# Activate with: direnv allow
```
