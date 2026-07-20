'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiFetch, getErrorMessage, setToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DemoNotice } from '@/components/demo-notice';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiFetch<{ access_token: string }>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setToken(res.access_token);
      toast.success(mode === 'login' ? 'Logged in' : 'Account created');
      router.push('/dashboard');
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Authentication failed'));
    }
  };

  return (
    <div className='min-h-screen'>
      <DemoNotice />
      <main className='flex min-h-[calc(100vh-48px)] items-center justify-center px-4 py-10'>
      <Card className='w-full max-w-md space-y-5 p-6'>
        <div className='space-y-1'>
          <p className='text-sm font-semibold tracking-wide text-primary'>SOCIAL MEDIA CONTROL CENTER</p>
          <h1 className='text-2xl font-semibold'>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1>
          <p className='text-sm text-gray-600'>Compose once, track every provider result, and keep credentials behind the API boundary.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
          <div className='space-y-1'>
            <label htmlFor={`${mode}-email`} className='text-sm font-medium'>Email</label>
            <Input id={`${mode}-email`} placeholder='you@example.com' type='email' autoComplete='email' {...register('email')} />
          </div>
          <div className='space-y-1'>
            <label htmlFor={`${mode}-password`} className='text-sm font-medium'>Password</label>
            <Input id={`${mode}-password`} placeholder='At least 6 characters' type='password' autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...register('password')} />
          </div>
          <Button type='submit' disabled={formState.isSubmitting} className='w-full'>
            {formState.isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>
        <p className='text-sm text-gray-600'>
          {mode === 'login' ? 'No account?' : 'Already have an account?'}{' '}
          <Link href={mode === 'login' ? '/signup' : '/login'} className='text-primary underline'>
            {mode === 'login' ? 'Sign up' : 'Login'}
          </Link>
        </p>
      </Card>
      </main>
    </div>
  );
}
