import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/shared/api/base';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
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
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      setError('root', {
        message: axiosError.response?.data?.detail || 'Registration failed. Please try again.',
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
            Start your <br />
            <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>
              AI-driven
            </span>{' '}
            <br />
            journey today.
          </h1>
          <p
            style={{
              color: 'var(--color-text-subtle)',
              fontSize: '1.125rem',
              maxWidth: '28rem',
              fontWeight: 500,
            }}
          >
            Create an account to unlock the full potential of multi-agent orchestration and
            specialized business domains.
          </p>
        </div>

        <div className="auth-branding-content flex flex-col gap-6">
          <div className="flex items-center gap-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <CheckCircle2 size={20} className="text-primary" />
            <span style={{ fontWeight: 500 }}>Unlimited Chat History</span>
          </div>
          <div className="flex items-center gap-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <CheckCircle2 size={20} className="text-primary" />
            <span style={{ fontWeight: 500 }}>Advanced Coding Sandbox</span>
          </div>
          <div className="flex items-center gap-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <CheckCircle2 size={20} className="text-primary" />
            <span style={{ fontWeight: 500 }}>Multi-domain Agent Access</span>
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

      {/* Right side: Register Form */}
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
              Create an account
            </h2>
            <p style={{ color: 'var(--color-text-subtle)', fontWeight: 500 }}>
              Join the Talos community today.
            </p>
          </div>

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
                <label className="form-label">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
              <div className="input-group">
                <label className="form-label">Confirm Password</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {errors.root && (
              <div className="auth-alert auth-alert-error">{errors.root.message}</div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn btn-dark w-full">
              <span style={{ fontWeight: 700 }}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
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
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
