'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn, roleToHref, getSession } from '@/lib/auth';

const roleInfo = [
  { label: 'TCT Owner',        tag: 'View-only',   color: '#7a78a8', bg: '#f6f6fb',  border: '#c8c6e8' },
  { label: 'TCT Participant',  tag: 'Full access',  color: '#0a6038', bg: '#edfaf3',  border: '#70d0a0' },
  { label: 'Project Submitter',tag: 'Submit',       color: '#7a78a8', bg: '#f6f6fb',  border: '#c8c6e8' },
  { label: 'TCN Admin',        tag: 'Admin',        color: '#7a78a8', bg: '#f6f6fb',  border: '#c8c6e8' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // If already logged in, redirect immediately
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        const role = session.user?.user_metadata?.role;
        if (role) router.replace(roleToHref(role));
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { role, error: authError } = await signIn(email, password);

    if (authError || !role) {
      setError(authError ?? 'Account has no role assigned. Contact your administrator.');
      setLoading(false);
      return;
    }

    router.replace(roleToHref(role));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ position: 'relative', zIndex: 10 }}>
      {/* Header */}
      <header style={{
        padding: '0 60px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1.5px solid #dedcf2',
        boxShadow: '0 1px 4px rgba(84,82,214,0.07)',
        flexShrink: 0,
      }}>
        <Image src="/tcn-logo.png" alt="TokenCap Network" height={44} width={280}
          style={{ objectFit: 'contain', objectPosition: 'left center' }} priority />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Title block */}
        <div className="w-full max-w-md mb-8 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: '#eeecff', border: '1.5px solid #c8c6e8', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#5452d6', letterSpacing: '0.06em' }}
          >
            <span className="live-dot" />
            NETWORK ACTIVE
          </div>
          <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 32, fontWeight: 800, color: '#0f0e2a', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 12 }}>
            Private Collaboration<br />Registry
          </h1>
          <p style={{ fontSize: 14, color: '#7a78a8', lineHeight: 1.8 }}>
            Access is restricted to <strong style={{ color: '#2e2c5e', fontWeight: 600 }}>verified TokenCap Token holders</strong>.
          </p>
        </div>

        {/* Login form */}
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <div
              style={{
                background: '#fff',
                border: '1.5px solid #dedcf2',
                borderRadius: 16,
                padding: '32px 36px',
                boxShadow: '0 4px 24px rgba(84,82,214,0.10)',
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 16, fontWeight: 700, color: '#0f0e2a', marginBottom: 24 }}>
                Sign In
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2e2c5e', letterSpacing: '0.04em', marginBottom: 8, fontFamily: 'var(--font-dm)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: '1.5px solid #dedcf2',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#0f0e2a',
                      background: '#fff',
                      outline: 'none',
                      fontFamily: 'var(--font-dm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2e2c5e', letterSpacing: '0.04em', marginBottom: 8, fontFamily: 'var(--font-dm)' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      border: '1.5px solid #dedcf2',
                      borderRadius: 10,
                      fontSize: 14,
                      color: '#0f0e2a',
                      background: '#fff',
                      outline: 'none',
                      fontFamily: 'var(--font-dm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: '#fff0f2', border: '1px solid #f0a0a8', borderRadius: 8, fontSize: 13, color: '#b82030', lineHeight: 1.5 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: loading ? '#8280e8' : '#5452d6',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    cursor: loading ? 'wait' : 'pointer',
                    fontFamily: 'var(--font-dm)',
                    boxShadow: '0 3px 14px rgba(84,82,214,0.28)',
                    transition: 'background 0.16s',
                    marginTop: 4,
                  }}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </div>
            </div>
          </form>

          {/* Role info tags */}
          <div className="flex flex-wrap gap-2 justify-center mb-2">
            {roleInfo.map(({ label, tag, color, bg, border }) => (
              <div
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  background: '#fff',
                  border: '1.5px solid #dedcf2',
                  borderRadius: 99,
                  fontSize: 12,
                  color: '#2e2c5e',
                  fontFamily: 'var(--font-dm)',
                }}
              >
                {label}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color, background: bg, border: `1px solid ${border}`, borderRadius: 99, padding: '1px 7px', letterSpacing: '0.04em' }}>
                  {tag.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 16, fontSize: 11, color: '#7a78a8', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textAlign: 'center' }}>
            ROLE IS ASSIGNED AT ACCOUNT CREATION · PHASE C WILL USE TCT CREDENTIALS
          </p>
        </div>
      </div>
    </div>
  );
}
