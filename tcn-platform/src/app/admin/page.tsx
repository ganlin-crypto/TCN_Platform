'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { SectorBadge, StatusBadge } from '@/components/Badge';
import { getAllListings, updateListingStatus, insertAuditLog, resetDemoData } from '@/lib/db';
import { Listing, ListingStatus } from '@/lib/types';

function formatAmount(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export default function AdminDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ListingStatus | 'all'>('pending');
  const [statuses, setStatuses] = useState<Record<string, ListingStatus>>({});
  const [resetting, setResetting] = useState(false);

  function reload() {
    setLoading(true);
    setStatuses({});
    getAllListings().then(setListings).finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, []);

  async function handleReset() {
    if (!confirm('Reset all demo listings to original states?\n\n• Statuses will be restored\n• Form submissions will be deleted\n• Collaboration signals will be cleared')) return;
    setResetting(true);
    await resetDemoData();
    setResetting(false);
    reload();
  }

  function getStatus(id: string, original: ListingStatus): ListingStatus {
    return statuses[id] ?? original;
  }

  async function act(id: string, action: ListingStatus) {
    // Optimistic update
    setStatuses((prev) => ({ ...prev, [id]: action }));
    // Persist to DB
    await updateListingStatus(id, action);
    // Write audit log
    const details =
      action === 'approved' ? 'Listing approved and published to registry' :
      action === 'rejected' ? 'Listing rejected by admin review' :
      'Additional information requested from submitter';
    const eventType =
      action === 'approved' ? 'listing_approved' :
      action === 'rejected' ? 'listing_rejected' :
      'listing_info_requested';
    await insertAuditLog({
      timestamp: new Date().toISOString(),
      eventType,
      userId: 'admin-001',
      userName: 'TCN Admin',
      role: 'admin',
      details,
      listingId: id,
    });
  }

  const displayed = listings.filter((l) => {
    const s = getStatus(l.id, l.status);
    if (tab === 'all') return true;
    return s === tab;
  });

  const pendingCount = listings.filter((l) => getStatus(l.id, l.status) === 'pending').length;
  const infoCount = listings.filter((l) => getStatus(l.id, l.status) === 'info_requested').length;

  const tabs: { key: ListingStatus | 'all'; label: string }[] = [
    { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'info_requested', label: `Info Requested${infoCount > 0 ? ` (${infoCount})` : ''}` },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All Listings' },
  ];

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="admin" />

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
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ background: '#eeecff', border: '1.5px solid #c8c6e8', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#5452d6', letterSpacing: '0.07em' }}
        >
          ADMIN CONSOLE
        </div>
        <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.025em', color: '#0f0e2a', marginBottom: 12, lineHeight: 1.1 }}>
          Review <em style={{ fontStyle: 'normal', color: '#5452d6' }}>Queue</em>
        </h1>
        <p style={{ fontSize: 14, color: '#7a78a8', lineHeight: 1.8 }}>
          Review submitted listings for compliance, approve or reject, and maintain the registry.
        </p>

        <div className="flex gap-8 mt-8">
          {[
            { label: 'Total Listings', value: loading ? '—' : listings.length },
            { label: 'Pending Review', value: loading ? '—' : pendingCount, alert: pendingCount > 0 },
            { label: 'Approved', value: loading ? '—' : listings.filter((l) => getStatus(l.id, l.status) === 'approved').length },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'var(--font-outfit)', fontSize: 28, fontWeight: 800, color: stat.alert ? '#a05e00' : '#5452d6', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#7a78a8', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 2 }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Table */}
      <div style={{ padding: '36px 60px 80px' }}>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 18px',
                border: `1.5px solid ${tab === t.key ? '#5452d6' : '#c8c6e8'}`,
                background: tab === t.key ? '#5452d6' : '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: tab === t.key ? '#fff' : '#7a78a8',
                cursor: 'pointer',
                transition: 'all 0.16s',
                fontFamily: 'var(--font-dm)',
              }}
            >
              {t.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <Link
              href="/admin/audit"
              style={{
                padding: '8px 18px',
                border: '1.5px solid #c8c6e8',
                background: '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#7a78a8',
                textDecoration: 'none',
                display: 'inline-block',
                fontFamily: 'var(--font-dm)',
              }}
            >
              View Audit Log →
            </Link>
          </div>
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
                  {['Project', 'Sector', 'Submitter', 'Value', 'Status', 'Actions'].map((h) => (
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
                        textAlign: h === 'Actions' ? 'center' : 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((listing, i) => {
                  const currentStatus = getStatus(listing.id, listing.status);
                  return (
                    <tr
                      key={listing.id}
                      style={{
                        borderBottom: i < displayed.length - 1 ? '1px solid #dedcf2' : 'none',
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
                      <td style={{ padding: '20px', fontSize: 13, color: '#2e2c5e' }}>{listing.submitterName}</td>
                      <td style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#0f0e2a' }}>
                        {formatAmount(listing.targetAmount)}
                      </td>
                      <td style={{ padding: '20px' }}><StatusBadge status={currentStatus} /></td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        {(currentStatus === 'pending' || currentStatus === 'info_requested') ? (
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => act(listing.id, 'approved')}
                              style={{
                                padding: '6px 14px',
                                background: '#edfaf3',
                                border: '1.5px solid #70d0a0',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#0a6038',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-dm)',
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => act(listing.id, 'info_requested')}
                              style={{
                                padding: '6px 14px',
                                background: '#eeecff',
                                border: '1.5px solid #b0a4f8',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#5452d6',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-dm)',
                              }}
                            >
                              Request Info
                            </button>
                            <button
                              onClick={() => act(listing.id, 'rejected')}
                              style={{
                                padding: '6px 14px',
                                background: '#fff0f2',
                                border: '1.5px solid #f0a0a8',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#b82030',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-dm)',
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#7a78a8', fontFamily: 'var(--font-mono)' }}>
                            {currentStatus === 'approved' ? 'LIVE' : 'CLOSED'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && displayed.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#7a78a8', fontSize: 14 }}>
              No listings in this category.
            </div>
          )}
        </div>
      </div>

      {/* Demo Controls */}
      <div style={{ padding: '0 60px 60px' }}>
        <div style={{
          border: '1.5px dashed #c8c6e8',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: '#7a78a8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Demo Controls
            </div>
            <div style={{ fontSize: 13, color: '#7a78a8' }}>
              Reset all 12 demo listings to original states · Clear signals · Remove test submissions
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{
              padding: '9px 20px',
              background: resetting ? '#f0f0ff' : '#fff',
              border: '1.5px solid #c8c6e8',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: resetting ? '#7a78a8' : '#5452d6',
              cursor: resetting ? 'wait' : 'pointer',
              fontFamily: 'var(--font-dm)',
              whiteSpace: 'nowrap',
              transition: 'all 0.16s',
            }}
          >
            {resetting ? '⟳ Resetting…' : '↺ Reset Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
