# 🎓 EduTraker - Education Management System

## 📱 Project Overview

EduTraker is a comprehensive education management platform designed to facilitate communication and monitoring between students, teachers, guardians, and school administrators. Built with modern React and Vite, it provides a responsive, mobile-first experience.

---

## 🎯 Core Features

### For Students
- 📊 View academic results and GPA
- 📚 Access course materials
- 💬 Communication with teachers
- 📍 Attendance tracking
- 📋 Assignment submissions

### For Teachers
- 📈 Grade management
- 📊 Class analytics
- 💬 Student communication
- ✅ Attendance marking
- 📝 Resource sharing

### For Guardians
- 👶 Child performance monitoring
- 📞 School communication
- 📊 Attendance overview
- 🎯 Academic progress tracking
- 📱 Mobile-friendly interface

### For School Managers
- 🏫 School configuration
- 👥 Staff management
- 📊 Analytics & reports
- 🔧 System administration
- 📈 Performance metrics

### For Secretaries
- 📝 Student admissions
- 👤 Guardian linking
- 📋 Attendance management
- 📞 Communication

---

## 🛠️ Technology Stack

### Frontend
- **React**: 19.2.0
- **Vite**: 7.2.4 (Ultra-fast build tool)
- **React Router**: 7.10.1
- **Axios**: 1.13.4
- **Recharts**: 3.5.1 (Charts & analytics)
- **Lucide React**: Icon library

### Styling & Design
- **CSS3**: Modern styling with CSS variables
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Theme switching support
- **Design Tokens**: Global color/spacing variables

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MahmoudAlmodalal/EduTrakerFront.git
cd EduTrakerFront
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API endpoint
```

4. **Start development server**
```bash
npm run dev
```

Server runs at: `http://localhost:5173/`

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 📂 Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── MainLayout.jsx         - Main app layout
│   │   ├── Header.jsx             - Top navigation
│   │   └── Sidebar.jsx            - Left sidebar
│   ├── shared/                    - Reusable components
│   ├── Guardian/                  - Guardian role components
│   ├── Teacher/                   - Teacher role components
│   ├── Student/                   - Student role components
│   ├── Secretary/                 - Secretary role components
│   └── SchoolManager/             - Manager role components
├── pages/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── RoleSelection.jsx
│   └── [Role-specific pages]
├── routes/
│   ├── AppRoutes.jsx              - Main routing
│   └── ProtectedRoute.jsx         - Auth protection
├── context/
│   ├── AuthContext.jsx            - Authentication
│   └── ThemeContext.jsx           - Theme management
├── services/                       - API service layer
├── hooks/                          - Custom React hooks
├── config/                         - Configuration files
├── styles/                         - Global styles
└── utils/                          - Utility functions
```

---

## 📱 Responsive Design

### Breakpoints

| Breakpoint | Width | Device |
|-----------|-------|--------|
| **xs** | <480px | Mobile Phone |
| **sm** | 480-640px | Small Phone |
| **md** | 640-768px | Large Phone/Tablet |
| **lg** | 768-1024px | Tablet |
| **xl** | 1024px+ | Desktop |

### Browser Support
- ✅ Chrome/Edge 64+
- ✅ Firefox 69+
- ✅ Safari 13.1+

---

## 🎨 Design System

### Color Palette

#### Light Mode
- **Primary**: #4f46e5 (Indigo)
- **Success**: #10b981 (Emerald)
- **Warning**: #f59e0b (Amber)
- **Error**: #ef4444 (Red)
- **Background**: #ffffff (White)
- **Text**: #0f172a (Slate)

#### Dark Mode
- **Primary**: #6366f1 (Light Indigo)
- **Background**: #0f172a (Dark Slate)
- **Surface**: #1e293b (Slate)
- **Text**: #f1f5f9 (Light Slate)

### Typography
- **Font Family**: System fonts (San Francisco, Segoe UI, etc.)
- **Body**: 14-16px
- **Heading**: 20-32px
- **Small**: 12-13px

---

## 🔐 Authentication & Roles

### Role-Based Access Control

The application implements comprehensive role-based access control with the following roles:

1. **Student**: View personal academics
2. **Teacher**: Manage classes and grades
3. **Guardian**: Monitor children
4. **Secretary**: Administrative support
5. **School Manager**: School configuration
6. **Super Admin**: System administration

### Protected Routes
Routes are protected by the `ProtectedRoute` component that verifies user authentication and role permissions.

### Theme Support
- 🌙 Dark/Light mode toggle
- 💾 Persistent theme preference
- 🎨 Role-specific color customizations
- 🌍 RTL language support (Arabic, Hebrew)

---

## 🔄 API Integration

The application uses Axios for API communication with the backend. Configure the API endpoint in your `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

### Service Layer
- `studentService.js` - Student-related API calls
- `teacherService.js` - Teacher-related API calls
- `managerService.js` - Manager-related API calls
- `workstreamService.js` - Workstream management

---

## 🧪 Testing

### Manual Testing
1. **Responsive Testing**
   - Use DevTools device emulation
   - Test all breakpoints
   - Test landscape/portrait orientations

2. **Dark Mode Testing**
   - Toggle dark mode in settings
   - Verify all colors are visible
   - Check contrast ratios

3. **Accessibility Testing**
   - Tab through all interactive elements
   - Test with screen readers
   - Verify keyboard navigation

---

## 🚀 Deployment

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm run preview
```

The build output will be in the `dist/` folder.

### Environment Configuration
Create appropriate `.env` files for different environments:

```env
VITE_API_URL=https://api.edutraker.com
VITE_APP_NAME=EduTraker
```

### Hosting Options
- Vercel (recommended for React apps)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Docker container (Dockerfile included)

### Docker Deployment

```bash
# Build Docker image
docker build -t edutraker-front .

# Run container
docker run -p 80:80 edutraker-front
```

---

## 🔒 Security

### Implemented Features
- ✅ Protected routes with authentication
- ✅ Role-based access control
- ✅ XSS protection (React escaping)
- ✅ Environment variable management

### Best Practices
- Never store sensitive data in localStorage
- Use environment variables for API endpoints
- Validate all user input on backend
- Keep dependencies updated
- Regular security audits

---

## 📞 Support & Contributing

### Getting Help
1. Check documentation files
2. Review code examples
3. Check DevTools console
4. Search existing issues

### Reporting Issues
- Include browser version
- Include steps to reproduce
- Include error messages
- Include screenshots

### Contributing
- Follow project structure
- Write clean, commented code
- Test before submitting
- Update documentation

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **React Version** | 19.2.0 |
| **Vite Version** | 7.2.4 |
| **Components** | 30+ |
| **Pages** | 20+ |
| **Responsive Breakpoints** | 5 |

---

## 📝 License

This project is proprietary to EduTraker. All rights reserved.

---

## 👥 Team

- **Product**: Education Management System
- **Technology**: React + Vite
- **Status**: Active Development
- **Version**: 0.0.0

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices for education management.

---

**Happy coding! 🚀**
