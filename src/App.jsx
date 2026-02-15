import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
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
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    duration: 3200,
                                    style: {
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.85rem'
                                    }
                                }}
                            />
                            <PWAUpdatePrompt />
                        </ToastProvider>
                    </ThemeProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
