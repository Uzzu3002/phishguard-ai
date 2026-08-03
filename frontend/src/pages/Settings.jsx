import { User, Bell, Shield, Mail, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import API_BASE_URL from '../constants/api';

export default function Settings() {
  const [authData, setAuthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setAuthData(data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAuth();
  }, []);

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-danger text-center font-medium mt-12">Unable to load account information.</p>
      </div>
    );
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/revoke`, {
        method: 'POST',
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setToastMessage("Gmail disconnected successfully.");
        timeoutRef.current = setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setToastMessage("Unable to disconnect Gmail.");
        setIsDisconnecting(false);
        setShowConfirm(false);
      }
    } catch (err) {
      setToastMessage("Unable to disconnect Gmail.");
      setIsDisconnecting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out] relative">
      {/* Toast Notification Layer */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast type={toastMessage.includes('Unable') ? 'error' : 'success'} message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-text">Platform Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your account, preferences, and integrations.</p>
      </div>
      
      <Card className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          {authData?.picture ? (
            <img src={authData.picture} alt="Profile" className="w-8 h-8 rounded-full border border-border" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
          <h2 className="text-lg font-semibold text-text">Profile</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
            <input type="text" defaultValue={authData?.name || ''} className="w-full bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:border-primary transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input type="email" defaultValue={authData?.email || ''} className="w-full bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:border-primary transition-all opacity-70 cursor-not-allowed" disabled />
          </div>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">Connected Integrations</h2>
        </div>
        <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background/50">
          <div>
            <p className="font-medium text-text">Google Workspace (Gmail)</p>
            <p className="text-sm text-text-secondary">
              {authData?.authenticated && authData?.email ? `Connected as ${authData.email}` : 'Not Connected'}
            </p>
          </div>
          <Button variant="secondary" size="sm">Configure</Button>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">Security Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text">AI Detection Sensitivity</p>
              <p className="text-sm text-text-secondary">Higher sensitivity may flag more false positives.</p>
            </div>
            <select className="bg-background border border-border rounded-lg p-2 text-text focus:outline-none focus:border-primary transition-all w-32">
              <option>Low</option>
              <option selected>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-medium text-text">Real-time Notifications</p>
              <p className="text-sm text-text-secondary">Get alerted immediately for high-risk emails.</p>
            </div>
            <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-danger/30 bg-danger/5 relative overflow-hidden">
        <div className="flex items-center gap-3 pb-4 border-b border-danger/20 mb-4">
          <Trash2 className="w-5 h-5 text-danger" />
          <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
        </div>
        <p className="text-sm text-text-secondary mb-4">Disconnecting your inbox will immediately stop all AI analysis and delete your synchronized email metadata.</p>
        <Button variant="danger" className="w-full sm:w-auto" onClick={() => setShowConfirm(true)}>Disconnect Gmail</Button>

        {showConfirm && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-10">
            <div className="bg-card border border-border rounded-xl p-5 shadow-2xl max-w-sm w-full text-center space-y-4 animate-[slideUp_0.2s_ease-out]">
              <h3 className="text-lg font-bold text-text">Disconnect your Gmail account?</h3>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={isDisconnecting}>Cancel</Button>
                <Button variant="danger" onClick={handleDisconnect} disabled={isDisconnecting}>
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
