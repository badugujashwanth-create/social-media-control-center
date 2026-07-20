import { ShieldCheck } from 'lucide-react';

export function DemoNotice() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  return (
    <div className='border-b border-sky-200 bg-sky-50 text-sky-950' role='status'>
      <div className='mx-auto flex max-w-6xl items-start gap-2 px-4 py-2 text-sm'>
        <ShieldCheck aria-hidden='true' className='mt-0.5 h-4 w-4 shrink-0' />
        <p>
          <span className='font-semibold'>Safe demo workspace.</span> All accounts, publishing results, and analytics are synthetic; no provider API is contacted.
        </p>
      </div>
    </div>
  );
}
