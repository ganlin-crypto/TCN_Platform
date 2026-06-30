'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Role } from '@/lib/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: Role;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      const role = session.user?.user_metadata?.role as Role | undefined;
      if (role !== requiredRole) {
        router.replace('/login');
        return;
      }
      setAuthorized(true);
    });
  }, [router, requiredRole]);

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2.5px solid #dedcf2',
            borderTopColor: '#5452d6',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <p style={{ fontSize: 13, color: '#7a78a8', fontFamily: 'var(--font-dm)' }}>
          Verifying credentials…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
