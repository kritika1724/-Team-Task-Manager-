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
