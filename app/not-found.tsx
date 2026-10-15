import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Page Not Found
        </h2>
        <p className="text-sm text-gray-600">
          Sorry, the page you are looking for doesn’t exist or has been moved.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
