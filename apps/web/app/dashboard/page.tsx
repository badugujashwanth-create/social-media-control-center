'use client';

import { useEffect, useState } from 'react';
import { ProtectedPage } from '@/components/protected-page';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Send } from 'lucide-react';

type DashboardAccount = {
  id: number;
  platform: string;
  display_name: string | null;
  token_health: string;
};

type DashboardData = {
  accounts: DashboardAccount[];
  recent_posts: unknown[];
};

const EMPTY_DASHBOARD: DashboardData = { accounts: [], recent_posts: [] };

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);

  useEffect(() => {
    apiFetch<DashboardData>('/dashboard', { auth: true }).then(setData).catch(() => setData(EMPTY_DASHBOARD));
  }, []);

  return (
    <ProtectedPage>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-sm font-medium text-primary'>Workspace overview</p>
          <h1 className='text-2xl font-semibold'>Unified Dashboard</h1>
          <p className='mt-1 text-sm text-gray-600'>Monitor account readiness and recent delivery activity from one place.</p>
        </div>
        <Link href='/compose' className='inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary'>
          <Send aria-hidden='true' className='h-4 w-4' /> Compose post
        </Link>
      </div>
      <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <p className='text-sm text-gray-500'>Connected Accounts</p>
          <p className='text-3xl font-bold'>{data.accounts.length}</p>
        </Card>
        <Card>
          <p className='text-sm text-gray-500'>Recent Posts</p>
          <p className='text-3xl font-bold'>{data.recent_posts.length}</p>
        </Card>
        <Card>
          <p className='text-sm text-gray-500'>Token Health</p>
          <p className='text-3xl font-bold'>{data.accounts.filter((a) => a.token_health === 'ok').length}</p>
        </Card>
      </div>

      <Card>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold'>Connected Accounts</h2>
          <Link href='/accounts' className='inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline'>Manage <ArrowRight aria-hidden='true' className='h-4 w-4' /></Link>
        </div>
        <div className='space-y-2'>
          {data.accounts.map((a) => (
            <div key={a.id} className='flex items-center justify-between rounded border border-border p-2'>
              <div>
                <p className='font-medium'>{a.display_name || `Account #${a.id}`}</p>
                <p className='text-sm text-gray-600'>{a.platform}</p>
              </div>
              <Badge><CheckCircle2 aria-hidden='true' className='mr-1 inline h-3 w-3' />{a.token_health}</Badge>
            </div>
          ))}
          {data.accounts.length === 0 && (
            <div className='rounded border border-dashed border-border p-4 text-sm text-gray-600'>No connected accounts yet. Open Accounts to review supported provider paths.</div>
          )}
        </div>
      </Card>
    </ProtectedPage>
  );
}
