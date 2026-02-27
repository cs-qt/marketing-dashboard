# ExpertMRI Marketing Dashboard

Full-stack TypeScript application for managing marketing analytics, social media content, and print/video production workflows.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Nginx (SSL, static files, reverse proxy)           │
├─────────────────────────────────────────────────────┤
│  React + TypeScript + Tailwind CSS (Vite build)     │
│    3 tabs: Analytics | Calendar | Production        │
│    + Media Gallery                                  │
├─────────────────────────────────────────────────────┤
│  Express + TypeScript (REST API, JWT Auth)           │
│    Google OAuth + Magic Link email auth              │
│    Role-based access: Creator | Reviewer | Admin     │
├─────────────────────────────────────────────────────┤
│  MongoDB Atlas (12 collections)                      │
│  AWS S3 (media, print-ready files)                   │
│  AWS SES/SMTP (email notifications)                  │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd expertmri
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, Google OAuth, AWS, SMTP credentials

# 3. Build shared types
npm run build -w shared

# 4. Run development
npm run dev
# Server: http://localhost:5000
# Client: http://localhost:3000 (proxied to server)

# 5. Seed admin user
npm run seed -- admin@yourdomain.com "Admin Name"

# 6. Import analytics from Google Sheets CSV
CSV_GOOGLE_ADS=<url> CSV_SEO=<url> CSV_SOCIAL=<url> npm run migrate
```

## Features

### Analytics Dashboard
- Google Ads, SEO/GEO, Social Media KPIs with trend charts
- Video Production and Print & Design project tracking
- Drill-down views with full data tables
- Auto-populated from approved production projects

### Social Media Calendar
- Monthly grid view with content chips (color-coded by status)
- Platform and status filters
- Hover tooltips, detail modals
- Full approval workflow with threaded comments

### Print & Video Production
- Project creation and management (Print + Video toggle)
- Same approval workflow as calendar
- Admin uploads print-ready downloadable files on approval
- Approved projects auto-feed Analytics dashboard widgets

### Approval Workflow
```
draft → pending_review → approved → scheduled
              ↓                ↑
           revision ───────────┘
```
- Creators: create, edit own drafts/revisions, submit for review
- Reviewers: approve or request revision with comments
- Admins: all permissions + schedule + upload print-ready files

### Threaded Comments
- Nested replies (up to 3 levels deep)
- Available on calendar posts, production projects, and months
- Email notifications to all participants

### Dual Authentication
- **Google OAuth** — for creators and admins (redirect flow → JWT cookie)
- **Magic Link Email** — for reviewers (email with 15-min token → JWT cookie)

## Project Structure

```
expertmri/
├── shared/src/           # Shared TypeScript types and enums
│   ├── enums.ts          # UserRole, PostStatus, Platform, etc.
│   └── dto.ts            # API DTOs
├── server/src/
│   ├── config/           # DB, S3, Passport, Email, Env
│   ├── models/           # 12 Mongoose models
│   ├── routes/           # Express route definitions
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic layer
│   ├── middleware/        # Auth, RBAC, validation, uploads
│   ├── validators/       # Zod schemas
│   ├── utils/            # JWT, logger, response helpers
│   └── seeds/            # User seeder + CSV migration
├── client/src/
│   ├── api/              # Axios API modules
│   ├── components/       # React components (analytics, calendar, production, comments, media, layout, shared)
│   ├── context/          # AuthContext
│   ├── pages/            # Dashboard, Login, MagicLinkVerify
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Formatters, constants, date helpers
│   └── styles/           # Tailwind CSS
├── deploy/               # Nginx configs, deploy script
├── Dockerfile            # Multi-stage production build
├── docker-compose.yml    # Docker deployment
└── ecosystem.config.cjs  # PM2 config
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/auth/google | Redirect to Google OAuth |
| GET | /api/auth/google/callback | OAuth callback |
| POST | /api/auth/magic-link | Send magic link email |
| GET | /api/auth/magic-link/verify | Verify magic link token |
| GET | /api/auth/me | Current user |
| POST | /api/auth/logout | Clear JWT cookie |

### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/analytics/dashboard-summary | All | Full dashboard data |
| GET | /api/analytics/google-ads | All | All Google Ads months |
| PUT | /api/analytics/google-ads/:monthKey | Admin | Upsert month data |
| GET/PUT/DELETE | /api/analytics/seo/:monthKey | All/Admin | SEO data |
| GET/PUT/DELETE | /api/analytics/social/:monthKey | All/Admin | Social data |

### Calendar
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/calendar/posts | All | List posts (filter by month/year/platform/status) |
| POST | /api/calendar/posts | Creator/Admin | Create post |
| PUT | /api/calendar/posts/:id | Creator/Admin | Update post |
| PATCH | /api/calendar/posts/:id/status | Role-based | Change status |
| DELETE | /api/calendar/posts/:id | Admin | Delete post |

### Production
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/production/projects | All | List projects |
| POST | /api/production/projects | Creator/Admin | Create project |
| PATCH | /api/production/projects/:id/status | Role-based | Change status |
| POST | /api/production/projects/:id/print-ready-file | Admin | Upload print-ready file |
| GET | /api/production/projects/:id/download | All | Download print-ready file |
| GET | /api/production/approved | All | Approved projects (for dashboard) |

### Comments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/comments/:entityType/:entityId | All | Get threaded comments |
| POST | /api/comments/:entityType/:entityId | All | Add comment/reply |
| PUT | /api/comments/:commentId | Author/Admin | Edit comment |
| DELETE | /api/comments/:commentId | Author/Admin | Soft delete |

### Media
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/months | All | List months |
| POST | /api/months | Admin | Create month |
| GET | /api/media/:monthId | All | List media |
| POST | /api/media/:monthId/upload | Creator/Admin | Upload media |
| POST | /api/media/:mediaId/version | Creator/Admin | Upload new version |
| PATCH | /api/media/:mediaId/active-version | Creator/Admin | Switch version |
| GET | /api/media/version/:versionId/download | All | Download (signed URL) |

## Deployment

### Option A: Docker (Recommended)
```bash
cp .env.example .env  # Configure
docker compose up -d
```

### Option B: Bare Metal VPS
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

### Option C: Manual
```bash
npm ci
npm run build -w shared && npm run build -w server && npm run build -w client
NODE_ENV=production node server/dist/index.js
```

## Environment Variables

See `.env.example` for all required variables:
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — Strong random string for JWT signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` — S3 storage
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — Email (SES or any SMTP)
- `CLIENT_URL` — Frontend URL (for CORS + redirects)

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Recharts, Vite
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB Atlas (12 collections)
- **Storage:** AWS S3 (media, print-ready files)
- **Auth:** Google OAuth 2.0 + Magic Link (Passport.js + JWT)
- **Email:** Nodemailer (AWS SES / SMTP)
- **Deploy:** Docker, Nginx, PM2, Let's Encrypt
