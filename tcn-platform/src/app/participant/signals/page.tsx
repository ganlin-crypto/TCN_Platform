import Nav from '@/components/Nav';
import Link from 'next/link';

export default function MySignals() {
  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="participant" />
      <div style={{ padding: '80px 60px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-outfit)', fontSize: 22, fontWeight: 800, color: '#0f0e2a', marginBottom: 12 }}>
          My Signals
        </div>
        <p style={{ fontSize: 14, color: '#7a78a8', marginBottom: 24 }}>
          Collaboration signaling history — coming in Phase B.
        </p>
        <Link
          href="/participant/dashboard"
          style={{ fontSize: 13, color: '#5452d6', textDecoration: 'none', fontFamily: 'var(--font-dm)' }}
        >
          ← Back to Registry
        </Link>
      </div>
    </div>
  );
}
