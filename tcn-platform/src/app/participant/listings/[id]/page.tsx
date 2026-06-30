'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { SectorBadge, StatusBadge } from '@/components/Badge';
import { getListingById, signalInterest, insertAuditLog } from '@/lib/db';
import { Listing } from '@/lib/types';

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [signaled, setSignaled] = useState(false);
  const [signaling, setSignaling] = useState(false);

  useEffect(() => {
    getListingById(id).then(setListing).finally(() => setLoading(false));
  }, [id]);

  async function handleSignal() {
    if (!listing || signaling) return;
    setSignaling(true);
    setSignaled(true);
    await signalInterest(listing.id, 'part-temp');
    await insertAuditLog({
      timestamp: new Date().toISOString(),
      eventType: 'interest_signaled',
      userId: 'part-temp',
      userName: 'TCT Participant',
      role: 'participant',
      details: `Interest signaled in ${listing.name}`,
      listingId: listing.id,
    });
    setSignaling(false);
  }

  if (loading) {
    return (
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Nav role="participant" />
        <div style={{ padding: '80px 60px', textAlign: 'center', color: '#7a78a8' }}>
          Loading listing…
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Nav role="participant" />
        <div style={{ padding: '80px 60px', textAlign: 'center', color: '#7a78a8' }}>
          Listing not found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="participant" />

      <div style={{ padding: '40px 60px 80px', maxWidth: 900, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7a78a8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 28, padding: 0, fontFamily: 'var(--font-dm)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="#7a78a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Registry
        </button>

        {/* Header card */}
        <div
          style={{
            background: '#fff',
            border: '1.5px solid #dedcf2',
            borderRadius: 16,
            padding: '36px 40px',
            boxShadow: '0 4px 24px rgba(84,82,214,0.10)',
            marginBottom: 20,
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <SectorBadge sector={listing.sector} />
                <StatusBadge status={listing.status} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7a78a8' }}>{listing.id}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 28, fontWeight: 800, color: '#0f0e2a', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
                {listing.name}
              </h1>
              <div style={{ fontSize: 13, color: '#7a78a8' }}>
                Submitted by <strong style={{ color: '#2e2c5e', fontWeight: 600 }}>{listing.submitterName}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: '#5452d6', letterSpacing: '-0.01em' }}>
                {formatAmount(listing.targetAmount)}
              </div>
              <div style={{ fontSize: 11, color: '#7a78a8', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>COLLABORATION VALUE</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8" style={{ borderTop: '1px solid #dedcf2', paddingTop: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7a78a8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Location</div>
              <div style={{ fontSize: 14, color: '#0f0e2a', fontWeight: 500 }}>{listing.location}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7a78a8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Timeline</div>
              <div style={{ fontSize: 14, color: '#0f0e2a', fontWeight: 500 }}>{listing.timeline}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7a78a8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Interest Signals</div>
              <div style={{ fontSize: 14, color: '#5452d6', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {signaled ? listing.signalCount + 1 : listing.signalCount} participants
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7a78a8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Listed</div>
              <div style={{ fontSize: 14, color: '#0f0e2a', fontWeight: 500 }}>{listing.updatedAt.split('T')[0]}</div>
            </div>
          </div>
        </div>

        {/* Description + highlights */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          <div
            style={{
              background: '#fff',
              border: '1.5px solid #dedcf2',
              borderRadius: 16,
              padding: '28px 32px',
              boxShadow: '0 1px 4px rgba(84,82,214,0.07)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 16, fontWeight: 700, color: '#0f0e2a', marginBottom: 16 }}>
              About this Collaboration
            </h2>
            <p style={{ fontSize: 14, color: '#2e2c5e', lineHeight: 1.8 }}>{listing.description}</p>

            <div
              style={{
                marginTop: 20,
                padding: '14px 18px',
                background: '#eeecff',
                borderRadius: 10,
                border: '1px solid #c8c6e8',
                fontSize: 12,
                color: '#5452d6',
                lineHeight: 1.6,
              }}
            >
              <strong>Notice:</strong> This listing is published for collaboration coordination purposes only. TCN does not facilitate, recommend, or represent any financial opportunity. All arrangements are independently determined between participants.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: '#fff',
                border: '1.5px solid #dedcf2',
                borderRadius: 16,
                padding: '24px 28px',
                boxShadow: '0 1px 4px rgba(84,82,214,0.07)',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: 14, fontWeight: 700, color: '#0f0e2a', marginBottom: 14 }}>
                Project Highlights
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {listing.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5" style={{ fontSize: 13, color: '#2e2c5e' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5452d6', marginTop: 5, flexShrink: 0 }} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Signal interest */}
            <div
              style={{
                background: signaled ? '#edfaf3' : '#fff',
                border: `1.5px solid ${signaled ? '#70d0a0' : '#dedcf2'}`,
                borderRadius: 16,
                padding: '24px 28px',
                boxShadow: '0 1px 4px rgba(84,82,214,0.07)',
                transition: 'all 0.3s',
              }}
            >
              {signaled ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                  <div style={{ fontFamily: 'var(--font-dm)', fontSize: 14, fontWeight: 700, color: '#0a6038', marginBottom: 6 }}>
                    Interest Signaled
                  </div>
                  <div style={{ fontSize: 12, color: '#7a78a8', lineHeight: 1.6 }}>
                    The project submitter has been notified. A communication channel will be opened.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: '#7a78a8', lineHeight: 1.6, marginBottom: 16 }}>
                    Signal your interest to notify the submitter and open a collaboration channel.
                  </div>
                  <button
                    onClick={handleSignal}
                    disabled={signaling}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#5452d6',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#fff',
                      cursor: signaling ? 'wait' : 'pointer',
                      fontFamily: 'var(--font-dm)',
                      boxShadow: '0 3px 14px rgba(84,82,214,0.28)',
                      transition: 'background 0.16s',
                      opacity: signaling ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => { if (!signaling) (e.currentTarget as HTMLElement).style.background = '#3f3db8'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#5452d6'; }}
                  >
                    {signaling ? 'Saving…' : 'Signal Interest'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
