# Gym Membership Management System

A full-stack gym management application with staff and member sign-in, membership management, attendance, point of sale, and transaction tracking.

## Technology

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Authentication: JWT

## Run with Docker

Docker Compose runs the frontend, backend, and MongoDB together. Node.js and npm do not need to be installed on the computer running the app; the Dockerfiles install the project dependencies inside the containers using the committed lockfiles.

### Requirements

- Docker Desktop installed and running
- A local `backend/.env` file containing a JWT secret

Create `backend/.env` with a long, private value, for example:

```env
JWT_SECRET=replace-this-with-your-own-long-random-value
```

Do not commit the real `.env` file or share its secret. It is ignored by Git. For the Docker setup, Compose supplies the MongoDB address to the backend, so the app connects to the `mongo` service rather than to Atlas.

### Start the application

From the project root, run:

```powershell
docker compose up --build
```

The first build may take a few minutes while Docker downloads the Node image and installs dependencies. Keep this terminal open while using the app.

- Frontend: <http://localhost:5173>
- Backend status: <http://localhost:5000>
- MongoDB: `mongodb://localhost:27017` (available only from this computer)

The frontend sends API requests through Vite to the backend container. The backend connects to MongoDB at `mongodb://mongo:27017/gym_management`.

### Initialize a new database

On the first run with a new, empty Docker database, open a second terminal in the project root and run:

```powershell
docker compose exec backend node seed.js
```

The seed script creates default settings and an administrator if they do not already exist. On a fresh database, the starter staff login is:

- Username: `admin`
- Password: `admin123`

These are development credentials; do not use them for a public or production deployment.

### Stop and restart

Press `Ctrl+C` in the terminal running Compose to stop the app. You can also stop and remove its containers with:

```powershell
docker compose down
```

The MongoDB data is stored in the `mongo_data` Docker volume and is preserved by `docker compose down`. **Do not run `docker compose down -v` unless you intend to delete that Docker database and its data.**

To start again without rebuilding:

```powershell
docker compose up
```

Use `docker compose up --build` after changing a Dockerfile or dependency manifest.

## Database and Atlas

The Docker app uses a local MongoDB database named `gym_management`. Its data is kept in a Docker volume on the computer running Docker; it is not stored in Git and is not automatically shared with other computers.

The existing MongoDB Atlas database is separate and is not changed by this Docker setup. Compose overrides `MONGO_URI` so the Docker backend uses the local `mongo` service. Existing Atlas data must be explicitly backed up and imported if you want to copy it into Docker.

To inspect the Docker database from PowerShell:

```powershell
docker compose exec mongo mongosh gym_management
```

At the MongoDB prompt, list collections with `show collections`. For example, staff accounts are in `staffs`. Type `exit` to leave the shell.

## Useful Docker commands

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f mongo
docker compose build
```

`docker compose build` builds the images without starting the app. The frontend container currently runs Vite's development server; a production deployment needs a separate production frontend image and server configuration.
