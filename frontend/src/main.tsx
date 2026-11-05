import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#1f2937',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '12px 16px',
            maxWidth: '420px',
          },
          success: {
            iconTheme: { primary: '#16A36A', secondary: '#E6F7F0' },
          },
          error: {
            iconTheme: { primary: '#DC4545', secondary: '#FDEAEA' },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)
