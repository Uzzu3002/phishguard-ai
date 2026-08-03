import { useState, useEffect } from 'react';
import { Filter, ShoppingCart, Video, Globe, ShieldAlert, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import RiskBadge from '../components/RiskBadge';
import { RISK_LEVELS } from '../constants/riskLevels';
import { useScan } from '../context/ScanContext';
import API_BASE_URL from '../constants/api';

export default function EmailList() {
  const navigate = useNavigate();
  const { scanData, loading: scanLoading, error: scanError } = useScan();
  const [filter, setFilter] = useState('all');
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const mapEmailData = (sourceEmails) => {
      return sourceEmails.map(email => {
        let brandIcon = Globe;
        let brandName = 'Unknown';
        let avatarColor = 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        const senderLower = (email.sender || '').toLowerCase();
        
        if (senderLower.includes('netflix')) {
          brandIcon = Video; brandName = 'Netflix'; avatarColor = 'bg-red-500/10 text-red-500 border-red-500/20';
        } else if (senderLower.includes('paypal')) {
          brandIcon = CreditCard; brandName = 'PayPal'; avatarColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        } else if (senderLower.includes('amazon')) {
          brandIcon = ShoppingCart; brandName = 'Amazon'; avatarColor = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        } else if (senderLower.includes('google')) {
          brandIcon = Globe; brandName = 'Google'; avatarColor = 'bg-green-500/10 text-green-500 border-green-500/20';
        }
        
        let timeStr = 'Unknown';
        if (email.date) {
          const d = new Date(email.date);
          if (!isNaN(d.getTime())) {
            timeStr = d.toLocaleDateString() === new Date().toLocaleDateString() 
              ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
              : d.toLocaleDateString();
          } else {
            timeStr = email.date.substring(0, 16);
          }
        }

        const risk = email.verdict === 'HIGH_RISK' ? RISK_LEVELS.HIGH : email.verdict === 'REVIEW' ? RISK_LEVELS.MEDIUM : RISK_LEVELS.LOW;

        return {
          id: email.messageId,
          subject: email.subject || '(No Subject)',
          sender: email.sender || 'Unknown',
          time: timeStr,
          risk,
          summary: email.explainer?.summary || (email.snippet ? (email.snippet.length > 60 ? email.snippet.substring(0, 60) + '...' : email.snippet) : 'No summary available.'),
          brandIcon,
          brandName,
          avatarColor
        };
      });
    };

    if (!debouncedQuery.trim()) {
      if (scanData && scanData.results) {
        setEmails(mapEmailData(scanData.results));
      } else {
        setEmails([]);
      }
      return;
    }

    const abortController = new AbortController();
    const fetchEmails = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE_URL}/api/gmail/emails`);
        url.searchParams.append('q', debouncedQuery.trim());

        const response = await fetch(url.toString(), {
          credentials: 'include',
          signal: abortController.signal
        });
        const result = await response.json();
        
        if (result.success) {
          setEmails(mapEmailData(result.data));
        } else {
          setError(result.message || 'Failed to fetch emails');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEmails();
    return () => abortController.abort();
  }, [debouncedQuery, scanData]);

  const filtered = filter === 'all' ? emails : emails.filter(e => e.risk === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Inbox</h1>
          <p className="text-sm text-text-secondary mt-1">Review AI classifications for all incoming mail.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchBar 
            placeholder="Search sender, subject..." 
            className="w-full sm:w-64" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setDebouncedQuery(searchQuery);
              }
            }}
          />
          <div className="relative group">
            <button className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg bg-card text-text-secondary hover:text-text hover:border-white/20 transition-all w-full sm:w-auto">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1">
              {['all', RISK_LEVELS.HIGH, RISK_LEVELS.MEDIUM, RISK_LEVELS.LOW].map(r => (
                <button 
                  key={r}
                  onClick={() => setFilter(r)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${filter === r ? 'bg-white/10 text-text' : 'text-text-secondary hover:bg-white/5 hover:text-text'}`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-background/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
          <div className="col-span-5">Subject & AI Summary</div>
          <div className="col-span-3">Sender</div>
          <div className="col-span-2 text-center">Risk</div>
          <div className="col-span-2 text-right">Time</div>
        </div>
        
        {/* List */}
        <div className="divide-y divide-border">
          {(!debouncedQuery && scanLoading) || (debouncedQuery && loading) ? (
            <div className="p-8 text-center text-text-secondary text-sm">
              Loading emails... (this might take up to 60 seconds)
            </div>
          ) : (debouncedQuery && error) ? (
            <div className="p-8 text-center text-red-400 text-sm">
              {error}
            </div>
          ) : (
            <>
              {filtered.map(email => {
            const Icon = email.brandIcon;
            return (
              <div 
                key={email.id} 
                onClick={() => navigate(`/email/${email.id}`)}
                className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:items-center hover:bg-white/[0.02] cursor-pointer transition-all hover:scale-[1.002] group"
              >
                {/* Mobile & Desktop hybrid layout */}
                <div className="md:col-span-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${email.avatarColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between md:hidden mb-1">
                      <span className="text-xs font-medium text-text-secondary">{email.brandName}</span>
                      <span className="text-xs text-text-secondary">{email.time}</span>
                    </div>
                    <h3 className="font-medium text-text truncate group-hover:text-primary transition-colors">
                      {email.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary/80 font-medium hidden md:inline-block">🤖 AI:</span>
                      <p className="text-xs text-text-secondary truncate">{email.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block col-span-3 text-sm text-text-secondary truncate">
                  {email.sender}
                </div>
                
                <div className="md:col-span-2 flex items-center justify-between md:justify-center mt-2 md:mt-0">
                  <span className="text-xs font-medium text-text-secondary md:hidden">Risk Level</span>
                  <RiskBadge level={email.risk} />
                </div>
                
                <div className="hidden md:block col-span-2 text-sm text-text-secondary text-right">
                  {email.time}
                </div>
              </div>
            );
          })}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-text-secondary text-sm">
                  No emails found.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
