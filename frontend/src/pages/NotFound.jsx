import Button from '../components/Button';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
      <h1 className="text-6xl font-bold text-gray-700">404</h1>
      <h2 className="text-2xl font-medium text-gray-300">Page Not Found</h2>
      <p className="text-gray-500">The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="mt-4 inline-block">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
