import { Sector, ListingStatus, EventType } from '@/lib/types';

const sectorStyles: Record<Sector, { color: string; borderColor: string; background: string }> = {
  Energy: { color: '#854a00', borderColor: '#f0c070', background: '#fff8ec' },
  'Renewable Energy': { color: '#0a6038', borderColor: '#70d0a0', background: '#edfaf3' },
  'Real Estate': { color: '#3c28b0', borderColor: '#b0a4f8', background: '#f0eeff' },
  Technology: { color: '#123ea0', borderColor: '#88b4f4', background: '#eef3ff' },
};

const statusStyles: Record<ListingStatus, { color: string; borderColor: string; background: string; label?: string }> = {
  pending:        { color: '#a05e00', borderColor: '#f0c070', background: '#fff8ec' },
  info_requested: { color: '#5452d6', borderColor: '#b0a4f8', background: '#eeecff', label: 'Info Requested' },
  approved:       { color: '#0a6038', borderColor: '#70d0a0', background: '#edfaf3' },
  rejected:       { color: '#b82030', borderColor: '#f0a0a8', background: '#fff0f2' },
  archived:       { color: '#7a78a8', borderColor: '#c8c6e8', background: '#f6f6fb' },
};

const eventStyles: Record<EventType, { color: string; borderColor: string; background: string; label: string }> = {
  listing_submitted:      { color: '#3c28b0', borderColor: '#b0a4f8', background: '#f0eeff', label: 'Submitted' },
  listing_approved:       { color: '#0a6038', borderColor: '#70d0a0', background: '#edfaf3', label: 'Approved' },
  listing_rejected:       { color: '#b82030', borderColor: '#f0a0a8', background: '#fff0f2', label: 'Rejected' },
  listing_info_requested: { color: '#854a00', borderColor: '#f0c070', background: '#fff8ec', label: 'Info Requested' },
  interest_signaled:      { color: '#5452d6', borderColor: '#b0a4f8', background: '#eeecff', label: 'Interest' },
  user_login:             { color: '#7a78a8', borderColor: '#c8c6e8', background: '#f6f6fb', label: 'Login' },
};

export function SectorBadge({ sector }: { sector: Sector }) {
  const s = sectorStyles[sector];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 99,
        border: `1.5px solid ${s.borderColor}`,
        color: s.color,
        background: s.background,
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        fontFamily: 'var(--font-dm)',
      }}
    >
      {sector}
    </span>
  );
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  const s = statusStyles[status];
  const label = s.label ?? (status.charAt(0).toUpperCase() + status.slice(1));
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 99,
        border: `1.5px solid ${s.borderColor}`,
        color: s.color,
        background: s.background,
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        fontFamily: 'var(--font-dm)',
      }}
    >
      {label}
    </span>
  );
}

export function EventBadge({ eventType }: { eventType: EventType }) {
  const s = eventStyles[eventType];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        fontSize: 10,
        fontWeight: 600,
        borderRadius: 99,
        border: `1.5px solid ${s.borderColor}`,
        color: s.color,
        background: s.background,
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
      }}
    >
      {s.label}
    </span>
  );
}
