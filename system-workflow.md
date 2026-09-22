# Birthday Memory Site — System Workflow

This document walks through the entire logical flow of the application, end to end: what happens on every screen, in what order, and what triggers each transition. Use it as the blueprint while building.

---

## 1) Access & Login Flow

1. User navigates to the site URL.
2. App checks for a valid JWT in the httpOnly cookie.
   - If valid → skip straight to **Section 2 (Timeline Dashboard)**.
   - If missing/expired → show the **Login Page**.
3. Login page prompts for username and password.
4. User submits credentials.
5. Backend checks the credentials against the stored (bcrypt-hashed) values.
   - **Incorrect** → show an inline error ("Incorrect username or password"), stay on login page, no hint about which field was wrong.
   - **Correct** → backend issues a JWT, sets it as an httpOnly cookie, redirects to the Timeline Dashboard.
6. On first successful login of a session, show a personal greeting/splash (e.g. "Hi love, welcome back" + today's date) for a few seconds before revealing the dashboard — a nice emotional beat before the content loads.

---

## 2) Timeline Dashboard Flow

1. Dashboard loads and fetches all memory entries from `/api/memories`, sorted chronologically.
2. In parallel, the frontend computes **live stats** from the current date (no backend call needed):
   - Days together / days since the relationship's start date
   - Progress bar: how far through "this year" you are (start date → today)
   - "On this day" card: checks if any past memory shares today's month+day, and if so, features it at the top
3. Dashboard renders:
   - Header with live stats + greeting
   - Scrollable timeline of memory entries, grouped by month
   - Each entry shown as a card: cover photo, date, short title, small Spotify icon if a song is attached
4. User scrolls or clicks a month to jump to that section.
5. User taps/clicks a memory card → **go to Section 3 (Memory Detail)**.
6. User taps the "Connect Spotify" button (only visible if not yet connected) → **go to Section 4, step 1**.
7. User taps logout → **go to Section 7 (Logout)**.

---

## 3) Memory Detail Flow

1. Clicking a card opens the full memory (modal or dedicated page).
2. Detail view fetches full content for that entry: all photos, full story text, location (if set), attached song.
3. Photo gallery renders as a swipeable/lightbox carousel.
4. If a song is attached, the player component renders — **go to Section 4** for playback logic.
5. User can close/back out → returns to the timeline at the same scroll position.

---

## 4) Music Playback Flow

**4a. First-time Spotify connection**
1. User clicks "Connect Spotify."
2. Redirect to Spotify's authorization page (Authorization Code + PKCE flow), requesting the needed scopes.
3. User logs into Spotify (must be the Premium account) and approves access.
4. Spotify redirects back to the app's callback URL with an authorization code.
5. Backend exchanges the code for an access token + refresh token, encrypts and stores the refresh token in the database, tied to the site's single user record.
6. Frontend shows "Spotify connected" confirmation, returns user to wherever they were.

**4b. Playing a song on a memory**
1. User clicks play on a memory's attached song.
2. Frontend requests a fresh access token from the backend (backend uses the stored refresh token to mint one if needed).
3. Web Playback SDK attempts to initialize a player device with that token.
   - **Success** → song plays fully, in-page, with custom controls (play/pause/seek/volume).
   - **Failure or timeout** (SDK doesn't connect within a few seconds) → automatically fall back to rendering Spotify's official embed player (iframe) for that track instead, so playback never just breaks.
4. User can pause, skip, or close the player; state resets when they navigate to a different memory.

**4c. Attaching a song to a memory (creation side)**
1. While adding/editing a memory (Section 6), user types into a song-search field.
2. Frontend calls `/api/spotify/search`, which uses an app-level (Client Credentials) token — no personal login needed just to search.
3. Matching tracks show as a dropdown (title, artist, album art).
4. User selects one → its Spotify track URI is saved onto the memory.

---

## 5) Real-Time / "Live" Elements

These aren't push-updated (no websockets needed) — they simply recompute against `Date.now()` every time a page loads or the tab regains focus:

1. Days-together counter and progress bar recalculate on every load.
2. "On this day" flashback recalculates on every load, checking today's date against all stored memories.
3. If today is her actual birthday, an additional locked/celebratory section unlocks (e.g. a final letter or video) — this is the one piece of content that's date-gated rather than always visible.

---

## 6) Adding / Editing a Memory Flow (your side)

1. From the dashboard, click "Add Memory" (only visible to you, the logged-in user — there's only one account, so no role logic needed).
2. Form prompts for: date, title, story text, photo upload(s), optional location, optional song (search flow from 4c).
3. On photo upload, frontend uploads directly to Cloudinary (or via a signed backend endpoint), receives back hosted URLs.
4. On submit, backend saves the new memory document to MongoDB.
5. Timeline dashboard re-fetches and the new entry appears in its correct chronological position — no redeploy needed.
6. Editing an existing memory follows the same form, pre-filled, with a Save/Delete option.

---

## 7) Session & Logout Flow

1. User clicks logout.
2. Backend clears the JWT cookie.
3. Frontend redirects to the Login Page.
4. Any attempt to hit a protected route without a valid cookie redirects straight back to Login.

---

## 8) Error & Edge Cases

- **Wrong login repeatedly**: no lockout needed for a 2-person site, but consider a short delay after a few failed attempts to deter brute-forcing.
- **Spotify token expired mid-session**: backend silently refreshes using the stored refresh token; user shouldn't notice.
- **Spotify refresh token revoked** (user disconnected access from their Spotify account settings): playback fails → prompt to reconnect Spotify again (Section 4a).
- **Non-Premium Spotify account tries to use the SDK**: SDK will refuse streaming control → immediately fall back to the embed player, no error shown to the user.
- **Photo upload fails**: show inline retry option on the form; don't lose the rest of the entered memory data.
- **No internet / API down**: timeline shows a friendly offline message rather than a blank page.
