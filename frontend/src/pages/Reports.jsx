// TEMPORARILY DISABLED - Pending stabilization (Version 3.3)
import { Download, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { useScan } from '../context/ScanContext';

export default function Reports() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="text-center p-8 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-text mb-4">Reports Unavailable</h2>
        <p className="text-text-secondary">Reports are temporarily unavailable.</p>
      </Card>
    </div>
  );

  const { scanData, loading, error, safeCount, reviewCount, highRiskCount, securityScore } = useScan();
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleExportPDF = () => {
    if (!scanData || !Array.isArray(scanData.results) || scanData.results.length === 0) {
      setToastMessage("No report available to export.");
      return;
    }

    const doc = new jsPDF();
    
    // 1. Cover Title
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text("PhishGuard AI", 14, 22);
    
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text("Security Scan Report", 14, 30);

    // 2. Report Information
    doc.setFontSize(11);
    doc.setTextColor(60);
    const now = new Date();
    doc.text(`Generated Date: ${now.toLocaleDateString()}`, 14, 45);
    doc.text(`Generated Time: ${now.toLocaleTimeString()}`, 14, 52);
    
    const scannedTotal = scanData.scanned || scanData.results.length;
    doc.text(`Total Emails Scanned: ${scannedTotal}`, 14, 59);
    
    // 4. Security Score
    doc.text(`Security Score: ${securityScore}/100`, 14, 66);

    // 5. Threat Summary
    let summaryStr = `This scan analyzed ${scannedTotal} emails.\n`;
    if (highRiskCount > 0) summaryStr += `${highRiskCount} high-risk phishing email(s) detected.\n`;
    if (reviewCount > 0) summaryStr += `${reviewCount} emails require review.\n`;
    if (highRiskCount === 0 && reviewCount === 0) summaryStr += `No threats detected. Inbox is healthy.\n`;

    doc.setFontSize(12);
    doc.setTextColor(0);
    const splitSummary = doc.splitTextToSize(summaryStr, 180);
    doc.text(splitSummary, 14, 80);

    // 8. Recommendations
    let recs = [];
    if (highRiskCount > 0) {
      recs = [
        "- Investigate high-risk emails immediately.",
        "- Avoid clicking suspicious links.",
        "- Report confirmed phishing emails."
      ];
    } else if (reviewCount > 0) {
      recs = [
        "- Review suspicious emails carefully."
      ];
    } else {
      recs = [
        "- No immediate action required."
      ];
    }
    
    doc.setFontSize(14);
    doc.text("Recommendations", 14, 105);
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(recs.join('\n'), 14, 112);

    // 6. Threat Volume Statistics (Table 1)
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Threat Volume Statistics", 14, 135);

    doc.autoTable({
      startY: 140,
      head: [['Verdict', 'Count']],
      body: [
        ['SAFE', safeCount],
        ['REVIEW', reviewCount],
        ['HIGH_RISK', highRiskCount]
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // 7. Top Threats (Table 2)
    doc.text("Top Threats", 14, doc.lastAutoTable.finalY + 15);

    const sortedThreats = [...scanData.results]
      .filter(e => e.verdict !== 'SAFE')
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
      .slice(0, 10);

    const threatsBody = sortedThreats.map(e => {
      const parsedDate = e.date ? new Date(e.date) : null;
      const dateStr = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : 'Unknown';
      return [
        dateStr,
        e.sender || 'Unknown',
        e.subject || '(No Subject)',
        e.verdict || 'Unknown',
        (e.riskScore || 0).toString(),
        Array.isArray(e.recommendations) ? e.recommendations.join('; ') : (e.recommendations || '')
      ];
    });

    if (threatsBody.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Date', 'Sender', 'Subject', 'Verdict', 'Risk Score', 'Recommendation']],
        body: threatsBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 
          2: { cellWidth: 40 }, // Subject
          5: { cellWidth: 50 }  // Recommendation
        },
        headStyles: { fillColor: [239, 68, 68] }
      });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("No threats detected in this scan.", 14, doc.lastAutoTable.finalY + 20);
    }

    // Add Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Generated by PhishGuard AI - Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    const filename = `phishguard-report-${now.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const handleExportCSV = () => {
    if (!scanData || !Array.isArray(scanData.results) || scanData.results.length === 0) {
      alert("No report available to export.");
      return;
    }

    const headers = [
      "Date",
      "Sender",
      "Subject",
      "Verdict",
      "Risk Score",
      "Recommendation",
      "Authentication Status"
    ];

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`; // Enclose everything in quotes for safety
    };

    const rows = scanData.results.map(email => {
      const parsedDate = email.date ? new Date(email.date) : null;
      const dateStr = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : 'Unknown';
      const sender = email.sender || '';
      const subject = email.subject || '';
      const verdict = email.verdict || '';
      const riskScore = email.riskScore || 0;
      const recommendation = Array.isArray(email.recommendations) 
        ? email.recommendations.join('; ') 
        : (email.recommendations || '');

      let authStatus = 'NOT AVAILABLE';
      if (email.authenticationResults) {
        const raw = email.authenticationResults.toLowerCase();
        const spf = raw.includes('spf=pass') ? 'SPF PASS' : 'SPF FAIL';
        const dkim = raw.includes('dkim=pass') ? 'DKIM PASS' : 'DKIM FAIL';
        const dmarc = raw.includes('dmarc=pass') ? 'DMARC PASS' : 'DMARC FAIL';
        authStatus = `${spf}, ${dkim}, ${dmarc}`;
      }

      return [
        escapeCSV(dateStr),
        escapeCSV(sender),
        escapeCSV(subject),
        escapeCSV(verdict),
        escapeCSV(riskScore),
        escapeCSV(recommendation),
        escapeCSV(authStatus)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    const filename = `phishguard-report-${today}.csv`;
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  let chartData = [];
  if (scanData && Array.isArray(scanData.results)) {
      const grouped = scanData.results.reduce((acc, email) => {
        const parsedDate = email.date ? new Date(email.date) : null;
        const dateKey = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : 'Unknown';
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, SAFE: 0, REVIEW: 0, HIGH_RISK: 0 };
        }
        if (email.verdict === 'SAFE') acc[dateKey].SAFE += 1;
        else if (email.verdict === 'REVIEW') acc[dateKey].REVIEW += 1;
        else if (email.verdict === 'HIGH_RISK') acc[dateKey].HIGH_RISK += 1;
        return acc;
      }, {});

      chartData = Object.values(grouped).sort((a, b) => {
        if (a.date === 'Unknown') return -1;
        if (b.date === 'Unknown') return 1;
        const parsedA = new Date(a.date);
        const parsedB = new Date(b.date);
        const timeA = !isNaN(parsedA.getTime()) ? parsedA.getTime() : 0;
        const timeB = !isNaN(parsedB.getTime()) ? parsedB.getTime() : 0;
        return timeA - timeB;
      });
    }

  let pieData = [];
  const PIE_COLORS = ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#8B5CF6', '#64748B'];
  
  if (scanData && Array.isArray(scanData.results)) {
    const categories = {
      'Authentication Failures': 0,
      'Credential Harvesting': 0,
      'Urgency / Social Engineering': 0,
      'Financial Fraud': 0,
      'Suspicious Sender': 0,
      'Other': 0
    };

    scanData.results.forEach(email => {
      // Only categorize threats or warnings
      if (email.verdict === 'SAFE') return;
      
      const explanations = Array.isArray(email.explanation) ? email.explanation : [email.explanation || ''];
      
      explanations.forEach(exp => {
        const text = exp.toLowerCase();
        if (text.match(/spf|dkim|dmarc|authentication|fail/)) categories['Authentication Failures']++;
        else if (text.match(/credential|login|password|verify|account/)) categories['Credential Harvesting']++;
        else if (text.match(/urgent|immediate|suspension|action required/)) categories['Urgency / Social Engineering']++;
        else if (text.match(/financial|invoice|payment|money|wire|billing/)) categories['Financial Fraud']++;
        else if (text.match(/domain|sender|reputation|spoof/)) categories['Suspicious Sender']++;
        else categories['Other']++;
      });
    });

    pieData = Object.keys(categories)
      .filter(key => categories[key] > 0)
      .map(key => ({ name: key, value: categories[key] }))
      .sort((a, b) => b.value - a.value);
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] max-w-5xl mx-auto relative">
      {/* Toast Notification Layer */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast type="error" message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Analytics & Reports</h1>
          <p className="text-sm text-text-secondary mt-1">Weekly summary of threat trends and system performance.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="secondary" className="flex items-center gap-2 flex-1 sm:flex-none justify-center" onClick={handleExportPDF}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button variant="secondary" className="flex items-center gap-2 flex-1 sm:flex-none justify-center" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="secondary" className="flex items-center gap-2 flex-1 sm:flex-none justify-center" disabled>
            Share Report
          </Button>
          <Button className="flex items-center gap-2 flex-1 sm:flex-none justify-center" disabled>
            Schedule Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text">Threat Volume Trends</h2>
            <BarChart2 className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="h-64 border border-border rounded-xl flex items-center justify-center bg-background/50 overflow-hidden">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <p className="text-sm text-danger font-medium">Failed to load analytics data.</p>
            ) : chartData.length === 0 ? (
              <p className="text-sm text-text-secondary">No data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}
                    itemStyle={{ color: '#E0E0E0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="SAFE" stackId="a" fill="#10B981" />
                  <Bar dataKey="REVIEW" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="HIGH_RISK" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text">Attack Vector Breakdown</h2>
            <PieChartIcon className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="h-64 border border-border rounded-xl flex items-center justify-center bg-background/50 overflow-hidden">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <p className="text-sm text-danger font-medium">Failed to load analytics data.</p>
            ) : pieData.length === 0 ? (
              <p className="text-sm text-text-secondary">No threat data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}
                    itemStyle={{ color: '#E0E0E0' }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '12px', right: 0 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
