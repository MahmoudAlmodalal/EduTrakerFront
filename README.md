# 🎓 EduTraker Frontend

A comprehensive education management system frontend built with React and Vite.

## 📋 Table of Contents

- [Overview](#overview)
- [Backend Integration](#backend-integration)
- [Getting Started](#getting-started)
- [Features](#features)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)

## 🌟 Overview

EduTraker is a modern education management platform designed to facilitate communication and monitoring between students, teachers, guardians, and school administrators. This repository contains the frontend application built with React and Vite.

## 🔗 Backend Integration

This frontend connects to the **EduTraker backend** repository:

- **Backend Repository**: [https://github.com/MahmoudAlmodalal/EduTraker](https://github.com/MahmoudAlmodalal/EduTraker)
- **Backend Technology**: Django REST Framework
- **API Documentation**: See [BACKEND_CONNECTION.md](BACKEND_CONNECTION.md)

### Quick Setup

1. **Start the backend first**:
   ```bash
   # Clone backend repository
   git clone https://github.com/MahmoudAlmodalal/EduTraker.git
   cd EduTraker

   # Install dependencies and run
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   # Backend runs on http://localhost:8000
   ```

2. **Start this frontend**:
   ```bash
   # Install dependencies
   npm install

   # Start development server
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **Access the application**:
   - Open browser to http://localhost:5173
   - API requests automatically proxy to http://localhost:8000

📖 **For detailed backend connection instructions, see [BACKEND_CONNECTION.md](BACKEND_CONNECTION.md)**

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see above)

### Installation

```bash
# Clone repository
git clone [repository-url]
cd EduTrakerFront

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## ✨ Features

### Multi-Role Support
- **Students**: View grades, attendance, and learning materials
- **Teachers**: Manage classes, grades, and attendance
- **Guardians**: Monitor children's academic progress
- **School Managers**: Oversee school operations and analytics
- **Secretaries**: Handle student admissions and administrative tasks

### Key Features
- 📱 Responsive Design (mobile-first)
- 🌙 Dark Mode Support
- 🔐 Role-Based Access Control
- 💬 Real-time Communication
- 📊 Analytics & Reporting
- ♿ Accessibility (WCAG AA compliant)
- 🎨 Modern UI/UX

## 📚 Documentation

### Quick Links
- [Backend Connection Guide](BACKEND_CONNECTION.md) - **Start here for API setup**
- [Complete README](README_UPDATED.md) - Comprehensive project documentation
- [Horizontal Scroll Guide](HORIZONTAL_SCROLL_QUICK_START.md) - Component usage
- [Caching Guide](CACHING_QUICK_REFERENCE.md) - Data caching strategies

### API Integration

The frontend uses Axios to communicate with the Django backend:

```javascript
// Configuration in src/utils/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

Key features:
- JWT authentication with automatic token refresh
- Automatic request/response interceptors
- Error handling and user-friendly messages
- CORS handling via Vite proxy

## 🛠️ Technology Stack

- **React** 19.2.0 - UI framework
- **Vite** 7.2.4 - Build tool
- **React Router** 7.10.1 - Routing
- **Axios** 1.13.4 - HTTP client
- **Lucide React** - Icons
- **Recharts** - Data visualization

## 📂 Project Structure

```
src/
├── components/        # Reusable components
├── pages/            # Page components
├── routes/           # Routing configuration
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
│   └── api.js        # API client configuration
└── config/           # Configuration files
```

## 🔐 Environment Variables

```bash
# .env file
VITE_API_URL=http://localhost:8000/api  # Backend API URL
```

For production:
```bash
VITE_API_URL=https://your-backend-domain.com/api
```

## 🧪 Testing

```bash
npm run lint          # Run ESLint
npm run test          # Run tests (when configured)
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Follow the project structure
2. Write clean, commented code
3. Test all changes before committing
4. Update documentation as needed

## 📄 License

This project is proprietary to EduTraker. All rights reserved.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for education management.

---

**For comprehensive documentation, see [README_UPDATED.md](README_UPDATED.md)**
