import { ShieldAlert, ShieldCheck, MailWarning } from 'lucide-react';

export default function Timeline({ events }) {
  return (
    <div className="space-y-4">
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const Icon = event.type === 'phishing' ? ShieldAlert : event.type === 'suspicious' ? MailWarning : ShieldCheck;
        const color = event.type === 'phishing' ? 'text-danger bg-danger/10 border-danger/20' : 
                      event.type === 'suspicious' ? 'text-warning bg-warning/10 border-warning/20' : 
                      'text-success bg-success/10 border-success/20';

        return (
          <div key={event.id} className="flex gap-4 relative">
            {!isLast && <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-border"></div>}
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium text-text">{event.title}</p>
              <p className="text-xs text-text-secondary mt-0.5">{event.time} • {event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
