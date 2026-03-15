import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider }              from './context/AuthContext';
import { ThemeProvider }             from './context/ThemeContext';
import { DictationSettingsProvider } from './context/DictationSettingsContext';
import ErrorBoundary from './components/layout/ErrorBoundary/ErrorBoundary';
import AppRouter     from './router/AppRouter';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <DictationSettingsProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </DictationSettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
