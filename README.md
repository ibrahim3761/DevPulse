# DevPulse

A RESTful issue tracking API where developers can report bugs and request features. Built with Node.js, Express, and PostgreSQL.

**Live URL:** https://dev-pulse-six.vercel.app/

---

## Features

- User authentication with signup and login
- JWT-based authentication for protected routes
- Role-based access control (contributor / maintainer)
- Create, read, update, and delete issues
- Filter issues by type and status
- Sort issues by newest or oldest

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Password Hashing | bcrypt |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/devpulse.git
cd devpulse
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory

```env
DATABASE_URL=postgresql://username:password@localhost:5432/devpulse
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Start the development server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

---

## API Endpoints

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT token |

### Issues

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/issues` | Public | Get all issues (with filter & sort) |
| GET | `/api/issues/:id` | Public | Get a single issue |
| POST | `/api/issues` | Contributor, Maintainer | Create a new issue |
| PATCH | `/api/issues/:id` | Contributor (own, open), Maintainer | Update an issue |
| DELETE | `/api/issues/:id` | Maintainer | Delete an issue |

### Query Parameters for GET `/api/issues`

| Param | Values | Default |
|---|---|---|
| sort | `newest`, `oldest` | `newest` |
| type | `bug`, `feature_request` | — |
| status | `open`, `in_progress`, `resolved` | — |

---

## Database Schema

### users

| Column | Type | Description |
|---|---|---|
| id | SERIAL PRIMARY KEY | Unique identifier |
| name | VARCHAR(100) | User's full name |
| email | VARCHAR(255) UNIQUE | User's email address |
| password | TEXT | Hashed password |
| role | VARCHAR(100) | `contributor` or `maintainer` (default: `contributor`) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### issues

| Column | Type | Description |
|---|---|---|
| id | SERIAL PRIMARY KEY | Unique identifier |
| title | VARCHAR(150) | Issue title |
| description | TEXT | Issue description (min 20 chars) |
| type | VARCHAR(20) | `bug` or `feature_request` |
| status | VARCHAR(20) | `open`, `in_progress`, or `resolved` (default: `open`) |
| reporter_id | INT | References `users(id)` |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

---

## Role Permissions

| Action | Contributor | Maintainer |
|---|---|---|
| Sign up / Login | ✅ | ✅ |
| View issues | ✅ | ✅ |
| Create issue | ✅ | ✅ |
| Update own issue (open only) | ✅ | ✅ |
| Update any issue | ❌ | ✅ |
| Update issue status | ❌ | ✅ |
| Delete issue | ❌ | ✅ |

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": "Error details"
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```