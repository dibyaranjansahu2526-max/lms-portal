# LMS Portal

A complete Learning Management System with a Spring Boot REST API and a React front end. It supports three roles (Admin, Teacher, Student), JWT authentication, course and lesson management, server-scored quizzes, progress tracking, and downloadable PDF certificates.

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Java 17, Spring Boot 3.4.5, Spring Security, Spring Data JPA, JWT (JJWT), Maven |
| Database | MySQL 8 (default), H2 file database (optional `dev` profile) |
| PDF | OpenPDF |
| Frontend | React 18, Vite 8, React Router, Axios, Tailwind CSS, Lucide icons |
| Validation | Jakarta Bean Validation |

## Features

### Admin
- Dashboard with user, course, enrollment, lesson and quiz counts
- View and delete users
- View and delete courses

### Teacher
- Create, edit, publish/unpublish and delete their own courses
- Manage lessons (title, text, YouTube URL, material URL, order)
- Build quizzes with multiple options and one correct answer per question
- View enrolled students, their progress, and completion status

### Student
- Browse published courses and filter by search text or category
- Enroll in courses and view them under **My Courses**
- Read lessons, watch embedded YouTube videos, open lesson materials
- Mark lessons complete and track progress
- Take quizzes scored on the server (correct answers are never sent to the browser)
- Download a PDF certificate after completing all lessons and passing all quizzes

### Security
- Register/login with JWT (24-hour tokens by default)
- Public registration always creates `STUDENT` accounts
- Role-based route and API protection (`ADMIN`, `TEACHER`, `STUDENT`)
- Passwords hashed with BCrypt
- Global exception handler returns consistent JSON errors
- CORS allows the frontend origin (`http://localhost:5173` by default)

## Project structure

```
lmsportal/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/lms/
│       │   ├── config/        # Security, JWT, CORS, data seeding
│       │   ├── controller/    # REST controllers
│       │   ├── dto/           # Request/response records
│       │   ├── entity/        # JPA entities
│       │   ├── exception/     # Global exception handler
│       │   ├── repository/    # Spring Data repositories
│       │   └── service/       # Business logic
│       └── resources/
│           ├── application.properties
│           └── application-dev.properties
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── api/               # Axios client and helpers
        ├── components/        # Layout, navbar, shared UI
        ├── context/           # Authentication context
        └── pages/
            ├── auth/          # Login, registration
            ├── admin/         # Dashboard, users, courses
            ├── teacher/       # Courses, lessons, quizzes, students
            └── student/       # Catalog, my courses, learning, quiz
```

## Prerequisites

- **Java 17+** (`java -version`)
- **Maven 3.9+** (`mvn -version`) — the project does not include a Maven wrapper
- **Node.js 20.19+ or 22.12+** and npm (required by Vite 8)
- **MySQL 8+** (only if you use the default profile)

## 1. Database setup (MySQL)

Create the database once. The backend can also create it automatically because the JDBC URL includes `createDatabaseIfNotExist=true`, but the MySQL user must have permission to do so.

```sql
CREATE DATABASE lms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

The default configuration in `backend/src/main/resources/application.properties` is:

```
spring.datasource.url=jdbc:mysql://localhost:3306/lms_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=your_mysql_password
```

The project does not ship with a database password. You must set `DB_PASSWORD` to your MySQL password before starting the backend. For the local database created above, this is the password for your `root` user.

Set it in your shell before running the backend:

**PowerShell:**

```powershell
$env:DB_PASSWORD = "your_mysql_password"
```

**Command Prompt:**

```bat
set DB_PASSWORD=your_mysql_password
```

**macOS/Linux:**

```bash
export DB_PASSWORD=your_mysql_password
```

Other supported environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/lms_db?...` | JDBC URL |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | none — required | Database password (for example, `your_mysql_password`) |
| `SERVER_PORT` | `8080` | Backend port |
| `JWT_SECRET` | built-in dev secret | JWT signing key — **change in production** |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24 hours) |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Permitted frontend origin |

Tables are created/updated automatically by Hibernate (`spring.jpa.hibernate.ddl-auto=update`). Seed data is ensured on every startup without deleting existing records. Base users, enrollments and progress are reused when already present, and each additional course is inserted by title only if it is missing.

## 2. Run the backend

From the project root:

```bash
cd backend
mvn spring-boot:run
```

On Windows PowerShell, if Maven is not on `PATH`, use the full path to `mvn.cmd`.

The API starts at **http://localhost:8080** with context path `/api`. Verify it is up with a login request:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin@lms.com","password":"admin123"}'
```

Or with curl:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lms.com","password":"admin123"}'
```

### Optional: run without MySQL (H2 dev profile)

A separate profile uses an H2 file database so you can try the app without installing/configuring MySQL:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

- Data is stored in `backend/data/lms_dev.*`.
- H2 console: **http://localhost:8080/h2-console** (JDBC URL `jdbc:h2:file:./data/lms_dev`, user `sa`, empty password).
- To reset the dev database, stop the backend and delete the `backend/data` directory; it will be reseeded on the next start.
- The `dev` profile is for local evaluation only. The default profile uses MySQL.

## 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

The frontend calls `http://localhost:8080/api` by default. To use a different API URL, create `frontend/.env`:

```
VITE_API_URL=http://localhost:8080/api
```

A ready-to-copy example is provided in `frontend/.env.example`.

## Default logins

The seeder creates these accounts on first startup:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lms.com` | `admin123` |
| Teacher | `teacher1@lms.com` | `teacher123` |
| Teacher | `teacher2@lms.com` | `teacher123` |
| Student | `student1@lms.com` | `student123` |
| Student | `student2@lms.com` | `student123` |
| Student | `student3@lms.com` | `student123` |

The login screen also has **Student / Teacher / Admin** demo buttons that fill in these credentials.

### Seeded content

- **Java Spring Boot Masterclass** — Priya Sharma, 3 lessons, 1 quiz (student1 enrolled with 1 lesson completed)
- **Modern React & Tailwind CSS** — Marcus Chen, 3 lessons, 1 quiz (student2 enrolled)
- **Data Structures Essentials** — Priya Sharma, 3 lessons, 1 quiz
- **20 additional courses** split across all 10 categories (2 per category), each with 4 lessons, 1 quiz and 5 questions, assigned across the two teachers
- Additional courses include Python, JavaScript, MERN, responsive design, operating systems, networking, Pandas, analytics SQL, machine learning, generative AI, MySQL, database design, AWS, Docker/Kubernetes, Android, Flutter, cybersecurity, ethical hacking, workplace communication and interview preparation
- Sample enrollments and progress so **My Courses** and the admin/teacher dashboards are populated immediately
- Existing records are preserved and duplicate titles are skipped on restart

## Main API endpoints

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register a student |
| POST | `/auth/login` | Public | Login and receive a JWT |
| GET | `/auth/me` | Authenticated | Current user profile |
| GET | `/courses?search=&category=` | Authenticated | Browse published courses |
| GET | `/courses/categories` | Authenticated | List categories |
| GET | `/courses/{id}` | Authenticated | Course details |
| POST | `/courses/{id}/enroll` | Student | Enroll in a course |
| GET | `/student/courses` | Student | My enrolled courses |
| GET | `/student/courses/{id}/learning` | Student | Lessons, quizzes and progress |
| POST | `/student/lessons/{id}/complete` | Student | Mark a lesson complete |
| GET | `/student/quizzes/{id}` | Student | Quiz questions (without answers) |
| POST | `/student/quizzes/{id}/attempts` | Student | Submit answers and get score |
| GET | `/student/courses/{id}/certificate` | Student | Download PDF certificate |
| GET | `/teacher/courses` | Teacher | My courses |
| POST/PUT/DELETE | `/teacher/courses[...]` | Teacher | Course CRUD |
| GET/POST/PUT/DELETE | `/teacher/lessons[...]` | Teacher | Lesson CRUD |
| GET/POST/PUT/DELETE | `/teacher/quizzes[...]` | Teacher | Quiz CRUD |
| GET | `/teacher/courses/{id}/students` | Teacher | Enrolled students and progress |
| GET | `/admin/stats` | Admin | Dashboard counts |
| GET/DELETE | `/admin/users[...]` | Admin | List/delete users |
| GET/DELETE | `/admin/courses[...]` | Admin | List/delete courses |

Errors use a consistent JSON shape, for example:

```json
{
  "timestamp": "2026-11-05T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Passwords do not match",
  "path": "/api/auth/register"
}
```

## Certificates

A certificate is generated when:

1. The student is enrolled in the course.
2. Every lesson in the course is marked complete.
3. Every quiz in the course has been passed (score ≥ the quiz pass mark).

The PDF includes the student name, course name, completion date, and a unique certificate code. Completion state and the certificate code are stored in the database.

## Production build

### Backend

```bash
cd backend
mvn clean package
java -jar target/lms-backend-1.0.0.jar
```

The default (MySQL) configuration is used. Start it with the `dev` profile if needed:

```bash
java -jar target/lms-backend-1.0.0.jar --spring.profiles.active=dev
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

The production bundle is written to `frontend/dist`. Serve it with any static web server and set `VITE_API_URL` at build time to your deployed API URL.

## Troubleshooting

- **`Access denied for user 'root'@'localhost'`** — set `DB_PASSWORD` to your real MySQL password before starting the backend.
- **`Unknown database 'lms_db'`** — create the database or confirm the MySQL user can create databases.
- **CORS error in the browser** — make sure the frontend runs on `http://localhost:5173`, or set `CORS_ALLOWED_ORIGIN` to the URL you use.
- **Blank page after login / 401 responses** — tokens expire after 24 hours; sign out and sign in again.
- **Port already in use** — stop the process using port 8080/5173, or set `SERVER_PORT` and update `VITE_API_URL` accordingly.
- **Vite version error on install** — use Node.js 20.19+ or 22.12+.
- **Want a clean MySQL demo database** — stop the backend, run `DROP DATABASE lms_db; CREATE DATABASE lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`, then restart it. Seed data is recreated automatically.
- **Want a clean demo database (H2 dev profile)** — stop the backend, delete `backend/data`, and restart.

## Security notes

- Change `JWT_SECRET` and the seeded account passwords before deploying.
- No database password is committed to the project; provide it through `DB_PASSWORD` and use a dedicated database user in production.
- Passwords are stored as BCrypt hashes.
- Quiz correct answers are validated only on the server.
