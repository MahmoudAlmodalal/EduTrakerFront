import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

console.log('App.jsx loaded');

function App() {
  console.log('App component rendering...');

  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
