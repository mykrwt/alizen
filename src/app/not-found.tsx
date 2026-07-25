import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-alizen-bg text-alizen-text p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl font-bold tracking-tight text-alizen-muted/20 mb-3">
          404
        </div>
        <h1 className="text-lg font-semibold tracking-tight mb-2">Page not found</h1>
        <p className="text-[13px] text-alizen-muted mb-6 leading-relaxed">
          That page doesn&apos;t exist — or was never generated.
        </p>
        <Link href="/" className="btn-primary text-xs h-8 px-4">
          Back to Alizen
        </Link>
      </div>
    </div>
  );
}
