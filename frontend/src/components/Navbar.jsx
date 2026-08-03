import { useState, useEffect, useRef } from 'react';
import { Shield, Bell, User, Search, Menu, LogOut, Settings, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../constants/api';

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
          setUser(data);
        } else {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      navigate('/login');
    } catch (err) {
      // Ignore logout errors
    }
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick} 
          className="md:hidden text-text-secondary hover:text-text bg-white/5 p-1.5 rounded-md mr-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-text tracking-tight text-lg">PhishGuard AI</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4 md:gap-5">
        <div className="hidden lg:flex items-center gap-2 text-text-secondary bg-card border border-border rounded-lg px-3 py-1.5 text-sm hover:border-white/20 transition-colors cursor-text">
          <Search className="w-4 h-4" />
          <span className="w-48 text-left">Search emails, reports...</span>
          <span className="text-xs bg-white/5 px-1.5 rounded border border-border ml-2">⌘K</span>
        </div>
        
        <button className="text-text-secondary hover:text-text transition-colors relative hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-background"></span>
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center ring-2 ring-transparent hover:ring-border transition-all cursor-pointer shadow-inner overflow-hidden"
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white/80" />
            )}
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && user && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-[fadeIn_0.15s_ease-out]">
              <div className="p-4 border-b border-border bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border">
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">{user.name}</p>
                    <p className="text-xs text-text-secondary truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 border border-success/20 px-2 py-1 rounded-md w-max">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gmail Connected
                </div>
              </div>
              <div className="p-1.5">
                <button 
                  onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-white/5 rounded-md transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-md transition-colors mt-0.5"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
