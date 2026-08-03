import { RISK_LEVELS } from '../constants/riskLevels';

export default function RiskBadge({ level }) {
  const config = {
    [RISK_LEVELS.LOW]: { 
      color: 'text-success bg-success/10 border-success/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]', 
      label: '🟢 Safe' 
    },
    [RISK_LEVELS.MEDIUM]: { 
      color: 'text-warning bg-warning/10 border-warning/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]', 
      label: '🟡 Review' 
    },
    [RISK_LEVELS.HIGH]: { 
      color: 'text-danger bg-danger/10 border-danger/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]', 
      label: '🔴 High Risk' 
    }
  };
  
  const current = config[level?.toLowerCase()] || config[RISK_LEVELS.LOW];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${current.color} backdrop-blur-sm transition-all`}>
      {current.label}
    </span>
  );
}
