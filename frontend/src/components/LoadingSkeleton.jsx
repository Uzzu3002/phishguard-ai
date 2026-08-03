export default function LoadingSkeleton({ type = 'card' }) {
  if (type === 'text') {
    return (
      <div className="space-y-3 w-full animate-pulse">
        <div className="h-4 bg-white/5 rounded-md w-3/4"></div>
        <div className="h-4 bg-white/5 rounded-md w-1/2"></div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4 w-full animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-card border border-border rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 w-full animate-pulse shadow-soft">
      <div className="h-5 bg-white/5 rounded-md w-1/3 mb-4"></div>
      <div className="h-10 bg-white/5 rounded-md w-1/4 mb-4"></div>
      <div className="h-2 bg-white/5 rounded-full w-full"></div>
    </div>
  );
}
