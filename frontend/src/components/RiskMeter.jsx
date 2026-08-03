export default function RiskMeter({ score }) {
  // Determine color based on score
  let color = 'bg-success';
  let textColor = 'text-success';
  if (score > 40) {
    color = 'bg-warning';
    textColor = 'text-warning';
  }
  if (score > 75) {
    color = 'bg-danger';
    textColor = 'text-danger';
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-text-secondary">Risk Score</span>
        <span className={`text-2xl font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="w-full bg-background border border-border rounded-full h-3 overflow-hidden shadow-inner">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${Math.max(5, score)}%` }}
        />
      </div>
    </div>
  );
}
