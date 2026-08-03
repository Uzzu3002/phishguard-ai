import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, CheckCircle2, Link as LinkIcon, FileText, Server, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../components/Card';
import RiskBadge from '../components/RiskBadge';
import Button from '../components/Button';
import RiskMeter from '../components/RiskMeter';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { RISK_LEVELS } from '../constants/riskLevels';
import API_BASE_URL from '../constants/api';

export default function EmailDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showHeaders, setShowHeaders] = useState(false);
  const [modalState, setModalState] = useState(null);
  const [isQuarantined, setIsQuarantined] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToastMessage(`Copied to clipboard.`);
  };

  const handleBlockDomain = () => {
    const domain = emailData?.sender?.split('@')[1]?.replace('>', '');
    if (domain) {
      const blocked = JSON.parse(localStorage.getItem('blockedDomains') || '[]');
      if (!blocked.includes(domain)) {
        blocked.push(domain);
        localStorage.setItem('blockedDomains', JSON.stringify(blocked));
      }
      setToastMessage(`Domain ${domain} added to blocked list.`);
    }
    setModalState(null);
  };

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/gmail/emails/${id}`, {
          credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          setEmailData(result.data);
        } else {
          setError(result.message || 'Failed to fetch email details');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
        <Button variant="ghost" className="px-0 flex items-center gap-2 mb-2 hover:bg-transparent" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back to Inbox
        </Button>
        <div className="p-12 text-center text-text-secondary">Loading email details...</div>
      </div>
    );
  }

  if (error || !emailData) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
        <Button variant="ghost" className="px-0 flex items-center gap-2 mb-2 hover:bg-transparent" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back to Inbox
        </Button>
        <div className="p-12 text-center text-danger">{error || 'Email not found'}</div>
      </div>
    );
  }

  const { analysis } = emailData;
  const riskLevel = analysis?.verdict === 'HIGH_RISK' ? RISK_LEVELS.HIGH : analysis?.verdict === 'REVIEW' ? RISK_LEVELS.MEDIUM : RISK_LEVELS.LOW;
  
  // Parse auth results (SPF/DKIM/DMARC)
  const authRaw = emailData.authenticationResults || analysis?.authenticationResults || '';
  const spfRaw = authRaw.match(/spf=(\w+)/i)?.[1]?.toUpperCase() || 'NOT AVAILABLE';
  const dkimRaw = authRaw.match(/dkim=(\w+)/i)?.[1]?.toUpperCase() || 'NOT AVAILABLE';
  const dmarcRaw = authRaw.match(/dmarc=(\w+)/i)?.[1]?.toUpperCase() || 'NOT AVAILABLE';

  const getAuthIcon = (status) => {
    if (status === 'PASS') return '✓ PASS';
    if (status === 'FAIL' || status === 'SOFTFAIL') return '✗ FAIL';
    return '? NOT AVAILABLE';
  };

  // Extract IOCs from payload safely
  let iocUrls = [];
  let iocDomains = [];
  let iocEmails = [];
  try {
    const rawStr = JSON.stringify(emailData.payload || {}) + " " + (emailData.snippet || "");
    iocUrls = [...new Set(rawStr.match(/(https?:\/\/[a-zA-Z0-9.\-_~:/?#[\]@!$&'()*+,;=%]+)/g) || [])]
      .filter(u => !u.includes('schemas.google.com') && !u.includes('w3.org') && !u.includes('gstatic.com'));
    iocDomains = [...new Set(iocUrls.map(u => {
      try { return new URL(u).hostname; } catch(e) { return null; }
    }).filter(Boolean))];
    iocEmails = [...new Set(rawStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])];
  } catch (e) {
    // Ignore regex limits
  }

  const hasIocs = iocUrls.length > 0 || iocDomains.length > 0 || iocEmails.length > 0;

  const rawHeaders = Array.isArray(emailData.payload?.headers) ? emailData.payload.headers : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out] relative">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast type="success" message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
      )}

      <Button variant="ghost" className="px-0 flex items-center gap-2 mb-2 hover:bg-transparent" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back to Inbox
      </Button>
      
      {/* Email Overview Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-border">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-text truncate">{emailData.subject || 'Not Available'}</h1>
            <button onClick={() => handleCopy(emailData.subject, 'Subject')} className="text-text-secondary hover:text-primary transition-colors shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md border border-white/10">
              <span className="text-text font-medium truncate max-w-[200px]">{emailData.sender || 'Not Available'}</span>
              <button onClick={() => handleCopy(emailData.sender, 'Sender')} className="text-text-secondary hover:text-primary transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-text-secondary truncate max-w-[200px]">to {emailData.recipient || 'You'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isQuarantined ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border text-purple-400 bg-purple-400/10 border-purple-400/30 shadow-[0_0_10px_rgba(192,132,252,0.15)] backdrop-blur-sm transition-all">
              🔒 Quarantined
            </span>
          ) : (
            <RiskBadge level={riskLevel} />
          )}
          <span className="text-xs text-text-secondary">{emailData.date ? new Date(emailData.date).toLocaleString() : 'Not Available'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Analysis & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Risk Summary Card */}
          <Card className={`border-${riskLevel === RISK_LEVELS.HIGH ? 'danger' : riskLevel === RISK_LEVELS.MEDIUM ? 'warning' : 'success'}/20 bg-gradient-to-br from-card to-${riskLevel === RISK_LEVELS.HIGH ? 'danger' : riskLevel === RISK_LEVELS.MEDIUM ? 'warning' : 'success'}/[0.02]`}>
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className={`w-5 h-5 text-${riskLevel === RISK_LEVELS.HIGH ? 'danger' : riskLevel === RISK_LEVELS.MEDIUM ? 'warning' : 'success'}`} />
              <h2 className="text-lg font-bold text-text">Risk Summary</h2>
            </div>
            
            <div className="mb-8 space-y-4">
              <p className="text-text leading-relaxed text-sm font-medium">
                {analysis?.explainer?.summary || 'Summary not available.'}
              </p>
              <p className="text-text-secondary leading-relaxed text-sm">
                {analysis?.explainer?.userExplanation}
              </p>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <span className="text-xs uppercase tracking-wider text-text-secondary font-bold block mb-1">Technical Context</span>
                <p className="text-text-secondary text-sm font-mono text-xs">{analysis?.explainer?.technicalReason}</p>
              </div>
            </div>

            <div className={`p-4 bg-${riskLevel === RISK_LEVELS.HIGH ? 'danger' : riskLevel === RISK_LEVELS.MEDIUM ? 'warning' : 'success'}/10 border border-${riskLevel === RISK_LEVELS.HIGH ? 'danger' : riskLevel === RISK_LEVELS.MEDIUM ? 'warning' : 'success'}/20 rounded-xl`}>
              <h3 className={`text-sm font-bold text-${riskLevel === RISK_LEVELS.HIGH ? 'danger' : riskLevel === RISK_LEVELS.MEDIUM ? 'warning' : 'success'} mb-3 uppercase tracking-wider`}>Recommendations</h3>
              <ul className="space-y-2 list-disc list-inside text-sm text-text marker:text-text-secondary">
                {Array.isArray(analysis?.explainer?.recommendations) && analysis.explainer.recommendations.length > 0 ? (
                  analysis.explainer.recommendations.map((rec, i) => <li key={i} className="pl-1">{rec}</li>)
                ) : (
                  <li className="pl-1">Not Available</li>
                )}
              </ul>
            </div>
          </Card>

          {/* Email Metadata */}
          <Card>
            <h2 className="text-lg font-bold text-text mb-4">Email Metadata</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-background/50 border border-border rounded-lg">
                <span className="block text-xs text-text-secondary mb-1 uppercase tracking-wider font-semibold">Message ID</span>
                <span className="text-text font-mono truncate block">{emailData.id || emailData.messageId || 'Unknown'}</span>
              </div>
              <div className="p-3 bg-background/50 border border-border rounded-lg">
                <span className="block text-xs text-text-secondary mb-1 uppercase tracking-wider font-semibold">Thread ID</span>
                <span className="text-text font-mono truncate block">{emailData.threadId || 'Unknown'}</span>
              </div>
              <div className="p-3 bg-background/50 border border-border rounded-lg">
                <span className="block text-xs text-text-secondary mb-1 uppercase tracking-wider font-semibold">Date Received</span>
                <span className="text-text truncate block">{emailData.date ? new Date(emailData.date).toLocaleString() : 'Unknown'}</span>
              </div>
              <div className="p-3 bg-background/50 border border-border rounded-lg">
                <span className="block text-xs text-text-secondary mb-1 uppercase tracking-wider font-semibold">Recipient</span>
                <span className="text-text truncate block">{emailData.recipient || 'Unknown'}</span>
              </div>
            </div>
          </Card>

          {/* Email Snippet / Preview Card */}
          <Card>
            <h2 className="text-lg font-bold text-text mb-6">Email Preview</h2>
            <div className="p-4 bg-background/50 border border-border rounded-xl whitespace-pre-wrap text-sm text-text-secondary leading-relaxed font-mono">
              {emailData.snippet || 'Not Available'}
            </div>
          </Card>

          {/* Technical Details Cards */}
          <h2 className="text-xl font-bold text-text pt-4">Technical Details</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-text">Authentication</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-text-secondary">SPF</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${spfRaw === 'PASS' ? 'bg-success/10 text-success border-success/20' : spfRaw === 'FAIL' || spfRaw === 'SOFTFAIL' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-white/5 text-text-secondary border-white/10'}`}>{getAuthIcon(spfRaw)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-text-secondary">DKIM</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${dkimRaw === 'PASS' ? 'bg-success/10 text-success border-success/20' : dkimRaw === 'FAIL' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-white/5 text-text-secondary border-white/10'}`}>{getAuthIcon(dkimRaw)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">DMARC</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${dmarcRaw === 'PASS' ? 'bg-success/10 text-success border-success/20' : dmarcRaw === 'FAIL' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-white/5 text-text-secondary border-white/10'}`}>{getAuthIcon(dmarcRaw)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-text">Indicators of Compromise (IOC)</h3>
              </div>
              <div className="space-y-4">
                {!hasIocs && (
                  <p className="text-sm text-text-secondary italic">No indicators found.</p>
                )}
                
                {iocUrls.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">URLs Detected</h4>
                    <div className="space-y-1">
                      {iocUrls.slice(0, 5).map((url, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-background/50 rounded border border-border group">
                          <span className="text-sm text-blue-400 font-mono truncate mr-3">{url}</span>
                          <button onClick={() => handleCopy(url, 'URL')} className="text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {iocUrls.length > 5 && <p className="text-xs text-text-secondary pt-1">+{iocUrls.length - 5} more URLs...</p>}
                    </div>
                  </div>
                )}
                
                {iocDomains.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">Domains</h4>
                    <div className="flex flex-wrap gap-2">
                      {iocDomains.map((domain, i) => (
                        <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-text">{domain}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Raw Headers Accordion */}
          <Card className="overflow-hidden p-0">
            <button 
              className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left"
              onClick={() => setShowHeaders(!showHeaders)}
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-text-secondary" />
                <h2 className="text-base font-bold text-text">View Raw Headers</h2>
              </div>
              {showHeaders ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
            </button>
            {showHeaders && (
              <div className="p-5 border-t border-border bg-background/30">
                <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-xs text-text-secondary bg-black/40 p-4 rounded-xl border border-white/5">
                  {rawHeaders.length > 0 ? rawHeaders.map((h, i) => (
                    <div key={i} className="flex gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <span className="text-blue-300/70 font-semibold w-1/4 shrink-0 break-words">{h.name}:</span>
                      <span className="break-all">{h.value}</span>
                    </div>
                  )) : (
                    <span>No raw headers available.</span>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Risk Meter */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 text-center">
             <h3 className="text-lg font-bold text-text mb-6">Risk Score</h3>
             <RiskMeter score={analysis?.riskScore || 0} />
             <p className="text-sm text-text-secondary mt-6 font-medium">Classified as {analysis?.verdict || 'Not Available'}</p>
             <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs text-text-secondary uppercase tracking-wider font-bold mb-3">AI Copilot Actions</p>
                <Button className="w-full mb-2" disabled={riskLevel !== RISK_LEVELS.HIGH || isQuarantined} onClick={() => setModalState('quarantine')}>Quarantine Email</Button>
                <Button variant="danger" className="w-full mb-2" disabled={riskLevel === RISK_LEVELS.LOW} onClick={() => setModalState('block')}>Block Sender Domain</Button>
                <Button variant="secondary" className="w-full" onClick={() => setModalState('falsePositive')}>Mark as False Positive</Button>
             </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={modalState === 'quarantine'} onClose={() => setModalState(null)} title="Quarantine Email">
        <p className="text-text-secondary mb-6">Are you sure you want to quarantine this email? It will be isolated from the inbox.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setModalState(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            setIsQuarantined(true);
            setToastMessage("Email quarantined successfully.");
            setModalState(null);
          }}>Quarantine</Button>
        </div>
      </Modal>

      <Modal isOpen={modalState === 'block'} onClose={() => setModalState(null)} title="Block Sender Domain">
        <p className="text-text-secondary mb-6">Are you sure you want to block the domain <strong>{emailData?.sender?.split('@')[1]?.replace('>', '') || 'this sender'}</strong>?</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setModalState(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleBlockDomain}>Block Domain</Button>
        </div>
      </Modal>

      <Modal isOpen={modalState === 'falsePositive'} onClose={() => setModalState(null)} title="Mark as False Positive">
        <p className="text-text-secondary mb-6">Are you sure you want to mark this email as a false positive? This will help improve our AI model.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setModalState(null)}>Cancel</Button>
          <Button onClick={() => {
            setToastMessage("Email marked as false positive.");
            setModalState(null);
          }}>Confirm</Button>
        </div>
      </Modal>

    </div>
  );
}
