# Connection Verification Checklist

Use this checklist to verify that your EduTrakerFront is properly connected to the EduTraker backend.

## ✅ Pre-Connection Checklist

### Backend Setup
- [ ] Backend repository cloned from https://github.com/MahmoudAlmodalal/EduTraker
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Database configured in backend `.env` file
- [ ] Database migrations applied (`python manage.py migrate`)
- [ ] Backend server running (`python manage.py runserver`)
- [ ] Backend accessible at http://localhost:8000

### Frontend Setup
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file exists with correct `VITE_API_URL`
- [ ] Development server running (`npm run dev`)
- [ ] Frontend accessible at http://localhost:5173

## 🔍 Configuration Verification

### 1. Environment Variables

**Check `.env` file:**
```bash
cat .env
```

Should contain:
```bash
VITE_API_URL=http://localhost:8000/api
```

### 2. Vite Proxy Configuration

**Check `vite.config.js`:**
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

✅ This configuration is correct and already in place.

### 3. API Client Configuration

**Check `src/utils/api.js`:**
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

✅ This configuration is correct and already in place.

## 🧪 Connection Testing

### Test 1: Backend API Direct Access

Open browser and navigate to:
```
http://localhost:8000/api/
```

**Expected Result:** Django REST Framework browsable API page or JSON response

### Test 2: Backend Health Check

Try accessing a specific endpoint:
```bash
curl http://localhost:8000/api/auth/login/
```

**Expected Result:** Should return method not allowed (405) or options for POST request

### Test 3: Frontend API Connection

1. Open frontend at http://localhost:5173
2. Open browser DevTools (F12)
3. Go to Network tab
4. Try to login or access any API endpoint
5. Check network requests

**Expected Result:**
- Requests should go to `http://localhost:5173/api/...` (proxied)
- Should see responses from backend
- No CORS errors

### Test 4: Authentication Flow

1. Navigate to login page at http://localhost:5173/login
2. Enter credentials (if you have a user created)
3. Submit login form
4. Check DevTools Network tab

**Expected Result:**
- POST request to `/api/auth/login/`
- Status: 200 OK (if credentials correct)
- Response contains `access_token` and `refresh_token`
- Redirected to appropriate dashboard

## 🐛 Troubleshooting

### Issue: "Failed to fetch" or "Network Error"

**Possible Causes:**
- Backend not running
- Wrong port configuration
- Firewall blocking connection

**Solutions:**
1. Verify backend is running: `curl http://localhost:8000/api/`
2. Check backend console for errors
3. Verify `.env` has correct URL
4. Restart both servers

### Issue: CORS Errors

**Possible Causes:**
- Backend CORS not configured
- Missing frontend URL in backend ALLOWED_ORIGINS

**Solutions:**
1. Check backend `settings.py` for CORS configuration:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```
2. Install django-cors-headers if not installed
3. Ensure it's in INSTALLED_APPS and MIDDLEWARE

### Issue: 401 Unauthorized

**Possible Causes:**
- No token in request
- Token expired
- Token not properly stored

**Solutions:**
1. Check localStorage in DevTools Application tab
2. Verify `accessToken` exists
3. Try logging out and back in
4. Check API interceptor in `src/utils/api.js`

### Issue: 404 Not Found

**Possible Causes:**
- Wrong API endpoint
- Backend URL mismatch
- Route not defined in backend

**Solutions:**
1. Verify endpoint exists in backend
2. Check backend `urls.py` files
3. Ensure correct API version (if applicable)
4. Check for typos in endpoint paths

## ✅ Success Indicators

You know the connection is working properly when:

1. ✅ No console errors about network/CORS
2. ✅ API requests in Network tab show successful responses
3. ✅ Login works and redirects to dashboard
4. ✅ Data loads on dashboard pages
5. ✅ Token refresh works automatically
6. ✅ Logout works and clears tokens

## 📊 Connection Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Running | ⏸️ Not Tested | Run `python manage.py runserver` |
| Frontend Running | ⏸️ Not Tested | Run `npm run dev` |
| Environment Config | ✅ Configured | `.env` file set up |
| Proxy Config | ✅ Configured | `vite.config.js` correct |
| API Client | ✅ Configured | `src/utils/api.js` correct |
| CORS Setup | ⏸️ Verify Backend | Check backend settings |
| Authentication | ⏸️ Not Tested | Test login flow |

## 🎯 Next Steps

After verifying the connection:

1. **Create Test User** (if not exists):
   ```bash
   cd EduTraker
   python manage.py createsuperuser
   ```

2. **Test All Features**:
   - [ ] Login/Logout
   - [ ] Dashboard loading
   - [ ] Data fetching
   - [ ] Form submissions
   - [ ] File uploads (if applicable)

3. **Monitor Console**:
   - Watch backend console for API requests
   - Watch frontend console for errors
   - Check Network tab for failed requests

4. **Test Different Roles**:
   - [ ] Student role
   - [ ] Teacher role
   - [ ] Guardian role
   - [ ] School Manager role
   - [ ] Secretary role

## 📝 Notes

- The frontend uses JWT authentication with automatic token refresh
- Tokens are stored in localStorage
- Token refresh happens automatically on 401 errors
- Session expires after inactivity (configured in backend)
- All API requests include the Bearer token automatically

## 🔗 Related Documentation

- [BACKEND_CONNECTION.md](BACKEND_CONNECTION.md) - Comprehensive connection guide
- [README.md](README.md) - Quick start guide
- Backend API Documentation - See backend repository

---

**Last Updated:** 2026-02-06
**Connection Status:** Configured and ready for testing
