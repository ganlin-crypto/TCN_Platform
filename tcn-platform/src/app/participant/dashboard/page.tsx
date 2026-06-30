'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { SectorBadge } from '@/components/Badge';
import { getApprovedListings } from '@/lib/db';
import { Listing, Sector } from '@/lib/types';

const sectors: (Sector | 'All')[] = ['All', 'Energy', 'Renewable Energy', 'Real Estate', 'Technology'];

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export default function ParticipantDashboard() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Sector | 'All'>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getApprovedListings().then(setListings).finally(() => setLoading(false));
  }, []);

  const filtered = listings.filter((l) => {
    if (filter !== 'All' && l.sector !== filter) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="participant" />

      {/* Hero */}
      <div
        className="animate-fade-down"
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
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ background: '#eeecff', border: '1.5px solid #c8c6e8', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#5452d6', letterSpacing: '0.07em' }}
        >
          PROJECT REGISTRY
        </div>
        <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.025em', color: '#0f0e2a', marginBottom: 16, lineHeight: 1.08 }}>
          Collaboration <em style={{ fontStyle: 'normal', color: '#5452d6' }}>Registry</em>
        </h1>
        <p style={{ fontSize: 14, color: '#7a78a8', lineHeight: 1.85, maxWidth: 500 }}>
          Browse <strong style={{ color: '#2e2c5e', fontWeight: 600 }}>verified collaboration opportunities</strong> from approved project submitters. Signal interest to initiate contact.
        </p>

        <div className="flex gap-8 mt-8">
          {[
            { label: 'Active Listings', value: loading ? '—' : listings.length },
            { label: 'Sectors', value: '4' },
            { label: 'Verified Participants', value: '147' },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'var(--font-outfit)', fontSize: 28, fontWeight: 800, color: '#5452d6', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#7a78a8', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 2 }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="animate-fade-up" style={{ padding: '36px 60px 80px' }}>
        {/* Filters */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7a78a8', letterSpacing: '0.07em', textTransform: 'uppercase', marginRight: 4 }}>
              SECTOR
            </span>
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '7px 16px',
                  border: `1.5px solid ${filter === s ? '#5452d6' : '#c8c6e8'}`,
                  background: filter === s ? '#5452d6' : '#fff',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: filter === s ? '#fff' : '#7a78a8',
                  cursor: 'pointer',
                  boxShadow: filter === s ? '0 3px 14px rgba(84,82,214,0.28)' : '0 1px 4px rgba(84,82,214,0.07)',
                  transition: 'all 0.16s',
                  fontFamily: 'var(--font-dm)',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1.5px solid #dedcf2',
              borderRadius: 8,
              fontSize: 13,
              color: '#0f0e2a',
              background: '#fff',
              outline: 'none',
              fontFamily: 'var(--font-dm)',
              boxShadow: '0 1px 4px rgba(84,82,214,0.07)',
              width: 220,
            }}
          />
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2 mb-5">
          <span style={{ fontFamily: 'var(--font-outfit)', fontSize: 18, fontWeight: 800, color: '#0f0e2a', letterSpacing: '-0.01em' }}>
            Active Listings
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: '#7a78a8' }}>
            {loading ? 'Loading…' : `${filtered.length} results`}
          </span>
        </div>

        {/* Table */}
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
                  {['Project', 'Sector', 'Location', 'Collaboration Value', 'Timeline', 'Signals', ''].map((h) => (
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((listing, i) => (
                  <tr
                    key={listing.id}
                    onClick={() => router.push(`/participant/listings/${listing.id}`)}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #dedcf2' : 'none',
                      background: i % 2 === 1 ? '#faf9ff' : '#fff',
                      cursor: 'pointer',
                      transition: 'background 0.14s',
                      animation: `rowIn 0.42s ${0.28 + i * 0.07}s ease both`,
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f2f0fd'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 1 ? '#faf9ff' : '#fff'; }}
                  >
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontFamily: 'var(--font-dm)', fontSize: 14, fontWeight: 700, color: '#0f0e2a', lineHeight: 1.3, marginBottom: 4 }}>
                        {listing.name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7a78a8' }}>
                        {listing.id}
                      </div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <SectorBadge sector={listing.sector} />
                    </td>
                    <td style={{ padding: '20px', fontSize: 13, color: '#2e2c5e' }}>
                      {listing.location}
                    </td>
                    <td style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#0f0e2a' }}>
                      {formatAmount(listing.targetAmount)}
                    </td>
                    <td style={{ padding: '20px', fontSize: 13, color: '#7a78a8' }}>
                      {listing.timeline}
                    </td>
                    <td style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#5452d6', textAlign: 'center' }}>
                      {listing.signalCount}
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke="#7a78a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#7a78a8', fontSize: 14 }}>
              No listings match your filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
