import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EmailList from './pages/EmailList';
import EmailDetails from './pages/EmailDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
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
    </Router>
  );
}

export default App;
