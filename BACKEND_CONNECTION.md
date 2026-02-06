# Backend Connection Guide

This document explains how the EduTrakerFront application connects to the EduTraker backend.

## Backend Repository

The backend for this application is maintained in a separate repository:
- **Repository:** https://github.com/MahmoudAlmodalal/EduTraker
- **Technology:** Django REST Framework
- **Default Port:** 8000

## Configuration

### Environment Variables

The frontend uses environment variables to configure the backend API URL:

**File:** `.env`

```bash
# Backend API URL - connects to EduTraker backend
# Repository: https://github.com/MahmoudAlmodalal/EduTraker
VITE_API_URL=http://localhost:8000/api
```

### Proxy Configuration

The Vite development server is configured with a proxy to handle API requests:

**File:** `vite.config.js`

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

This configuration:
- Forwards all `/api` requests to the backend server
- Handles CORS issues during development
- Allows the frontend to run on port 5173 while the backend runs on port 8000

## Running Both Applications

### Prerequisites

1. **Backend Setup** - Clone and set up the backend repository:
   ```bash
   git clone https://github.com/MahmoudAlmodalal/EduTraker.git
   cd EduTraker

   # Install dependencies
   pip install -r requirements.txt

   # Configure database (see backend README)
   # Set up .env file with database credentials

   # Run migrations
   python manage.py migrate

   # Create superuser (optional)
   python manage.py createsuperuser

   # Start the backend server
   python manage.py runserver
   ```

2. **Frontend Setup** - This repository:
   ```bash
   # Install dependencies
   npm install

   # Configure environment
   cp .env.example .env
   # Edit .env if needed

   # Start the frontend development server
   npm run dev
   ```

### Development Workflow

1. **Start Backend First:**
   ```bash
   cd EduTraker
   python manage.py runserver
   # Backend runs on http://localhost:8000
   ```

2. **Start Frontend:**
   ```bash
   cd EduTrakerFront
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **Access the Application:**
   - Open your browser to http://localhost:5173
   - The frontend will automatically proxy API requests to http://localhost:8000

## API Integration

The frontend uses Axios to communicate with the backend API:

**File:** `src/utils/api.js`

```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
```

### Key Features

1. **Authentication:**
   - JWT token-based authentication
   - Access token stored in localStorage
   - Automatic token refresh on 401 errors
   - Token included in Authorization header

2. **Request Interceptor:**
   - Automatically adds Bearer token to requests
   - Handles authentication for all API calls

3. **Response Interceptor:**
   - Automatically extracts response data
   - Handles token refresh on expiration
   - Provides user-friendly error messages
   - Redirects to login on session expiry

## API Endpoints

The backend exposes the following main API endpoints:

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/password-reset/` - Request password reset
- `POST /api/auth/password-reset-confirm/` - Confirm password reset

### User Management
- `GET /api/users/` - List users (role-based)
- `POST /api/users/create/` - Create new user
- `GET /api/users/{id}/` - Get user details
- `PATCH /api/users/{id}/` - Update user
- `POST /api/users/{id}/deactivate/` - Deactivate user

### Academic Management
- `GET /api/students/{id}/grades/` - Get student grades
- `POST /api/grades/` - Create grade entry
- `GET /api/attendance/` - Get attendance records
- `POST /api/attendance/` - Record attendance
- `GET /api/assignments/` - List assignments
- `POST /api/assignments/` - Create assignment

### Communication
- `GET /api/notifications/` - Get notifications
- `PATCH /api/notifications/{id}/mark-read/` - Mark as read
- `POST /api/messages/` - Send message
- `GET /api/messages/threads/` - Get message threads

### Reporting
- `POST /api/reports/student-performance/` - Generate student report
- `GET /api/reports/school-analytics/` - School analytics
- `GET /api/reports/workstream-analytics/` - Workstream analytics

For complete API documentation, refer to the backend repository README.

## Production Deployment

### Environment Configuration

For production deployment, update the `.env` file:

```bash
# Production backend URL
VITE_API_URL=https://your-backend-domain.com/api
```

### CORS Configuration

Ensure the backend is configured to accept requests from your frontend domain:

**Backend settings.py:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Development
    "https://your-frontend-domain.com",  # Production
]
```

### Build for Production

```bash
# Build the frontend
npm run build

# The dist/ folder will contain the production build
# Deploy this folder to your hosting service
```

## Troubleshooting

### Connection Refused

**Problem:** Cannot connect to backend
**Solution:**
- Verify backend is running on port 8000
- Check `VITE_API_URL` in `.env`
- Ensure no firewall blocking localhost:8000

### CORS Errors

**Problem:** CORS policy blocking requests
**Solution:**
- Verify backend CORS settings include frontend URL
- Check `ALLOWED_HOSTS` in backend settings
- Ensure proxy is configured correctly in `vite.config.js`

### 401 Unauthorized

**Problem:** API requests return 401
**Solution:**
- Check if user is logged in
- Verify token is being sent in Authorization header
- Check token expiration
- Clear localStorage and login again

### API Changes

**Problem:** Frontend breaks after backend update
**Solution:**
- Check backend API version compatibility
- Review backend CHANGELOG for breaking changes
- Update frontend API calls to match new endpoints
- Test all features after backend updates

## Development Tips

1. **Hot Reload:** Both frontend (Vite) and backend (Django) support hot reload during development

2. **API Testing:** Use tools like Postman or the Django REST Framework browsable API at http://localhost:8000/api/

3. **Database Changes:** After backend model changes, run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Environment Sync:** Keep frontend and backend environment files in sync for database and API configurations

## Additional Resources

- Backend Repository: https://github.com/MahmoudAlmodalal/EduTraker
- Backend README: Comprehensive API documentation and setup guide
- Frontend README: React and Vite setup information
- Django REST Framework Docs: https://www.django-rest-framework.org/
- Vite Proxy Docs: https://vitejs.dev/config/server-options.html#server-proxy
