# Deploy notes — Webmasters Esports

## One-time setup

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. The repo is already wired to project `webmasters-2ce73` via
   `.firebaserc`. Confirm:
   ```bash
   firebase use --add
   ```

## Deploy rules

```bash
firebase deploy --only firestore:rules,storage
```

## Deploy the site

```bash
firebase deploy --only hosting
```

## Promote the first admin (CRITICAL)

The new rules refuse every write unless the user is in `/admins/{uid}`.
So after deploying, you MUST:

1. Firebase Console → **Authentication → Users → Add user** with the
   admin email + a temporary password.
2. Copy the new user's **UID**.
3. Firestore → **Start collection**:
   - Collection ID: `admins`
   - Document ID: `<paste UID>`
   - Field: `role` (string) = `owner`
4. Log in to `admin.html` with that account. The admin gate will
   now pass.
6. Reset the temporary password and (recommended) enable MFA.

## Enable App Check (recommended)

Firebase Console → **App Check** → register your hosting site with
reCAPTCHA Enterprise → enforce on Firestore + Auth.

See `SECURITY.md` for the full list of manual steps.