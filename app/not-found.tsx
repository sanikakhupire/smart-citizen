// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-slate-200">404</h1>
        <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Page Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-block"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}