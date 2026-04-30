# TaskPilot

TaskPilot is a full-stack team task manager built with React, Express, MongoDB, and JWT authentication. It is designed around a real project workflow where admins create projects, add members, assign tasks, and track progress with clear role-based access.

## Features

- JWT authentication with signup and login
- Project creation and team membership management
- Role-based access control for `admin` and `member`
- Task creation, assignment, priority, due date, and status tracking
- Dashboard with project count, active work, overdue tasks, and task status breakdown
- MongoDB relationships across users, projects, members, and tasks

## Tech Stack

- Frontend: React + Vite
- Backend: Express
- Database: MongoDB Atlas with Mongoose
- Auth: JWT + bcryptjs

## Local Start

Backend:

```bash
cd /Users/kritikatrivedi/Desktop/EthraAI/backend
npm start
```

Frontend:

```bash
cd /Users/kritikatrivedi/Desktop/EthraAI/frontend
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5050/api`

## Demo Workflow

1. Sign up two users.
2. Log in as the first user and create a project.
3. Add the second user to the project by email as `member` or `admin`.
4. Create tasks, assign them, and set due dates.
5. Log in as the assigned member and update task status from the project workspace.

## Role Rules

- `admin`
  - Create projects
  - Add members
  - Create tasks
  - Update any task in the project
- `member`
  - View projects they belong to
  - Update status only for tasks assigned to them

## Deploy on Railway

This repo is best deployed to Railway as an isolated monorepo with two separate services:

- `backend` for the Express API
- `frontend` for the React + Vite app

### 1. Push the repo to GitHub

Railway works best when both services are connected to the same GitHub repository.

### 2. Create two Railway services

Inside one Railway project, create:

- one service for `frontend`
- one service for `backend`

Then connect both services to the same GitHub repo.

### 3. Set the root directory for each service

In Railway service settings:

- frontend root directory: `/frontend`
- backend root directory: `/backend`

### 4. Deploy the backend first

Set these variables on the backend service:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.up.railway.app
```

After the first backend deploy, generate a public domain for the backend service.

Your API will be available at:

```text
https://your-backend-domain.up.railway.app/api
```

Health check:

```text
https://your-backend-domain.up.railway.app/api/health
```

### 5. Deploy the frontend

Set this variable on the frontend service:

```env
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app/api
```

Then deploy the frontend and generate its public domain.

### 6. Update backend CORS if the frontend domain changes

If Railway gives you a different frontend domain, update:

```env
CLIENT_URL=https://your-new-frontend-domain.up.railway.app
```

and redeploy the backend.

### 7. Optional: use Railway reference variables

Railway supports service-to-service variable references. If your services are named exactly `frontend` and `backend`, you can use:

Backend:

```env
CLIENT_URL=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

Frontend:

```env
VITE_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

If your Railway service names are different, replace `frontend` and `backend` with the exact service names.

### Recommended Railway settings

- Backend start command: `npm start`
- Frontend build command: `npm run build`
- Keep watch paths scoped to each service directory if you want cleaner monorepo deploys

### Deployment order

1. Deploy backend
2. Generate backend domain
3. Set `VITE_API_BASE_URL` on frontend
4. Deploy frontend
5. Generate frontend domain
6. Set `CLIENT_URL` on backend
7. Redeploy backend
