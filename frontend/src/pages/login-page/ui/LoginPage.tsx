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
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be at most 72 characters'),
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
    <div className="auth-layout">
      {/* Left side: Branding & Visuals */}
      <div className="auth-branding">
        <div className="auth-branding-pattern">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-6rem',
              right: '-6rem',
              width: '24rem',
              height: '24rem',
              backgroundColor: 'rgba(16, 163, 127, 0.2)',
              borderRadius: 'var(--radius-full)',
              filter: 'blur(100px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-6rem',
              left: '-6rem',
              width: '24rem',
              height: '24rem',
              backgroundColor: 'rgba(16, 163, 127, 0.1)',
              borderRadius: 'var(--radius-full)',
              filter: 'blur(100px)',
            }}
          />
        </div>

        <div className="auth-branding-content">
          <div className="flex items-center gap-3 mb-12" style={{ color: 'white' }}>
            <div
              style={{
                height: '2.5rem',
                width: '2.5rem',
                backgroundColor: 'var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 15px -3px rgba(16, 163, 127, 0.2)',
              }}
            >
              <LayoutGrid size={20} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
              Talos
            </span>
          </div>

          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
            }}
          >
            Architecting the <br />
            <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>
              next generation
            </span>{' '}
            <br />
            of business AI.
          </h1>
          <p
            style={{
              color: 'var(--color-text-subtle)',
              fontSize: '1.125rem',
              maxWidth: '28rem',
              fontWeight: 500,
            }}
          >
            Join thousands of teams using Talos to orchestrate multi-agent workflows and accelerate
            their development cycle.
          </p>
        </div>

        <div
          className="auth-branding-content flex gap-8"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          <div className="flex flex-col gap-2">
            <div
              style={{
                height: '2rem',
                width: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                marginBottom: '0.75rem',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <h3 style={{ color: 'white', fontWeight: 600 }}>Secure by Design</h3>
            <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.75rem', lineHeight: 1.5 }}>
              Enterprise-grade encryption and isolated sandboxes for every task.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div
              style={{
                height: '2rem',
                width: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                marginBottom: '0.75rem',
              }}
            >
              <Zap size={18} />
            </div>
            <h3 style={{ color: 'white', fontWeight: 600 }}>Lightning Fast</h3>
            <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.75rem', lineHeight: 1.5 }}>
              Optimized runtime for low-latency responses and high throughput.
            </p>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '3rem', right: '3rem', zIndex: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            <Globe size={12} />
            <span>Nodes: 2,841 Active</span>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="auth-form-side">
        <div
          className="absolute inset-0 bg-grid-pattern"
          style={{ opacity: 1, pointerEvents: 'none' }}
        />

        <div className="auth-form-container">
          <div style={{ marginBottom: '2.5rem' }} className="lg:hidden">
            <div
              style={{
                height: '3rem',
                width: '3rem',
                backgroundColor: 'var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '1rem',
              }}
            >
              <LayoutGrid size={24} strokeWidth={2.5} />
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: 'var(--color-text-strong)',
                marginBottom: '0.5rem',
              }}
            >
              Sign in to Talos
            </h2>
            <p style={{ color: 'var(--color-text-subtle)', fontWeight: 500 }}>
              Enter your credentials to access your workspace.
            </p>
          </div>

          {successMessage && (
            <div className="auth-alert auth-alert-success">
              <ShieldCheck size={18} />
              {successMessage}
            </div>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="input-group">
                <label className="form-label">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              <div className="input-group">
                <div
                  className="flex justify-between items-center"
                  style={{ marginBottom: '0.5rem', padding: '0 var(--spacing-1)' }}
                >
                  <label className="form-label" style={{ padding: 0, margin: 0 }}>
                    Password
                  </label>
                  <a
                    href="#"
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
            </div>

            {errors.root && (
              <div className="auth-alert auth-alert-error">{errors.root.message}</div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn btn-dark w-full">
              <span style={{ fontWeight: 700 }}>
                {isSubmitting ? 'Authenticating...' : 'Sign in to workspace'}
              </span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div
            style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--color-muted-subtle)',
            }}
          >
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--color-text-subtle)',
                fontWeight: 500,
              }}
            >
              Don&apos;t have an account yet?{' '}
              <Link
                to="/register"
                style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
