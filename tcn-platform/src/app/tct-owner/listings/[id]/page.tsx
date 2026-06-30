'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { SectorBadge, StatusBadge } from '@/components/Badge';
import { getListingById } from '@/lib/db';
import { Listing } from '@/lib/types';

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export default function TctOwnerListingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListingById(id).then(setListing).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Nav role="tct_owner" />
        <div style={{ padding: '80px 60px', textAlign: 'center', color: '#7a78a8' }}>Loading listing…</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Nav role="tct_owner" />
        <div style={{ padding: '80px 60px', textAlign: 'center', color: '#7a78a8' }}>Listing not found.</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="tct_owner" />

      {/* Access tier banner */}
      <div style={{
        background: '#eeecff',
        borderBottom: '1.5px solid #c8c6e8',
        padding: '12px 60px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="7" cy="7" r="6" stroke="#5452d6" strokeWidth="1.5" />
          <path d="M7 6V10M7 4.5V5" stroke="#5452d6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 12, color: '#5452d6', fontFamily: 'var(--font-dm)', fontWeight: 500 }}>
          <strong>TCT Owner — View-only access.</strong> Signaling interest requires TCT Participant status.
        </span>
      </div>

      <div style={{ padding: '40px 60px 80px', maxWidth: 900, margin: '0 auto' }}>
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
        <div style={{
          background: '#fff', border: '1.5px solid #dedcf2', borderRadius: 16,
          padding: '36px 40px', boxShadow: '0 4px 24px rgba(84,82,214,0.10)', marginBottom: 20,
        }}>
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
            {[
              { label: 'Location', value: listing.location },
              { label: 'Timeline', value: listing.timeline },
              { label: 'Interest Signals', value: `${listing.signalCount} participants` },
              { label: 'Listed', value: listing.updatedAt.split('T')[0] },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7a78a8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#0f0e2a', fontWeight: 500 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          <div style={{ background: '#fff', border: '1.5px solid #dedcf2', borderRadius: 16, padding: '28px 32px', boxShadow: '0 1px 4px rgba(84,82,214,0.07)' }}>
            <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 16, fontWeight: 700, color: '#0f0e2a', marginBottom: 16 }}>About this Collaboration</h2>
            <p style={{ fontSize: 14, color: '#2e2c5e', lineHeight: 1.8 }}>{listing.description}</p>
            <div style={{ marginTop: 20, padding: '14px 18px', background: '#eeecff', borderRadius: 10, border: '1px solid #c8c6e8', fontSize: 12, color: '#5452d6', lineHeight: 1.6 }}>
              <strong>Notice:</strong> This listing is published for collaboration coordination purposes only. TCN does not facilitate, recommend, or represent any financial opportunity.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1.5px solid #dedcf2', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(84,82,214,0.07)' }}>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: 14, fontWeight: 700, color: '#0f0e2a', marginBottom: 14 }}>Project Highlights</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {listing.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5" style={{ fontSize: 13, color: '#2e2c5e' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5452d6', marginTop: 5, flexShrink: 0 }} />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Locked signal panel */}
            <div style={{
              background: '#f6f6fb',
              border: '1.5px solid #dedcf2',
              borderRadius: 16,
              padding: '24px 28px',
              boxShadow: '0 1px 4px rgba(84,82,214,0.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="8" rx="2" stroke="#7a78a8" strokeWidth="1.5" />
                  <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#7a78a8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#7a78a8', fontFamily: 'var(--font-dm)' }}>Signal Interest</span>
              </div>
              <p style={{ fontSize: 12, color: '#7a78a8', lineHeight: 1.6, marginBottom: 14 }}>
                Signaling interest requires <strong style={{ color: '#2e2c5e' }}>TCT Participant</strong> status — you must elect to participate in a specific project and have your fund transfer acknowledged by the receiving financial institution.
              </p>
              <div style={{
                width: '100%',
                padding: '12px',
                background: '#eeeef8',
                border: '1.5px solid #c8c6e8',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: '#7a78a8',
                textAlign: 'center',
                fontFamily: 'var(--font-dm)',
                cursor: 'not-allowed',
              }}>
                Locked — TCT Owner Access
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
