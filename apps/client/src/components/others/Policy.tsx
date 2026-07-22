import Link from 'next/link';

export function Policy() {
  return (
    <div className="mt-2 text-xs text-center text-color-secondary h-4">
      By continuing you agree to accept our{' '}
      <Link href="/privacy-policy" className="text-blue-primary">
        Privacy Policy
      </Link>{' '}
      and{' '}
      <Link href="/terms-of-service" className="text-blue-primary">
        Terms of Service
      </Link>
    </div>
  );
}
