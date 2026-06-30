'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { EventBadge } from '@/components/Badge';
import { getAuditLogs } from '@/lib/db';
import { AuditEvent } from '@/lib/types';

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

const roleColors: Record<string, string> = {
  admin: '#5452d6',
  submitter: '#a05e00',
  participant: '#0a6038',
};

export default function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then(setEvents).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="admin" />

      <div
        style={{
          background: '#fff',
          borderBottom: '1.5px solid #dedcf2',
          padding: '48px 60px 40px',
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

        <Link
          href="/admin"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7a78a8', textDecoration: 'none', marginBottom: 24 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="#7a78a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Review Queue
        </Link>

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
          style={{ background: '#eeecff', border: '1.5px solid #c8c6e8', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#5452d6', letterSpacing: '0.07em', display: 'flex' }}
        >
          IMMUTABLE AUDIT TRAIL
        </div>
        <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 28, fontWeight: 800, color: '#0f0e2a', letterSpacing: '-0.025em', marginBottom: 8 }}>
          Platform <em style={{ fontStyle: 'normal', color: '#5452d6' }}>Audit Log</em>
        </h1>
        <p style={{ fontSize: 14, color: '#7a78a8', lineHeight: 1.7 }}>
          All significant platform events — immutably recorded with timestamp, actor, and action.
        </p>

        <div className="flex gap-8 mt-6">
          {[
            { label: 'Total Events', value: loading ? '—' : events.length },
            { label: 'Listing Events', value: loading ? '—' : events.filter((e) => e.listingId).length },
            { label: 'Access Events', value: loading ? '—' : events.filter((e) => e.eventType === 'user_login').length },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'var(--font-outfit)', fontSize: 24, fontWeight: 800, color: '#5452d6', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: '#7a78a8', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 2 }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '36px 60px 80px' }}>
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
              Loading audit log from database…
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#0f0e2a' }}>
                <tr>
                  {['Timestamp', 'Event', 'Actor', 'Role', 'Listing ID', 'Details'].map((h) => (
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
                {events.map((evt, i) => (
                  <tr
                    key={evt.id}
                    style={{
                      borderBottom: i < events.length - 1 ? '1px solid #dedcf2' : 'none',
                      background: i % 2 === 1 ? '#faf9ff' : '#fff',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7a78a8', whiteSpace: 'nowrap' }}>
                      {formatTs(evt.timestamp)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <EventBadge eventType={evt.eventType} />
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#0f0e2a', fontWeight: 500 }}>
                      {evt.userName}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 600,
                          color: roleColors[evt.role] ?? '#7a78a8',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {evt.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5452d6' }}>
                      {evt.listingId ?? '—'}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: '#7a78a8', maxWidth: 300 }}>
                      {evt.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (
          <div style={{ marginTop: 16, fontSize: 11, color: '#7a78a8', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            {events.length} events · Live database · Ordered by most recent
          </div>
        )}
      </div>
    </div>
  );
}
