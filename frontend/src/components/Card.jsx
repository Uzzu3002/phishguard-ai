export default function Card({ children, className = '', hover = false, ...props }) {
  const hoverStyles = hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-white/20' : '';
  
  return (
    <div 
      className={`bg-card rounded-2xl border border-border shadow-soft p-6 ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
