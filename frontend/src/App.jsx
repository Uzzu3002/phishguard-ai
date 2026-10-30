import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Route-level code splitting: heavy pages (Reports pulls in recharts + jsPDF) load on demand
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmailList = lazy(() => import('./pages/EmailList'));
const EmailDetails = lazy(() => import('./pages/EmailDetails'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
import { ScanProvider } from './context/ScanContext';
import FloatingAICopilot from './components/FloatingAICopilot';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => (
  <>
    <Outlet />
    <FloatingAICopilot />
  </>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<ScanProvider />}>
              <Route element={<AuthLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="emails" element={<EmailList />} />
                <Route path="email/:id" element={<EmailDetails />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
