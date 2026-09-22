# Birthday Memory Site — System v1 (`hbd-system`)

A modular, romantic digital keepsake and birthday memory timeline built with an Express backend and modern Vanilla JavaScript ES Modules frontend. Features warm paper textures, polaroid scrapbook styling, live anniversary counters, photo lightbox carousels, date-gated birthday surprises with confetti, and Spotify playback.

---

## 🚀 Quick Start (Running the System)

### 1. Prerequisites
Make sure you have **Node.js** (v18+ recommended) installed.

### 2. Install & Start
Open a terminal (PowerShell or Command Prompt) and run:

```bash
cd hbd-system
npm install
npm start
```

For auto-restarting development mode:
```bash
npm run dev
```

### 3. Access the Site
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

### 4. User Accounts & Roles

The system has **two distinct user accounts**:

| User Type | Username | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Admin (You)** | `love` *(or `shantanu` / `admin`)* | `password123` | **Full Creator Access**: Can add memories, edit memories, upload images into `uploads/`, search Spotify, and add/change/remove songs. |
| **Viewer (Partner)** | `rubina` *(or `viewer`)* | `love123` | **Read-Only Access**: Can view the living timeline, photo gallery carousels, listen to attached songs, view counters, and unlock birthday reveal. Cannot edit or delete anything. |

*(Both accounts and passwords are fully configurable in `.env`!)*

---

## ✍️ How to Manage Memories, Photos & Spotify Songs

### For You (Admin)

#### 1. Adding a Memory & Uploading Photos
1. Log in with your admin credentials (`love` / `password123`).
2. Click **+ Add Memory** in the top navigation or bottom-left floating button.
3. Fill in the date, title, location, and story.
4. In the **Photos** section, click **Browse Image Files** or drag-and-drop photos. Photos are automatically saved directly into the **`uploads/`** directory.
5. In the **Attached Spotify Song** section:
   - Type a song or artist name to search Spotify live using your API credentials.
   - Or paste a Spotify track link directly (e.g. `open.spotify.com/track/...`).
   - Click **Attach**.
6. Click **Save Memory**.

#### 2. Changing or Removing a Song
1. Click on any memory polaroid to open the full lightbox detail view.
2. Click **✏️ Edit Memory & Music**.
3. In the Spotify Song section:
   - Click **Change Song** to pick another track.
   - Click **Remove Song** to detach the music completely.
4. Click **Save Changes**.

---

### For the Viewer (Rubina)
- When Rubina logs in with `rubina` / `love123`, she receives a warm personalized welcome splash (*"Hi Rubina, welcome back ❤️"*).
- She can explore the entire romantic timeline, view all memories, swipe through the photo carousels, and listen to the attached Spotify music.
- All edit, add, delete, and settings controls are hidden, and all modification API routes enforce `403 Forbidden` protection.

#### 4. Testing & Previewing the Birthday Reveal
- On her actual birthday (matching the Month & Day in settings), a special celebratory card unlocks with confetti, celebratory music, and your birthday letter.
- To test or preview it right now on any other day: scroll to the birthday section and click **🔓 Preview Birthday Reveal (Test Mode)**!

---

### Method 2: Bulk Editing via Files (Fast Setup)

If you have lots of memories or quotes written down already, editing the local files directly is very quick:

#### 1. Personal Settings & Quotes (`server/data/personalConfig.json`)
Open `hbd-system/server/data/personalConfig.json` in your editor. You can edit:
- `"partnerName"` and `"yourName"`
- `"relationshipStartDate"` (e.g. `"2026-03-21T00:00:00"`)
- `"birthday"`: Month, Day, Title, Letter, and Quote
- `"reasonsToLove"`: Array of sweet quotes/reasons you love her
- `"coupons"`: Redeemable romantic coupons
- `"quiz"`: Pop quiz questions and trivia about your relationship

#### 2. Pre-Seeded Memories (`server/data/seedMemories.json`)
The site comes pre-seeded with 19 real timeline moments.
- You can add, edit, or remove entries in `server/data/seedMemories.json` or `server/data/store.json`.
- Each memory has:
  ```json
  {
    "id": "mem-01",
    "date": "2026-03-21",
    "title": "The First Cafe Date",
    "story": "We went to my favourite cafe...",
    "location": "Parcafe",
    "photos": [
      "/uploads/PXL_20260616_202304977.jpg"
    ],
    "song": {
      "name": "Winning Speech",
      "artist": "Karan Aujla",
      "albumArt": "https://i.scdn.co/image/ab67616d...",
      "uri": "spotify:track:1vYxhvVqJoxeBq4Xl7U9F6",
      "id": "1vYxhvVqJoxeBq4Xl7U9F6"
    }
  }
  ```

#### 3. Adding Photos Manually
- Drop any `.jpg`, `.png`, or `.webp` files directly into `hbd-system/uploads/`.
- Reference them in your memory as `"/uploads/my_photo.jpg"`.

---

## 🎵 Spotify Music Integration

The system supports two Spotify playback modes:

1. **Automatic Embed Player (Zero Setup)**:
   - Even without any Spotify developer keys, whenever a song is attached, the player renders Spotify's official responsive interactive player widget. Anyone can play preview clips or full tracks directly!
2. **Web Playback SDK (Full In-Page Stream for Spotify Premium)**:
   - To enable full in-browser playback with custom vinyl controls:
     1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
     2. Create an App and add Redirect URI: `http://localhost:3000/api/spotify/callback`.
     3. Copy your `Client ID` and `Client Secret` into `hbd-system/.env`:
        ```env
        SPOTIFY_CLIENT_ID=your_client_id_here
        SPOTIFY_CLIENT_SECRET=your_client_secret_here
        ```
     4. Restart the server and click **Connect Spotify** in the website header.

---

## 🏗️ System Architecture & Modularity

The system is structured into clean, modular layers for easy maintenance:

```
hbd-system/
├── package.json               # Node.js dependencies (express, bcryptjs, jsonwebtoken, etc.)
├── .env                       # Active environment secrets & config
├── uploads/                   # Uploaded photos stored on disk
├── server/
│   ├── server.js              # Express app setup, static hosting & API routing
│   ├── config/config.js       # Centralized config parser
│   ├── db/
│   │   └── store.js           # Atomic JSON / MongoDB dual-mode data repository
│   ├── data/
│   │   ├── personalConfig.json# Editable quotes, names, birthday letter & dates
│   │   ├── seedMemories.json  # Initial timeline moments
│   │   └── store.json         # Active persistent database file
│   ├── middleware/
│   │   ├── auth.js            # httpOnly JWT cookie authentication
│   │   ├── rateLimiter.js     # Login brute-force protection
│   │   └── errorHandler.js    # Standardized error responses
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth (login, logout, me)
│   │   ├── memoryRoutes.js    # /api/memories (CRUD, on-this-day)
│   │   ├── spotifyRoutes.js   # /api/spotify (OAuth, search, tokens)
│   │   ├── uploadRoutes.js    # /api/upload (photos to disk / Cloudinary)
│   │   └── configRoutes.js    # /api/config (get/update personal details)
│   └── services/
│       ├── cryptoService.js   # AES-256-GCM token encryption
│       └── spotifyService.js  # Spotify Web API client
└── client/
    ├── index.html             # Clean HTML shell
    ├── css/
    │   ├── variables.css      # Color tokens (paper, rose, plum, gold) & fonts
    │   ├── base.css           # Paper grain texture, typography & resets
    │   ├── components.css     # Polaroids, ticket stubs, buttons, modals, toasts
    │   ├── timeline.css       # Monthly stream, jump pills, birthday reveal
    │   └── player.css         # Audio controls, vinyl spin animation & embed
    └── js/
        ├── main.js            # App coordinator & router
        ├── state.js           # Reactive observable state
        ├── api.js             # Typed backend fetch client
        ├── utils/
        │   ├── dateUtils.js   # Live counters & milestone calculations
        │   └── dom.js         # Confetti burst animation & DOM helpers
        └── components/
            ├── authView.js      # Login form & welcome splash
            ├── statsHeader.js   # Live counter ticket stub & progress bar
            ├── onThisDay.js     # "On this day" flashback highlight
            ├── timelineView.js  # Month-grouped polaroid timeline
            ├── memoryCard.js    # Individual polaroid card with tape
            ├── memoryDetail.js  # Lightbox photo carousel & story
            ├── memoryModal.js   # Add/Edit form with photo upload & song search
            ├── spotifyPlayer.js # Audio player with embed fallback
            ├── birthdayLock.js  # Date-gated celebration with confetti
            ├── settingsModal.js # Personal details customizer
            └── toast.js         # Toast alert notifications
```

---

## 🧪 Running Tests

To run the automated backend test suite (testing login, cookies, memory CRUD, and flashback):

```bash
npm test
```
