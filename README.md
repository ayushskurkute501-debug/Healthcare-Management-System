# Healthcare Management System

A full-stack healthcare management application built with:
- Core Java / Spring Boot, JPA, REST APIs
- React.js (Vite) frontend
- MySQL / H2 database

## Project structure

- `backend/` – Spring Boot REST API and persistence layer
- `frontend/` – React (Vite) application
- `docker-compose.yml` – MySQL service for local development
- `database.sql` – Optional SQL schema/seed

## Quick start (local)

1. Start the MySQL database (optional – backend defaults to H2 in-memory for `dev` profile):
   ```bash
   docker compose up -d
   ```

2. Start the backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   Backend runs on http://localhost:8080

3. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on http://localhost:5173

4. Open the frontend in the browser and sign in using the sample accounts.

## Default credentials

- **Admin**: `healthcareadmin` / `HealthCare@2026`
- **Doctor**: `Dr. Supriya Shinde (Sr. Cardiologist)` / `doc123` (or any seeded doctor name + `doc123`)
- **Patient**: `Rahul Sharma` / `patient123` (or other seeded patients)

## Environment variables (Frontend)

| Variable          | Description                          | Default                        |
|-------------------|--------------------------------------|--------------------------------|
| `VITE_API_URL`    | Backend API base URL                 | `http://localhost:8080/api`    |

Create a `.env` file in `frontend/` for local overrides:
```
VITE_API_URL=http://localhost:8080/api
```

## Deploy frontend on Vercel

1. Push the project to a GitHub repository (or import the folder).

2. In Vercel dashboard → New Project → Import the repo.

3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: the public URL of your deployed backend + `/api`  
     (e.g. `https://your-backend.railway.app/api` or `https://your-backend.onrender.com/api`)

5. Deploy.

### CLI deployment (alternative)

From the `frontend` folder:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Deploy (first time will ask questions)
vercel

# Production deploy
vercel --prod
```

When prompted / in project settings, set:
- Root Directory: `.` (if you run from frontend/) or `frontend` (if from monorepo root)
- Environment Variable `VITE_API_URL` pointing to your backend API.

**Important**: The backend (Spring Boot) cannot run on Vercel. Deploy it separately to:
- Railway
- Render
- Fly.io
- AWS Elastic Beanstalk / App Runner
- Google Cloud Run
- or any VPS with Java 17 + MySQL

For production backend, set the Spring profile to `prod` and provide `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` environment variables.

## Notes

- Backend uses H2 (in-memory) by default via `dev` profile – data is lost on restart.
- For persistent MySQL: start docker-compose, set `spring.profiles.active=prod` (or use application-prod.properties) and provide DB credentials.
- Frontend falls back to local mock data if the backend is unreachable.
