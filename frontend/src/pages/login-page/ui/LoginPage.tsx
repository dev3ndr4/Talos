import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/shared/api/base';
import { useUserStore } from '@/entities/user/model/store';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password must be at most 72 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fetchMe = useUserStore((state) => state.fetchMe);
  const successMessage = (location.state as any)?.message;
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
    <div className="flex min-h-screen bg-white overflow-hidden">
      {/* Left side: Branding & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-text-strong relative p-12 flex-col justify-between overflow-hidden">
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#10a37f_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutGrid size={20} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Talos</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Architecting the <br />
            <span className="text-primary italic">next generation</span> <br />
            of business AI.
          </h1>
          <p className="text-text-subtle text-lg max-w-md font-medium">
            Join thousands of teams using Talos to orchestrate multi-agent workflows and accelerate their development cycle.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
          <div className="space-y-2">
             <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-primary mb-3">
                <ShieldCheck size={18} />
             </div>
             <h3 className="text-white font-semibold">Secure by Design</h3>
             <p className="text-text-subtle text-xs leading-relaxed">Enterprise-grade encryption and isolated sandboxes for every task.</p>
          </div>
          <div className="space-y-2">
             <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-primary mb-3">
                <Zap size={18} />
             </div>
             <h3 className="text-white font-semibold">Lightning Fast</h3>
             <p className="text-text-subtle text-xs leading-relaxed">Optimized runtime for low-latency responses and high throughput.</p>
          </div>
        </div>

        <div className="absolute bottom-12 right-12 z-10">
           <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              <Globe size={12} />
              <span>Nodes: 2,841 Active</span>
           </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-20 py-12 relative">
        {/* Subtle grid for the form side too */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="w-full max-w-sm relative">
          <div className="mb-10 lg:hidden">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white mb-4">
              <LayoutGrid size={24} strokeWidth={2.5} />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-text-strong mb-2">Sign in to Talos</h2>
            <p className="text-text-subtle font-medium">Enter your credentials to access your workspace.</p>
          </div>

          {successMessage && (
            <div className="mb-6 rounded-xl bg-primary/10 border border-primary/20 p-4 text-sm text-primary font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck size={18} />
              {successMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-subtle mb-2 px-1">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-2xl border border-muted bg-muted/30 px-4 py-3.5 text-text-strong transition-all focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 placeholder:text-text-subtle/40"
                  placeholder="name@company.com"
                />
                {errors.email && <p className="mt-1.5 text-xs text-error font-medium px-1">{errors.email.message}</p>}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-subtle">Password</label>
                  <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Forgot?</a>
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full rounded-2xl border border-muted bg-muted/30 px-4 py-3.5 text-text-strong transition-all focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/5 placeholder:text-text-subtle/40"
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
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-text-strong py-4 text-sm font-bold text-white shadow-xl shadow-text-strong/10 hover:bg-primary transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign in to workspace'}</span>
              {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-muted">
             <p className="text-center text-sm text-text-subtle font-medium">
               Don't have an account yet? <Link to="/register" className="text-primary font-bold hover:underline">Create an account</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
