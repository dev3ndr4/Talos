import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/shared/api/base';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, ArrowRight, ShieldCheck, Zap, Globe, CheckCircle2 } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72, 'Password must be at most 72 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
      });
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.detail || 'Registration failed. Please try again.',
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-surface overflow-hidden">
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
            Start your <br />
            <span className="text-primary italic">AI-driven</span> <br />
            journey today.
          </h1>
          <p className="text-text-subtle text-lg max-w-md font-medium">
            Create an account to unlock the full potential of multi-agent orchestration and specialized business domains.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
           <div className="flex items-center gap-4 text-white/80">
              <CheckCircle2 size={20} className="text-primary" />
              <span className="font-medium">Unlimited Chat History</span>
           </div>
           <div className="flex items-center gap-4 text-white/80">
              <CheckCircle2 size={20} className="text-primary" />
              <span className="font-medium">Advanced Coding Sandbox</span>
           </div>
           <div className="flex items-center gap-4 text-white/80">
              <CheckCircle2 size={20} className="text-primary" />
              <span className="font-medium">Multi-domain Agent Access</span>
           </div>
        </div>

        <div className="absolute bottom-12 right-12 z-10">
           <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              <Globe size={12} />
              <span>Nodes: 2,841 Active</span>
           </div>
        </div>
      </div>

      {/* Right side: Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-20 py-12 relative">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-100 pointer-events-none bg-grid-pattern" />

        <div className="w-full max-w-sm relative">
          <div className="mb-10 lg:hidden">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4">
              <LayoutGrid size={24} strokeWidth={2.5} />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-text-strong mb-2">Create an account</h2>
            <p className="text-text-subtle font-medium">Join the Talos community today.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-subtle mb-2 px-1">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-xl border border-muted bg-muted/30 px-4 py-3 text-text-strong transition-all focus:border-primary/50 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/5 placeholder:text-text-subtle/40 shadow-sm"
                  placeholder="name@company.com"
                />
                {errors.email && <p className="mt-1.5 text-xs text-error font-medium px-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-subtle mb-2 px-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full rounded-xl border border-muted bg-muted/30 px-4 py-3 text-text-strong transition-all focus:border-primary/50 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/5 placeholder:text-text-subtle/40 shadow-sm"
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1.5 text-xs text-error font-medium px-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-subtle mb-2 px-1">Confirm Password</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="block w-full rounded-xl border border-muted bg-muted/30 px-4 py-3 text-text-strong transition-all focus:border-primary/50 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/5 placeholder:text-text-subtle/40 shadow-sm"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="mt-1.5 text-xs text-error font-medium px-1">{errors.confirmPassword.message}</p>}
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
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-text-strong py-3 text-sm font-bold text-white shadow-md hover:bg-primary transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create account'}</span>
              {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-muted">
             <p className="text-center text-sm text-text-subtle font-medium">
               Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in instead</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
