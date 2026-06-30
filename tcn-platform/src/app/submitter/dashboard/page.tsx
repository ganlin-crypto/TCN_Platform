'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { SectorBadge, StatusBadge } from '@/components/Badge';
import { getAllListings } from '@/lib/db';
import { Listing } from '@/lib/types';

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export default function SubmitterDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllListings().then(setListings).finally(() => setLoading(false));
  }, []);

  const approved = listings.filter((l) => l.status === 'approved').length;
  const pending = listings.filter((l) => l.status === 'pending').length;

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="submitter" />

      {/* Hero */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1.5px solid #dedcf2',
          padding: '56px 60px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', right: -60, top: -60,
            width: 440, height: 440, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(84,82,214,0.07) 0%, transparent 68%)',
            pointerEvents: 'none',
          }}
        />
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: '#eeecff', border: '1.5px solid #c8c6e8', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#5452d6', letterSpacing: '0.07em' }}
            >
              SUBMITTER PORTAL
            </div>
            <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', color: '#0f0e2a', marginBottom: 12, lineHeight: 1.1 }}>
              My <em style={{ fontStyle: 'normal', color: '#5452d6' }}>Listings</em>
            </h1>
            <p style={{ fontSize: 14, color: '#7a78a8', lineHeight: 1.8 }}>
              Manage your submitted collaboration opportunities and track participant interest.
            </p>
          </div>
          <Link
            href="/submitter/submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: '#5452d6',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 3px 14px rgba(84,82,214,0.28)',
              fontFamily: 'var(--font-dm)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M2 7H12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Submit New Listing
          </Link>
        </div>

        <div className="flex gap-8 mt-8">
          {[
            { label: 'Total Submitted', value: loading ? '—' : listings.length },
            { label: 'Approved & Live', value: loading ? '—' : approved },
            { label: 'Pending Review', value: loading ? '—' : pending },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'var(--font-outfit)', fontSize: 28, fontWeight: 800, color: stat.label === 'Pending Review' && pending > 0 ? '#a05e00' : '#5452d6', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#7a78a8', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 2 }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '36px 60px 80px' }}>
        <div style={{ fontFamily: 'var(--font-outfit)', fontSize: 18, fontWeight: 800, color: '#0f0e2a', marginBottom: 20 }}>
          All Submissions
        </div>
        <div
          style={{
            background: '#fff',
            border: '1.5px solid #dedcf2',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(84,82,214,0.10)',
          }}
        >
          {loading ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#7a78a8', fontSize: 14 }}>
              Loading listings from database…
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#0f0e2a' }}>
                <tr>
                  {['Project', 'Sector', 'Status', 'Submitted', 'Signals', 'Collab. Value'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '14px 20px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.5)',
                        textAlign: 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings.map((listing, i) => (
                  <tr
                    key={listing.id}
                    style={{
                      borderBottom: i < listings.length - 1 ? '1px solid #dedcf2' : 'none',
                      background: i % 2 === 1 ? '#faf9ff' : '#fff',
                    }}
                  >
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontFamily: 'var(--font-dm)', fontSize: 14, fontWeight: 700, color: '#0f0e2a', marginBottom: 4 }}>
                        {listing.name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7a78a8' }}>{listing.id}</div>
                    </td>
                    <td style={{ padding: '20px' }}><SectorBadge sector={listing.sector} /></td>
                    <td style={{ padding: '20px' }}><StatusBadge status={listing.status} /></td>
                    <td style={{ padding: '20px', fontSize: 13, color: '#7a78a8' }}>
                      {listing.submittedAt.split('T')[0]}
                    </td>
                    <td style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#5452d6' }}>
                      {listing.status === 'approved' ? listing.signalCount : '—'}
                    </td>
                    <td style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#0f0e2a' }}>
                      {formatAmount(listing.targetAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: '16px 20px',
            background: '#eeecff',
            border: '1px solid #c8c6e8',
            borderRadius: 12,
            fontSize: 12,
            color: '#5452d6',
            lineHeight: 1.6,
          }}
        >
          <strong>Note:</strong> Each listing is reviewed by TCN Admin before publication. Pending listings are not visible to participants. You will be notified when your listing is approved or if additional information is required.
        </div>
      </div>
    </div>
  );
}
