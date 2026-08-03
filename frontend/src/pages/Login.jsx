import { Shield, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import API_BASE_URL from '../constants/api';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Premium background styling */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-md z-10 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-soft flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Welcome back</h1>
          <p className="text-text-secondary mt-1">Sign in to your security dashboard</p>
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-3 py-3" onClick={() => window.location.href = `${API_BASE_URL}/api/auth/login`}>
              <Mail className="w-5 h-5" />
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-text-secondary">Or use email</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email address</label>
                <input 
                  type="email" 
                  placeholder="admin@company.com" 
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600 shadow-sm" 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Password</label>
                  <a href="#" className="text-xs text-primary hover:text-blue-400">Forgot password?</a>
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-600 shadow-sm" 
                />
              </div>
              
              <Link to="/dashboard" className="block pt-2">
                <Button className="w-full py-2.5">Sign In</Button>
              </Link>
            </form>
          </div>
        </Card>
        
        <p className="text-center text-xs text-text-secondary mt-6 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Secure, encrypted login.
        </p>
      </div>
    </div>
  );
}
