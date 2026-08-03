import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ type = 'info', message, onClose }) {
  const types = {
    success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    error: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
    info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' }
  };

  const current = types[type];
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-[slideUp_0.3s_ease-out] ${current.bg}`}>
      <Icon className={`w-5 h-5 ${current.color}`} />
      <p className="text-sm font-medium text-text">{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-auto text-text-secondary hover:text-text pl-2">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
