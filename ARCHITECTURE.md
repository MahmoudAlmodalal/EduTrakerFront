# EduTraker Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    http://localhost:5173                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VITE DEVELOPMENT SERVER                       │
│                      (Frontend - React)                          │
│                    http://localhost:5173                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  React Application                                      │    │
│  │  - Components (UI)                                      │    │
│  │  - Pages (Views)                                        │    │
│  │  - Context (State Management)                           │    │
│  │  - Routes (Navigation)                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  API Client (Axios)                                     │    │
│  │  - JWT Authentication                                   │    │
│  │  - Request/Response Interceptors                        │    │
│  │  - Automatic Token Refresh                              │    │
│  │  - Error Handling                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Vite Proxy Configuration                               │    │
│  │  /api/* → http://localhost:8000                         │    │
│  │  - CORS Handling                                        │    │
│  │  - Development Convenience                              │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ Proxied API Requests
                               │ /api/* → http://localhost:8000/*
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DJANGO DEVELOPMENT SERVER                     │
│                      (Backend - Django REST)                     │
│                    http://localhost:8000                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Django REST Framework API                              │    │
│  │  - Authentication Endpoints                             │    │
│  │  - User Management                                      │    │
│  │  - Academic Management                                  │    │
│  │  - Communication                                        │    │
│  │  - Reporting                                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Business Logic                                         │    │
│  │  - Models (Data Structure)                              │    │
│  │  - Serializers (Data Validation)                        │    │
│  │  - Views (Request Handlers)                             │    │
│  │  - Permissions (Access Control)                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  CORS Middleware                                        │    │
│  │  - Allows: http://localhost:5173                        │    │
│  │  - Handles preflight requests                           │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ Database Queries
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MySQL DATABASE                           │
│                      (Data Persistence)                          │
│                                                                  │
│  - Users & Authentication                                        │
│  - Schools & Workstreams                                         │
│  - Students, Teachers, Guardians                                 │
│  - Grades, Attendance, Assignments                               │
│  - Messages, Notifications                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow Example

### Authentication Flow

```
1. User enters credentials in Login Form
   Frontend: http://localhost:5173/login

2. React submits form → API Client
   JavaScript: api.post('/auth/login/', { email, password })

3. Vite Proxy intercepts request
   Original: http://localhost:5173/api/auth/login/
   Proxied:  http://localhost:8000/api/auth/login/

4. Django receives request
   Backend: POST /api/auth/login/
   Validates credentials

5. Django generates JWT tokens
   Response: { access_token, refresh_token, user }

6. API Client receives response
   Stores tokens in localStorage

7. React redirects to dashboard
   Frontend: http://localhost:5173/dashboard

8. Subsequent requests include token
   Header: Authorization: Bearer <access_token>
```

### Data Fetching Flow

```
1. Component mounts, needs data
   React: useEffect(() => { fetchData() }, [])

2. API call with authentication
   JavaScript: api.get('/students/123/grades/')
   Interceptor adds: Authorization: Bearer <token>

3. Request proxied to backend
   From: http://localhost:5173/api/students/123/grades/
   To:   http://localhost:8000/api/students/123/grades/

4. Django validates token & permissions
   - Verifies JWT signature
   - Checks user has permission
   - Retrieves data from database

5. Django returns data
   Response: { success: true, data: [...grades] }

6. API Client extracts data
   Interceptor: return response.data

7. React updates component
   setState(grades)
   Component re-renders with data
```

## Key Configuration Files

### Frontend Configuration

**`.env`** - Environment variables
```bash
VITE_API_URL=http://localhost:8000/api
```

**`vite.config.js`** - Vite proxy setup
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

**`src/utils/api.js`** - Axios configuration
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});
```

### Backend Configuration

**`settings.py`** - Django CORS settings
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

ALLOWED_HOSTS = ['localhost', '127.0.0.1']
```

**`urls.py`** - API routing
```python
urlpatterns = [
    path('api/auth/', include('accounts.urls')),
    path('api/students/', include('student.urls')),
    path('api/teachers/', include('teacher.urls')),
    # ... other API routes
]
```

## Technology Stack

### Frontend Stack
- **React** 19.2.0 - UI Library
- **Vite** 7.2.4 - Build Tool & Dev Server
- **Axios** 1.13.4 - HTTP Client
- **React Router** 7.10.1 - Navigation
- **Lucide React** - Icon Library

### Backend Stack
- **Django** 4.2+ - Web Framework
- **Django REST Framework** 3.14+ - API Framework
- **MySQL** 8.0+ - Database
- **JWT** - Authentication
- **Python** 3.9+ - Programming Language

## Security Features

### Authentication & Authorization
1. **JWT Tokens**
   - Access Token (1 hour expiry)
   - Refresh Token (7 days expiry)
   - Automatic refresh on 401 errors

2. **Request Security**
   - HTTPS in production
   - CORS protection
   - CSRF tokens
   - Input validation

3. **Role-Based Access Control**
   - Student, Teacher, Guardian, Secretary, School Manager, Super Admin
   - Permission checks at API and UI levels
   - Data isolation by scope (school/workstream)

## Development Workflow

1. **Start Backend**
   ```bash
   cd EduTraker
   python manage.py runserver
   # Runs on http://localhost:8000
   ```

2. **Start Frontend**
   ```bash
   cd EduTrakerFront
   npm run dev
   # Runs on http://localhost:5173
   ```

3. **Development**
   - Edit frontend files → Hot reload (Vite)
   - Edit backend files → Auto reload (Django)
   - API changes require both sides to be updated

4. **Testing**
   - Frontend: Browser DevTools, Network tab
   - Backend: Django REST browsable API
   - End-to-end: Full user flow testing

## Production Deployment

### Frontend Build
```bash
npm run build
# Creates optimized bundle in dist/
# Deploy to: Vercel, Netlify, AWS S3, etc.
```

### Backend Deployment
```bash
# Configure production settings
# Set up gunicorn/uwsgi
# Deploy to: Render, Heroku, AWS, etc.
```

### Environment Updates
- Frontend: Update `VITE_API_URL` to production backend URL
- Backend: Update `CORS_ALLOWED_ORIGINS` to include production frontend URL
- Both: Enable HTTPS/TLS

## Repositories

- **Frontend**: https://github.com/MahmoudAlmodalal/EduTrakerFront
- **Backend**: https://github.com/MahmoudAlmodalal/EduTraker

## Related Documentation

- [BACKEND_CONNECTION.md](BACKEND_CONNECTION.md) - Connection setup guide
- [CONNECTION_VERIFICATION.md](CONNECTION_VERIFICATION.md) - Testing checklist
- [README.md](README.md) - Quick start guide
