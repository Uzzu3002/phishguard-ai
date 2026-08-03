import { useState, useRef, useEffect } from 'react';
import { Shield, Sparkles, X, MessageSquare, ShieldAlert, FileText, LayoutDashboard, Send } from 'lucide-react';
import Button from './Button';
import { useScan } from '../context/ScanContext';
import API_BASE_URL from '../constants/api';

export default function FloatingAICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { scanData, safeCount, reviewCount, highRiskCount, securityScore } = useScan();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const generateResponse = async (query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          scanContext: { scanData, safeCount, reviewCount, highRiskCount, securityScore }
        })
      });
      const data = await response.json();
      return data.reply || "I encountered an error analyzing that.";
    } catch (err) {
      return "I encountered a network error connecting to the AI provider.";
    }
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const replyText = await generateResponse(text);
    
    const aiResponse = { role: 'ai', content: replyText };
    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-[calc(100vw-3rem)] sm:w-80 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span className="font-bold text-text">AI Copilot</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 h-[400px] max-h-[60vh] overflow-y-auto flex flex-col">
              
              {messages.length === 1 && (
                <div className="grid gap-2 mt-4">
                  {[
                    { icon: ShieldAlert, label: 'Summarize today\'s scan.' },
                    { icon: FileText, label: 'What is my security score?' },
                    { icon: MessageSquare, label: 'What should I do next?' },
                    { icon: LayoutDashboard, label: 'Is my inbox safe?' }
                  ].map((action, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSend(action.label)}
                      disabled={!scanData}
                      className="flex items-center gap-3 w-full text-left p-3 rounded-xl border border-border bg-background hover:bg-white/5 transition-all text-sm text-text-secondary hover:text-text hover:border-primary/50 group disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <action.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4 flex-1">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-background border border-border text-text shadow-sm'}`}>
                      {msg.role === 'ai' && <div className="font-bold text-[11px] mb-1.5 text-primary flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Copilot</div>}
                      <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-xl bg-background border border-border text-text text-sm shadow-sm">
                      <div className="font-bold text-[11px] mb-1.5 text-primary flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Copilot</div>
                      <div className="flex items-center gap-1 text-text-secondary">
                        <span className="animate-[bounce_1s_infinite] delay-75 text-lg leading-none">.</span>
                        <span className="animate-[bounce_1s_infinite] delay-150 text-lg leading-none">.</span>
                        <span className="animate-[bounce_1s_infinite] delay-300 text-lg leading-none">.</span>
                        <span className="ml-2 text-xs font-medium">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="p-3 border-t border-border bg-background/50">
              <form 
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputMessage);
                }}
              >
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask anything..." 
                  className="w-full bg-card border border-border rounded-lg py-2.5 pl-3 pr-10 text-sm text-text focus:outline-none focus:border-primary transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-blue-400 disabled:opacity-50 disabled:hover:text-primary transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105 transition-all relative ${isOpen ? 'rotate-90' : ''}`}
          title="AI Copilot"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
          {!isOpen && <Sparkles className="w-3 h-3 absolute top-3 right-3 animate-pulse" />}
        </button>
      </div>
    </>
  );
}
