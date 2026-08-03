export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background active:scale-[0.98]";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    primary: "bg-primary hover:bg-blue-600 text-white shadow-soft focus:ring-primary border border-transparent",
    secondary: "bg-card hover:bg-gray-800 text-text border border-border focus:ring-gray-700 shadow-sm",
    danger: "bg-danger hover:bg-red-600 text-white shadow-soft focus:ring-danger border border-transparent",
    success: "bg-success hover:bg-green-600 text-white shadow-soft focus:ring-success border border-transparent",
    ghost: "bg-transparent hover:bg-white/5 text-text-secondary hover:text-text border border-transparent"
  };
  
  return (
    <button className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
