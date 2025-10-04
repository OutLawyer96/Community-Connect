# CI/CD Security Improvements

## Overview

This document outlines the security improvements made to the GitHub Actions workflow to minimize secret exposure.

## Changes Made

### 1. Removed Workflow-Level Environment Variables

**Before:** All environment variables (including `GOOGLE_MAPS_API_KEY`) were exposed at the workflow level, making them available to every job and step.

**After:** Removed the top-level `env:` block entirely.

### 2. Scoped Django/Backend Configuration to Backend Tests Only

**Location:** `test` job → `Run tests (backend)` step

The following environment variables are now only available during backend testing:

- `DJANGO_SETTINGS_MODULE: backend.settings`
- `DATABASE_URL: sqlite:///test_db.sqlite3`
- `SECRET_KEY: test-key-not-used-in-production`
- `DEBUG: "True"`
- `ALLOWED_HOSTS: localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS: http://localhost:3000`
- `GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}`

**Rationale:** These variables are only needed for Django backend tests and should not be exposed to:

- Frontend test steps
- Build steps
- Deploy steps
- Any other jobs or steps

### 3. Scoped Container Registry URLs to Build Steps Only

**Location:** `build` job → specific build steps

- `REGISTRY_AWS` is now only available in the "Build and push (AWS)" step
- `REGISTRY_GCP` is now only available in the "Build and push (GCP)" step

**Rationale:** Registry URLs are only needed when actually building and pushing containers, not during test or deploy phases.

## Security Benefits

### Principle of Least Privilege

✅ **Each secret/variable is now only accessible where it's actually needed**

- `GOOGLE_MAPS_API_KEY` → Only in backend tests
- Registry credentials → Only in their respective build steps
- Django settings → Only in backend tests

### Reduced Attack Surface

✅ **Minimized exposure to potential vulnerabilities**

- Third-party actions cannot access secrets unnecessarily
- Log leakage is limited to specific steps
- Compromised dependencies have limited access scope

### Audit Trail Clarity

✅ **Easier to track where secrets are used**

- Clear visibility of which steps access which secrets
- Simplified security audits
- Better compliance with security policies

## Verification Steps

To confirm the workflow still functions correctly:

1. **Backend Tests:**

   ```bash
   # Environment variables should be available only during backend tests
   # Check that GOOGLE_MAPS_API_KEY is accessible in pytest
   ```

2. **Frontend Tests:**

   ```bash
   # Should run without Django/backend environment variables
   # Confirm no secret leakage in logs
   ```

3. **Build Steps:**
   ```bash
   # Verify AWS builds can access REGISTRY_AWS
   # Verify GCP builds can access REGISTRY_GCP
   # Confirm registries are not exposed in other steps
   ```

## Best Practices Applied

1. ✅ **Minimal Scope:** Secrets only available where needed
2. ✅ **Step-Level Isolation:** Each step has only its required secrets
3. ✅ **No Global Secrets:** Removed workflow-level secret exposure
4. ✅ **Clear Boundaries:** Obvious separation between job requirements

## Future Recommendations

1. **Consider using GitHub Environments** for production secrets with additional approval workflows
2. **Implement secret rotation policies** for long-lived credentials
3. **Use OIDC authentication** for cloud providers instead of long-lived credentials
4. **Regular secret audits** to ensure minimal exposure is maintained
5. **Monitor workflow logs** for any accidental secret exposure

## Related Documentation

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Using Secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Environment Protection Rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
