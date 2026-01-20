# 🔔 Notif - Notification Management System

A full-stack notification management system with real-time updates, email/SMS integration, and customizable templates.

## ✨ Features

- **📬 Notification CRUD** - Create, read, update, delete notifications
- **🔍 Advanced Filtering** - Filter by type, priority, read status, date range
- **📧 Email Integration** - SendGrid for transactional emails
- **📱 SMS Integration** - Twilio for SMS notifications
- **⚡ Real-time Updates** - WebSocket (Socket.io) for live notifications
- **📝 Template System** - Customizable templates with variable substitution
- **🔐 Authentication** - JWT-based auth with email/phone verification
- **🎨 Theme Support** - Light, dark, and system themes
- **📊 Queue System** - BullMQ for async processing

## 🛠️ Tech Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| **Frontend**  | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend**   | Express.js, TypeScript, Prisma ORM              |
| **Database**  | PostgreSQL (Supabase)                           |
| **Queue**     | BullMQ with Redis (Upstash)                     |
| **Real-time** | Socket.io                                       |
| **Email**     | SendGrid                                        |
| **SMS**       | Twilio                                          |

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Prisma client
│   │   ├── queues/         # BullMQ workers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── sockets/        # Socket.io handlers
│   │   └── utils/          # Utilities & validators
│   └── prisma/             # Database schema
└── frontend/
    └── src/
        ├── app/            # Next.js pages
        ├── components/     # React components
        ├── contexts/       # React contexts
        └── lib/            # Utilities & API client
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (or Supabase account)
- Redis instance (or Upstash account)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/notif.git
cd notif
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable              | Description                           |
| --------------------- | ------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string          |
| `JWT_SECRET`          | Secret for JWT signing (min 32 chars) |
| `REDIS_URL`           | Redis connection string               |
| `SENDGRID_API_KEY`    | SendGrid API key                      |
| `SENDGRID_FROM_EMAIL` | Verified sender email                 |
| `TWILIO_ACCOUNT_SID`  | Twilio account SID                    |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token                     |
| `TWILIO_PHONE_NUMBER` | Twilio phone number                   |

Push database schema:

```bash
npm run db:push
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Start the frontend:

```bash
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api-docs

## 📡 API Endpoints

### Authentication

| Method | Endpoint                    | Description       |
| ------ | --------------------------- | ----------------- |
| POST   | `/api/auth/register`        | Register new user |
| POST   | `/api/auth/login`           | Login user        |
| GET    | `/api/auth/me`              | Get current user  |
| PUT    | `/api/auth/profile`         | Update profile    |
| PUT    | `/api/auth/change-password` | Change password   |
| DELETE | `/api/auth/delete-account`  | Delete account    |

### Notifications

| Method | Endpoint                      | Description                       |
| ------ | ----------------------------- | --------------------------------- |
| GET    | `/api/notifications`          | List notifications (with filters) |
| POST   | `/api/notifications`          | Create notification               |
| GET    | `/api/notifications/:id`      | Get single notification           |
| PUT    | `/api/notifications/:id/read` | Mark as read                      |
| PUT    | `/api/notifications/read-all` | Mark all as read                  |
| DELETE | `/api/notifications/:id`      | Delete notification               |
| DELETE | `/api/notifications/all`      | Delete all                        |

### Query Parameters for Filtering

```
?page=1&limit=10
&isRead=true|false|all
&type=INFO|SUCCESS|WARNING|ERROR|SYSTEM
&priority=LOW|MEDIUM|HIGH
&startDate=2024-01-01
&endDate=2024-12-31
&sortBy=createdAt
&sortOrder=desc
```

### Templates

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/api/templates`             | List templates         |
| POST   | `/api/templates`             | Create template        |
| PUT    | `/api/templates/:id`         | Update template        |
| DELETE | `/api/templates/:id`         | Delete template        |
| POST   | `/api/templates/:id/preview` | Preview with variables |

### Preferences

| Method | Endpoint           | Description          |
| ------ | ------------------ | -------------------- |
| GET    | `/api/preferences` | Get user preferences |
| PUT    | `/api/preferences` | Update preferences   |

## 🔄 Real-time Events

The application uses Socket.io for real-time updates:

| Event                   | Payload               | Description                 |
| ----------------------- | --------------------- | --------------------------- |
| `notification:new`      | `Notification`        | New notification received   |
| `notification:read`     | `{ id, unreadCount }` | Notification marked as read |
| `notification:deleted`  | `{ id, unreadCount }` | Notification deleted        |
| `notification:all-read` | `{ unreadCount: 0 }`  | All marked as read          |

## 📧 Template Variables

Templates support variable substitution using `{{variableName}}` syntax:

```
Subject: Welcome, {{name}}!
Body: Hi {{name}}, your verification code is {{code}}.
```

## 🚢 Deployment

### Backend (Render)

1. Create a Web Service on Render
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Set Build Command: `npm install && npm run build`
5. Set Start Command: `npm run start`
6. Add environment variables from `.env.exmaple`
7. Deploy

### Frontend (Vercel)

1. Import repo to Vercel
2. Set root directory to `frontend`
3. Add `NEXT_PUBLIC_API_URL` pointing to Render backend URL
4. Deploy

## 🧪 Mock Mode

For development without real email/SMS:

```env
EMAIL_MOCK_MODE=true
SMS_MOCK_MODE=true
```

Emails and SMS will be logged to console instead of being sent.

## 📝 License

MIT License

---

Built with ❤️ using Express.js, Next.js, and TypeScript
