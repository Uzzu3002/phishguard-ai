import { Home, LayoutDashboard, Inbox, BarChart3, Settings, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/emails', icon: Inbox, label: 'Inbox' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-[fadeIn_0.2s_ease-out]" 
          onClick={onClose}
        ></div>
      )}
      
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 border-r border-border bg-background flex flex-col pt-4 md:pt-6 
        transition-transform duration-300 ease-in-out h-full md:h-[calc(100vh-3.5rem)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-4 mb-4 md:hidden pb-4 border-b border-border">
          <h2 className="text-sm font-bold text-text tracking-wider uppercase">Menu</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text bg-white/5 p-1 rounded-md">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="px-4 mb-4 flex-1">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-3 hidden md:block">Menu</h2>
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to}
                onClick={onClose}
                className={({isActive}) => 
                  `flex items-center gap-3 px-3 py-2.5 md:py-2 text-sm font-medium rounded-lg transition-all duration-200 
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-secondary hover:text-text hover:bg-white/5'}`
                }
              >
                <link.icon className="w-5 h-5 md:w-4 md:h-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-4 hidden md:block">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-sm font-medium text-text">System Active</span>
            </div>
            <p className="text-xs text-text-secondary">AI detection engine is running flawlessly.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
