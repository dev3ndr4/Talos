import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/shared/api/base';
import { useUserStore } from '@/entities/user/model/store';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const fetchMe = useUserStore((state) => state.fetchMe);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login', data);
      localStorage.setItem('talos_token', response.data.access_token);
      await fetchMe();
      navigate('/');
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.detail || 'Login failed. Please check your credentials.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-surface p-8 shadow-sm border border-muted">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LogIn size={24} strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-text-strong">Welcome to Talos</h2>
          <p className="mt-2 text-sm text-text-subtle">
            Sign in to access your business architect
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-text-strong mb-1">Email address</label>
              <input
                {...register('email')}
                type="email"
                className="block w-full rounded-lg border border-muted bg-muted/20 px-4 py-2 text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-strong mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                className="block w-full rounded-lg border border-muted bg-muted/20 px-4 py-2 text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
            </div>
          </div>

          {errors.root && (
            <div className="rounded-lg bg-error/10 p-3 text-sm text-error">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          
          <p className="text-center text-xs text-text-subtle">
            Don't have an account? <span className="text-primary font-medium cursor-pointer">Register (automatic on first login)</span>
          </p>
        </form>
      </div>
    </div>
  );
};
