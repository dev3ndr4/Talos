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
    <div className="flex min-h-screen items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#10a37f10_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-[440px] relative">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary text-white shadow-xl shadow-primary/20 mb-6">
             <div className="grid grid-cols-2 gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-white/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-white" />
                <div className="w-2.5 h-2.5 rounded-sm bg-white" />
                <div className="w-2.5 h-2.5 rounded-sm bg-white/40" />
             </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-text-strong">Welcome to Talos</h2>
          <p className="mt-3 text-text-subtle font-medium">
            Your multi-agent business architect
          </p>
        </div>

        <div className="bg-surface border border-muted/50 rounded-[32px] p-10 shadow-2xl shadow-primary/5 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-subtle mb-2 px-1">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-2xl border border-muted bg-muted/30 px-4 py-3 text-text-strong transition-all focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                  placeholder="name@company.com"
                />
                {errors.email && <p className="mt-1.5 text-xs text-error font-medium px-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-subtle mb-2 px-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full rounded-2xl border border-muted bg-muted/30 px-4 py-3 text-text-strong transition-all focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5"
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1.5 text-xs text-error font-medium px-1">{errors.password.message}</p>}
              </div>
            </div>

            {errors.root && (
              <div className="rounded-xl bg-error/5 border border-error/10 p-3 text-xs text-error font-medium text-center">
                {errors.root.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-2xl bg-text-strong py-3.5 text-sm font-bold text-white shadow-lg hover:bg-primary transition-all disabled:opacity-50 overflow-hidden"
            >
              <span className="relative z-10">{isSubmitting ? 'Authenticating...' : 'Sign in'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted" /></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="bg-surface px-4 text-text-subtle">Secure Access</span></div>
            </div>

            <p className="text-center text-xs text-text-subtle font-medium">
              Enterprise security enabled. <span className="text-primary hover:underline cursor-pointer">Learn more</span>
            </p>
          </form>
        </div>
        
        <p className="text-center text-[11px] mt-8 text-text-subtle/60 font-medium">
          &copy; 2026 Talos AI Corporation. All rights reserved.
        </p>
      </div>
    </div>
  );
};
