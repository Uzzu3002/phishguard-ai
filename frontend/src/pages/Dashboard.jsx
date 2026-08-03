import { useState } from 'react';
import { Mail, ShieldAlert, ShieldCheck, Activity, Search, MessageSquare } from 'lucide-react';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Timeline from '../components/Timeline';
import Button from '../components/Button';
import { useScan } from '../context/ScanContext';

export default function Dashboard() {
  const { scanData, loading, error, lastScanTime, refreshScan, safeCount, reviewCount, highRiskCount, securityScore } = useScan();

  const scannedCount = scanData ? scanData.scanned.toString() : '--';
  const displaySafeCount = scanData ? safeCount.toString() : '--';
  const displayReviewCount = scanData ? reviewCount.toString() : '--';
  const displayHighRiskCount = scanData ? highRiskCount.toString() : '--';

  let securityStatusText = 'Checking...';
  let securityStatusColor = 'text-text-secondary';
  let bgStatusColor = 'bg-border';
  
  if (scanData && Array.isArray(scanData.results)) {
    if (highRiskCount > 0) {
      securityStatusText = 'Threats Detected';
      securityStatusColor = 'text-danger';
      bgStatusColor = 'bg-danger';
    } else if (reviewCount > 0) {
      securityStatusText = 'Needs Review';
      securityStatusColor = 'text-warning';
      bgStatusColor = 'bg-warning';
    } else {
      securityStatusText = 'Healthy';
      securityStatusColor = 'text-success';
      bgStatusColor = 'bg-success';
    }
  }

  const formattedScanTime = lastScanTime 
    ? lastScanTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '--:--';

  let aiMessage = "Scanning inbox...";
  let aiMessageHighlight = "";
  let aiMessageHighlightColor = "text-text-secondary";
  let securityScoreDisplay = "--/100";
  let recommendedAction = "Scanning...";
  let aiStatusText = "Scanning...";
  let aiStatusColor = "text-text-secondary";
  let aiStatusBg = "bg-border";

  if (scanData && Array.isArray(scanData.results)) {
    const threatsCount = highRiskCount;
    const reviewsCount = reviewCount;
    const totalCount = scanData.results.length;

    // Security Score
    securityScoreDisplay = `${securityScore}/100`;

    // AI Status
    aiStatusText = "Ready";
    aiStatusColor = "text-success";
    aiStatusBg = "bg-success";

    // Main Message & Recommendation
    if (threatsCount > 0) {
      aiMessage = `Warning. ${threatsCount} high-risk emails were detected.`;
      aiMessageHighlight = "Immediate investigation is recommended.";
      aiMessageHighlightColor = "text-danger";
      recommendedAction = "Investigate high-risk emails immediately";
    } else if (reviewsCount > 0) {
      aiMessage = `Scan complete. ${reviewsCount} emails require review.`;
      aiMessageHighlight = "No confirmed phishing emails detected.";
      aiMessageHighlightColor = "text-warning";
      recommendedAction = "Review suspicious emails";
    } else {
      aiMessage = `Scan complete. ${totalCount} emails analyzed.`;
      aiMessageHighlight = "No high-risk emails detected. Your inbox appears healthy.";
      aiMessageHighlightColor = "text-success";
      recommendedAction = "No action required";
    }
  }

  let derivedTimelineEvents = [];
  if (scanData && Array.isArray(scanData.results) && scanData.results.length > 0) {
    const sortedResults = [...scanData.results].sort((a, b) => {
      if (b.riskScore !== a.riskScore) return (b.riskScore || 0) - (a.riskScore || 0);
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    derivedTimelineEvents = sortedResults.slice(0, 10).map((email, idx) => {
      let type = 'safe';
      if (email.verdict === 'HIGH_RISK') type = 'phishing';
      if (email.verdict === 'REVIEW') type = 'suspicious';
      
      const dateStr = email.date ? new Date(email.date).toLocaleDateString() : 'Unknown date';
      
      return {
        id: email.messageId || idx,
        type,
        title: email.subject || '(No Subject)',
        description: `Risk Score: ${email.riskScore || 0} • ${email.sender || 'Unknown Sender'}`,
        time: dateStr
      };
    });
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            🛡 Inbox Security Overview
          </h1>
          <div className="mt-2 text-sm text-text-secondary flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="text-text font-medium">Welcome back.</span>
            <span className="hidden sm:inline text-border">•</span>
            <span>Last Scan: {scanData ? formattedScanTime : 'Loading...'}</span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1.5">
              Security Status: <span className={`w-2 h-2 rounded-full ${bgStatusColor} animate-pulse ml-1`}></span> <span className={securityStatusColor}>{securityStatusText}</span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Emails Scanned" value={scannedCount} icon={Mail} color="primary" />
        <StatCard title="Safe" value={displaySafeCount} icon={ShieldCheck} color="success" />
        <StatCard title="Suspicious" value={displayReviewCount} icon={Activity} color="warning" />
        <StatCard title="Phishing Blocked" value={displayHighRiskCount} icon={ShieldAlert} color="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Expanded AI Copilot Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/[0.02]">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-bold text-text">AI Security Copilot</h2>
            </div>
            
            <div className="mb-8">
              <p className="text-lg text-text mb-2">Welcome back.</p>
              <p className="text-text-secondary">{aiMessage} <span className={`${aiMessageHighlightColor} font-medium`}>{aiMessageHighlight}</span></p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-3 bg-background/50 rounded-xl border border-border">
                <p className="text-xs text-text-secondary mb-1">Security Score</p>
                <p className="font-bold text-text">{securityScoreDisplay}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-border">
                <p className="text-xs text-text-secondary mb-1">Last Scan Time</p>
                <p className="font-bold text-text">{scanData ? formattedScanTime : '--:--'}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-border">
                <p className="text-xs text-text-secondary mb-1">Recommended Action</p>
                <p className="font-bold text-text">{recommendedAction}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-xl border border-border flex flex-col justify-center">
                <p className="text-xs text-text-secondary mb-1">AI Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${aiStatusBg} animate-pulse`}></span>
                  <span className={`font-bold ${aiStatusColor} text-sm`}>{aiStatusText}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
              <Button onClick={refreshScan} disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> {loading ? 'Scanning...' : 'Scan Recent Emails'}
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Ask AI
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <h2 className="text-lg font-semibold text-text mb-6">Latest Activity</h2>
            {loading ? (
              <div className="text-sm text-text-secondary text-center py-8 animate-pulse">Loading activity...</div>
            ) : !scanData || !scanData.results || scanData.results.length === 0 ? (
              <div className="text-sm text-text-secondary text-center py-8">No scan data available.</div>
            ) : (
              <Timeline events={derivedTimelineEvents} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
