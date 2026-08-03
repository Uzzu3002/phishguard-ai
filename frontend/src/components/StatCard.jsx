import Card from './Card';

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'primary' }) {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  };

  return (
    <Card hover className="flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-text">{value}</p>
        {trend && (
          <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-danger' : 'text-success'}`}>
            {trend}
          </span>
        )}
      </div>
      {trendLabel && <p className="text-xs text-text-secondary mt-1">{trendLabel}</p>}
    </Card>
  );
}
