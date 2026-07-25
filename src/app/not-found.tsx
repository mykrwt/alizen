import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-alizen-bg text-alizen-text p-6 hero-gradient">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black bg-gradient-to-br from-alizen-accent to-alizen-accent2 bg-clip-text text-transparent mb-2">
          404
        </div>
        <h1 className="text-xl font-bold mb-2">Page not found</h1>
        <p className="text-sm text-alizen-muted mb-6">
          That page does not exist — or it was never generated. Head back to the builder.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Back to Alizen
        </Link>
      </div>
    </div>
  );
}
