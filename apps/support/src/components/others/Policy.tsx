import Link from 'next/link';

export function Policy() {
  return (
    <div className="mt-2 text-xs text-center text-muted-foreground h-4">
      By continuing you agree to accept our{' '}
      <Link href="/privacy-policy" className="text-info">
        Privacy Policy
      </Link>{' '}
      and{' '}
      <Link href="/terms-of-service" className="text-info">
        Terms of Service
      </Link>
    </div>
  );
}
