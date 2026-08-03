import { Search } from 'lucide-react';

export default function SearchBar({ placeholder = "Search...", className = "", ...props }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-text-secondary group-focus-within:text-primary transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg leading-5 bg-card text-text placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all sm:text-sm shadow-sm"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
