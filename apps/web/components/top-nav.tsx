'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearToken } from '@/lib/api';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/compose', label: 'Compose' },
  { href: '/posts', label: 'Posts' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/debug', label: 'Debug' },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const visibleLinks = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? links.filter((link) => link.href !== '/debug') : links;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className='border-b border-border bg-white'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3'>
        <Link href='/dashboard' className='text-sm font-bold tracking-wide text-slate-950' aria-label='SMCC dashboard'>
          SMCC
        </Link>
        <nav aria-label='Primary navigation' className='hidden items-center gap-4 md:flex'>
          {visibleLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`text-sm ${pathname === l.href ? 'font-bold text-primary' : 'text-gray-600'}`}>
              {l.label}
            </Link>
          ))}
          <Button
            variant='outline'
            onClick={() => {
              clearToken();
              router.push('/login');
            }}
          >
            Log out
          </Button>
        </nav>
        <Button
          className='md:hidden'
          variant='outline'
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls='mobile-navigation'
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden='true' className='h-5 w-5' /> : <Menu aria-hidden='true' className='h-5 w-5' />}
        </Button>
      </div>
      {open && (
        <nav id='mobile-navigation' aria-label='Mobile navigation' className='border-t border-border px-4 py-3 md:hidden'>
          <div className='mx-auto grid max-w-6xl gap-1'>
            {visibleLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-3 text-sm ${pathname === l.href ? 'bg-sky-50 font-bold text-primary' : 'text-gray-700'}`}
              >
                {l.label}
              </Link>
            ))}
            <Button
              className='mt-2 justify-start'
              variant='outline'
              onClick={() => {
                clearToken();
                router.push('/login');
              }}
            >
              Log out
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
