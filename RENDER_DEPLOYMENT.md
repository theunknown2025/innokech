# Deploy InnoKech to Render

Step-by-step guide to host your Vite + React frontend and PocketBase backend on Render (free tier).

> **Important:** You need **TWO separate Render services** — one Web Service (PocketBase) and one Static Site (frontend). Deploying as a single Web Service will fail because `pocketbase.exe` is Windows-only and Render runs Linux.

---

## Option A: Blueprint (Easiest — One-Click Setup)

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint**
2. Connect your GitHub repo and select the `innokech` repository
3. Render will detect `render.yaml` and create both services automatically
4. Click **Apply**
5. Wait for both to deploy, then configure CORS (see Part 3 below)

---

## Option B: Manual Setup

## Prerequisites

- [Render](https://render.com) account (free)
- [GitHub](https://github.com) account
- Your project pushed to a GitHub repository

---

## Part 1: Deploy PocketBase (Backend)

### Step 1: Push your code to GitHub

1. Initialize git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   ```

2. Create a new repo on GitHub, then:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

> **Note:** The `.gitignore` was updated to keep `backend/pb_migrations/` and `backend/Dockerfile` in the repo while excluding `pb_data` and the PocketBase binary.

### Step 2: Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub account and select your repository
4. Configure the service:

   | Field | Value |
   |-------|-------|
   | **Name** | `innokech-pocketbase` (or any name) |
   | **Region** | Choose closest to your users |
   | **Root Directory** | `backend` |
   | **Runtime** | **Docker** |
   | **Instance Type** | **Free** |

5. Scroll down to **Environment Variables** — add nothing for now (optional later).
6. Click **Create Web Service**.

### Step 3: Wait for deployment

- Render will build the Docker image and deploy
- When done, you'll get a URL like: `https://innokech-pocketbase.onrender.com`
- **Copy this URL** — you need it for the frontend.

### Step 4: Create PocketBase admin (first run)

1. Visit `https://YOUR-POCKETBASE-URL.onrender.com/_/` (note the `/_/`)
2. Create your first admin account (email + password)
3. Your collections (clients, quotes, etc.) will be created from migrations automatically

---

## Part 2: Deploy Frontend (Static Site)

### Step 5: Create a Static Site on Render

1. In Render Dashboard, click **New +** → **Static Site**
2. Select the same GitHub repository
3. Configure:

   | Field | Value |
   |-------|-------|
   | **Name** | `innokech` (or any name) |
   | **Root Directory** | Leave empty |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

### Step 6: Add environment variable

1. In the Static Site setup, find **Environment** (or **Environment Variables**)
2. Add:
   - **Key:** `VITE_POCKETBASE_URL`
   - **Value:** `https://YOUR-POCKETBASE-URL.onrender.com` (the URL from Step 3, **no trailing slash**)

3. Click **Create Static Site**

### Step 7: Wait for deployment

- Render will install deps, build, and deploy
- Your frontend will be at something like: `https://innokech.onrender.com`

---

## Part 3: Configure CORS in PocketBase

Your frontend and backend are on different domains. PocketBase must allow requests from your frontend:

1. Go to `https://YOUR-POCKETBASE-URL.onrender.com/_/`
2. Log in with your admin account
3. Go to **Settings** (gear icon) → **API**
4. Under **CORS**, add your frontend URL:
   ```
   https://innokech.onrender.com
   ```
   (Use your actual Render Static Site URL)
5. Save

---

## Part 4: Verify deployment

1. Open your frontend URL: `https://innokech.onrender.com`
2. Log in with the admin account you created in PocketBase
3. Confirm clients, quotes, and other features work as expected

---

## Important notes

### Free tier limits

- **Web Service (PocketBase):** Spins down after ~15 minutes of inactivity. First request after spin-down can take 30–60 seconds.
- **Static Site:** No spin-down; always available.
- **Data persistence:** On the free tier, Render does **not** provide persistent disk. The PocketBase database (`pb_data`) is **ephemeral** — it resets when the service restarts or redeploys. For production with real data, consider:
  - Upgrading to a paid Render plan with a persistent disk, or
  - Using a platform like Fly.io with volumes, or
  - Backing up regularly via PocketBase Admin → Backups.

### Custom domains

- Render allows custom domains on both free and paid plans.
- Add them under each service's **Settings** → **Custom Domains**.

### Updating the app

- Push changes to your `main` branch; Render will auto-deploy.
- For the frontend: redeploy if you change `VITE_POCKETBASE_URL` or other env vars.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `pocketbase.exe: not found` or `exec not found` | You deployed as a **single Web Service**. Delete it and use **Option A (Blueprint)** or create **two separate services** — a Docker Web Service for PocketBase + a Static Site for the frontend. |
| Frontend shows "Failed to fetch" or CORS errors | Add your frontend URL to PocketBase CORS (Part 3). |
| Backend returns 404 | Ensure Root Directory is `backend` for the Web Service. |
| Build fails | Check build logs; ensure `backend/pb_migrations` exists in the repo. |
| Slow first load | Normal on free tier; the service is waking from spin-down. |

---

## Summary of URLs

After deployment you'll have:

- **Frontend:** `https://innokech.onrender.com`
- **Backend (PocketBase):** `https://innokech-pocketbase.onrender.com`
- **PocketBase Admin:** `https://innokech-pocketbase.onrender.com/_/`
