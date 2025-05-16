# Medical Assessment System Backend API

This is the backend API for a medical assessment system built with Node.js, TypeScript, and MongoDB. The API supports various user roles and functionalities for managing medical assessments for Persons with Disabilities (PWDs).

## Features

- User authentication and authorization with JWT
- Role-based access control
- Medical assessment workflow
- File uploads
- Reporting and statistics
- Audit logging

## User Roles

- PWD (Persons with Disabilities)
- Guardian
- Medical Officer
- County Health Director
- System Administrator

## Tech Stack

- Node.js
- TypeScript
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Winston for logging

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medical_assessment_db
JWT_SECRET=your_jwt_secret_key_here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

4. Start the development server

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/change-password` - Change password

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/update-profile` - Update user profile
- `GET /api/users/:userId` - Get user by ID
- `POST /api/pwds/register` - Register a PWD (guardians only)
- `GET /api/guardians/my-pwds` - Get PWDs for a guardian
- `PUT /api/users/approve/:officerId` - Approve medical officer
- `PUT /api/users/manage/:userId` - Enable/disable a user (admin only)
- `PUT /api/users/assign-role/:userId` - Assign role/permissions (admin only)

### Assessments

- `POST /api/assessments/book` - Book a medical assessment
- `GET /api/assessments/status/:pwdId` - View assessment status
- `GET /api/assessments/assigned` - View assigned assessments (medical officers)
- `POST /api/assessments/submit/:assessmentId` - Submit assessment
- `PUT /api/assessments/review/:assessmentId` - Review assessment
- `PUT /api/assessments/finalize/:assessmentId` - Finalize assessment (directors)
- `GET /api/assessments/report/:assessmentId` - Get assessment report
- `GET /api/assessments/county` - Get county assessments (directors)

### File Uploads

- `POST /api/files/upload` - Upload a file
- `GET /api/files/:fileId` - Get file
- `DELETE /api/files/:fileId` - Delete file
- `GET /api/files/related/:type/:id` - Get related files

### Feedback

- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback (admin only)

### Reports

- `GET /api/reports/county-summary` - Generate county summary (directors)
- `GET /api/reports/system` - Generate system-wide report (admin)

## License

This project is licensed under the MIT License.