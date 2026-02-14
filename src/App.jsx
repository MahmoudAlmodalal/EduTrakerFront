import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/AppRoutes';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import NetworkStatusBar from './components/NetworkStatusBar';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';

function App() {
    const queryClient = React.useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,
                        gcTime: 10 * 60 * 1000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                        networkMode: 'offlineFirst',
                    },
                    mutations: {
                        networkMode: 'offlineFirst',
                    }
                }
            }),
        []
    );

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <ThemeProvider>
                        <ToastProvider>
                            <NetworkStatusBar />
                            <AppRoutes />
                            <PWAUpdatePrompt />
                        </ToastProvider>
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
