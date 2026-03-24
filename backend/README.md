Campus Sprint Hub - Backend

Overview
This is the backend API for the Campus Sprint Hub project.
It is a student project management system that supports user authentication, project collaboration, sprint planning, and task management.

--------------------------------------------------

Technologies Used
- Node.js
- Express.js
- Prisma ORM
- SQLite (development)
- JWT Authentication
- Bcrypt (password hashing)

--------------------------------------------------

Setup Instructions

1. Navigate to backend folder
cd backend

2. Install dependencies
npm install

3. Setup environment variables
Create a .env file inside backend with:

DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secret_key"
PORT=5000

4. Run database migration
npx prisma migrate dev

5. Start the server
npm run dev

Server will run on:
http://localhost:5000

--------------------------------------------------

API Endpoints

Auth
POST /api/auth/register
POST /api/auth/login

Projects
POST /api/projects
GET /api/projects
POST /api/projects/join

Sprints
POST /api/sprints

Tasks
POST /api/tasks
PATCH /api/tasks/:id/status

--------------------------------------------------

Notes for Frontend Team

- Backend runs on http://localhost:5000
- Use Bearer Token for protected routes
- Do NOT modify backend unless necessary and after discussing with me. 

--------------------------------------------------

Project Structure

backend/
  src/
  prisma/
  package.json

--------------------------------------------------

Author
Majd AL Housarya