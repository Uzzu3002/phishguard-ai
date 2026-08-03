import { Shield, Lock, Zap, Eye, ArrowRight, Mail, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import RiskMeter from '../components/RiskMeter';
import API_BASE_URL from '../constants/api';

export default function Home() {
  const features = [
    { icon: Zap, title: "Real-time Analysis", desc: "Scans emails before you even open them." },
    { icon: Lock, title: "Privacy First", desc: "Your data never leaves your secure environment." },
    { icon: Eye, title: "Explainable AI", desc: "Understand exactly why an email was flagged." }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center mb-24">
        {/* Left Side: Copy & CTA */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            PhishGuard AI 2.0 is Live
          </div>
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-text mb-6 leading-tight">
            Stop Phishing Before <br className="hidden sm:block"/> It Reaches You.
          </h1>
          <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-xl">
            AI continuously monitors your Gmail, detects phishing attempts, explains every security decision, and helps keep your inbox safe before you interact with suspicious emails.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <a href={`${API_BASE_URL}/api/auth/login`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full flex items-center justify-center gap-2">
                <Mail className="w-5 h-5" /> Connect Gmail
              </Button>
            </a>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2">
                View Demo Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {/* Trust Section */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-medium text-text-secondary">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> Privacy First</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> No Password Storage</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> Google OAuth Secure Login</span>
          </div>
        </div>

        {/* Right Side: Floating Dashboard Mockup */}
        <div className="relative flex justify-center lg:justify-end animate-float">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/30 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
          
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 overflow-hidden">
             {/* Mock Header */}
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
               <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                 <Shield className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <p className="font-bold text-text">AI Security Scan</p>
                 <p className="text-xs text-success flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Analysis Complete</p>
               </div>
             </div>
             
             {/* Mock Email Item */}
             <div className="bg-background/80 border border-border rounded-xl p-4 mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-text text-sm mb-0.5">Urgent: Account Review</p>
                    <p className="text-xs text-text-secondary">security@paypaI-support.com</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                    🔴 High Risk
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded h-2 mb-2"></div>
                <div className="w-3/4 bg-white/5 rounded h-2"></div>
             </div>

             {/* Mock Risk Meter */}
             <RiskMeter score={94} />

             {/* Mock AI Box */}
             <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-primary">
               <p className="text-xs text-text-secondary leading-relaxed">
                 <strong className="text-text">AI Analysis:</strong> Domain mismatch detected. Sender is attempting credential harvesting. Recommended action is immediate quarantine.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-24">
        {features.map((f, i) => (
          <Card key={i} hover className="text-center md:text-left flex flex-col items-center md:items-start p-8">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-border flex items-center justify-center mb-6">
              <f.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">{f.title}</h3>
            <p className="text-text-secondary">{f.desc}</p>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-text mb-12">How it Works</h2>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Connect Gmail', desc: 'Securely link your inbox using OAuth. No passwords required.' },
            { step: '02', title: 'Background Scanning', desc: 'Every incoming email is immediately sent to the secure evaluation sandbox.' },
            { step: '03', title: 'AI Analysis', desc: 'Our LLM analyzes tone, links, domain reputation, and headers.' },
            { step: '04', title: 'Stay Protected', desc: 'Malicious emails are flagged with exact reasoning before you interact.' }
          ].map((item, idx) => (
            <Card key={idx} className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6">
              <div className="text-4xl font-black text-white/5">{item.step}</div>
              <div>
                <h4 className="text-lg font-bold text-text mb-1">{item.title}</h4>
                <p className="text-text-secondary">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
