# Webmasters Esports — Security Notes

This document describes the defenses in place and the manual steps
required to finish locking down the site.

## 1. What was added

### 1.1 Firestore Rules (`firestore.rules`)

- Default deny on every collection that is not explicitly listed.
- **Public read** is allowed on the site-facing collections
  (`stats`, `matches`, `rosters`, `gallery`, `achievements`, `events`).
- **All writes** require the user to exist in `/admins/{uid}`. Nobody can
  self-promote; promotion is done manually from the Firebase Console.
- Every write has field-level validation (string lengths, allowed
  enums, image size cap). Bogus writes are rejected at the database.
- `/users/{uid}` only allows the user themselves (or an admin) to read
  or write their own profile.

### 1.2 Storage Rules (`storage.rules`)

- Same `isAdmin()` gate as Firestore. Currently there is no public
  bucket, but the rule is in place for when one is added.

### 1.3 Hosting headers (`firebase.json`)

`firebase deploy` will attach these headers to every response:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

### 1.4 HTML meta hardening (`admin.html`, `index.html`, …)

Every page now ships:

- A strict **Content-Security-Policy** meta tag allowing only the
  Firebase / Google CDN origins + `'self'`. Inline `<script>` is still
  allowed because Tailwind CDN injects inline styles; if you migrate to
  the Tailwind CLI you can remove `'unsafe-inline'`.
- `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  meta tags (belt-and-suspenders against hosts that strip headers).
- `Cache-Control: no-store` on `admin.html` so a logged-out browser
  never serves a cached admin shell.

### 1.5 Admin client hardening (`admin.html` script)

- **Admin gate**: `onAuthStateChanged` now checks `admins/{uid}`. If the
  signed-in user is not on the allow-list they are forcibly signed out
  and shown an "Access denied" message.
- **Rate-limited login**: 5 attempts per minute, 15-second lockout
  after the threshold, with generic error messages so attackers can't
  enumerate accounts.
- **Honeypot field** (`#website`) hidden off-screen. Filling it silently
  fails the login.
- **Input sanitizers** (`safeStr`, `safeUrl`, `adminGuard`) strip
  control
  characters, cap lengths, validate URLs, and reject anything outside
  the `http(s)/mailto` schemes before it ever reaches Firestore.
- **createdBy** is now stamped on every match/gallery/event write so
  audit logs can identify who did what.

## 2. Manual steps you still need to do

### 2.1 Promote the first admin

After deploying the rules, log in once with your admin Firebase Auth
account (create it in the Console under **Authentication → Users**),
then in the **Firestore → Data** tab create a document:

```
Collection: admins
Document ID: <paste the user's UID from Authentication>
Field: role   Value (string): owner
```

Until you do this, **nobody** — not even you — can write. The login
will succeed but the admin gate in `onAuthStateChanged` will sign you
back out. This is intentional.

### 2.2 Enable Firebase App Check (recommended)

App Check forces every Firestore / Auth request to come from a real
instance of your site, blocking scripted attacks even if a token leaks.

1. In Firebase Console → **App Check**.
2. Register your Firebase Hosting site.
3. Pick **reCAPTCHA Enterprise** for web (free tier: 1M calls/month).
4. After registration, enforce App Check on **Firestore** and
   **Authentication**.

The Firestore rules do **not** need to change; it works automatically
once enforced.

### 2.3 Tighten Auth

- Firebase Console → **Authentication → Settings**:
  - Set **Authorized domains** to ONLY your production hostname.
  - Disable email enumeration in password reset.
- Require **email verification** before sign-in by adding a check in
  `onAuthStateChanged`:
  ```js
  if (!user.emailVerified) { await signOut(auth); … }
  ```
  and (optionally) flip `signInWithEmailAndPassword` to use the
  `EmailAuthProvider` flow with `sendEmailVerification`.

### 2.4 Rotate the API key (if it has been public for a while)

The Firebase web API key in `firebase-config.js` is **public-by-design**
— that's normal for Firebase. What actually protects the project is the
combination of **Firestore Rules + App Check + Auth**. If you want
belt-and-suspenders, you can:

1. Create a new API key in Google Cloud Console.
2. Add **HTTP referrer restrictions** so the key only works from your
   production hostname(s).
3. Replace the key in `firebase-config.js`.

### 2.5 Move the Firebase config to env

If you ever serve the site from a build pipeline (Firebase Hosting +
Cloud Build, Vercel, etc.), read the config from a server endpoint
instead of hardcoding it in the bundle. This doesn't actually improve
security (the key is public anyway) but it makes rotation easier.

### 2.6 Audit log

For a real audit trail, add a Cloud Function that watches the
`matches`, `events`, `achievements`, `rosters`, `gallery`, and
`stats` collections for any write and writes a record into a
`/audit/{auto-id}` collection. Then add rules that make `/audit` only
readable by admins.

## 4. Things this fix does NOT cover

These are out of scope for a static Firebase site but worth keeping in
mind:

- **DDoS at the network edge** — use Firebase Hosting + Cloud CDN
  (already on) and consider Cloudflare in front.
- **Credential stuffing** — Firebase Auth has built-in protection but
  if you have a user table, also enforce strong-password rules and
  enable MFA for admins.
- **XSS via uploaded image filenames** — the rules strip control chars
  and cap captions at 200 chars; `escapeHtml` is used wherever user
  text is rendered.

---

If you have questions about any of these steps, open an issue or ping
the developer who set this up.