'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Role } from '@/lib/types';
import { signOut } from '@/lib/auth';

interface NavProps {
  role: Role;
}

const roleLabels: Record<Role, string> = {
  tct_owner: 'TCT Owner',
  participant: 'TCT Participant',
  submitter: 'Project Submitter',
  admin: 'TCN Admin',
};

const navLinks: Record<Role, { label: string; href: string }[]> = {
  tct_owner: [
    { label: 'Registry', href: '/tct-owner/dashboard' },
  ],
  participant: [
    { label: 'Registry', href: '/participant/dashboard' },
    { label: 'My Signals', href: '/participant/signals' },
  ],
  submitter: [
    { label: 'My Listings', href: '/submitter/dashboard' },
    { label: 'Submit New', href: '/submitter/submit' },
  ],
  admin: [
    { label: 'Review Queue', href: '/admin' },
    { label: 'All Listings', href: '/admin/listings' },
    { label: 'Audit Log', href: '/admin/audit' },
  ],
};

export default function Nav({ role }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between animate-fade-down"
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1.5px solid #dedcf2',
        boxShadow: '0 1px 4px rgba(84,82,214,0.07)',
        padding: '0 60px',
        height: 68,
      }}
    >
      <div className="flex items-center">
        <Link href={navLinks[role][0].href}>
          <Image
            src="/tcn-logo.png"
            alt="TokenCap Network"
            height={36}
            width={220}
            style={{ objectFit: 'contain', objectPosition: 'left center' }}
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-7">
        {navLinks[role].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: pathname === link.href ? '#5452d6' : '#7a78a8',
              textDecoration: 'none',
              letterSpacing: '0.01em',
              transition: 'color 0.16s',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: '#eeecff',
            border: '1.5px solid #c8c6e8',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: '#5452d6',
            letterSpacing: '0.05em',
          }}
        >
          <span className="live-dot" />
          {roleLabels[role]}
        </div>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#7a78a8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--font-dm)',
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
