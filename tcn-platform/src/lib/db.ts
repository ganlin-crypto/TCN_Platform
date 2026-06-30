import { supabase } from './supabase';
import { Listing, AuditEvent, ListingStatus } from './types';

// ─── Row converters (DB snake_case → TS camelCase) ───────────────────────────

function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    name: row.name as string,
    sector: row.sector as Listing['sector'],
    status: row.status as ListingStatus,
    submittedAt: row.submitted_at as string,
    updatedAt: row.updated_at as string,
    submitterId: (row.submitter_id as string) ?? '',
    submitterName: row.submitter_name as string,
    description: row.description as string,
    targetAmount: row.target_amount as number,
    location: row.location as string,
    timeline: row.timeline as string,
    highlights: (row.highlights as string[]) || [],
    signalCount: (row.signal_count as number) || 0,
  };
}

function rowToAuditEvent(row: Record<string, unknown>): AuditEvent {
  return {
    id: row.id as string,
    timestamp: row.timestamp as string,
    eventType: row.event_type as AuditEvent['eventType'],
    userId: row.user_id as string,
    userName: row.user_name as string,
    role: row.role as AuditEvent['role'],
    details: row.details as string,
    listingId: (row.listing_id as string) || undefined,
  };
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function getApprovedListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false });
  if (error) { console.error('getApprovedListings:', error); return []; }
  return (data || []).map(rowToListing);
}

export async function getAllListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) { console.error('getAllListings:', error); return []; }
  return (data || []).map(rowToListing);
}

export async function getListingById(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return rowToListing(data as Record<string, unknown>);
}

export async function updateListingStatus(id: string, status: ListingStatus): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('updateListingStatus:', error);
}

export async function insertListing(params: {
  name: string;
  sector: string;
  location: string;
  timeline: string;
  description: string;
  highlights: string[];
  submitterName: string;
  targetAmount: number;
}): Promise<string> {
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  const year = new Date().getFullYear();
  const id = `TCN-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { error } = await supabase.from('listings').insert({
    id,
    name: params.name,
    sector: params.sector,
    status: 'pending',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    submitter_id: 'sub-temp',
    submitter_name: params.submitterName,
    description: params.description,
    target_amount: params.targetAmount,
    location: params.location,
    timeline: params.timeline,
    highlights: params.highlights,
    signal_count: 0,
  });

  if (error) throw error;
  return id;
}

// ─── Collaboration Signals ────────────────────────────────────────────────────

export async function signalInterest(listingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('collaboration_signals')
    .insert({ listing_id: listingId, user_id: userId });

  // 23505 = unique violation (already signaled) — ignore
  if (error && error.code !== '23505') {
    console.error('signalInterest:', error);
    return;
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('signal_count')
    .eq('id', listingId)
    .single();

  if (listing) {
    await supabase
      .from('listings')
      .update({ signal_count: (listing.signal_count || 0) + 1 })
      .eq('id', listingId);
  }
}

// ─── Demo Reset ───────────────────────────────────────────────────────────────

const DEMO_ORIGINALS: { id: string; status: ListingStatus; signal_count: number }[] = [
  { id: 'TCN-2025-001', status: 'approved',      signal_count: 14 },
  { id: 'TCN-2025-002', status: 'approved',      signal_count: 9  },
  { id: 'TCN-2025-003', status: 'approved',      signal_count: 22 },
  { id: 'TCN-2025-004', status: 'approved',      signal_count: 31 },
  { id: 'TCN-2025-005', status: 'approved',      signal_count: 18 },
  { id: 'TCN-2025-006', status: 'approved',      signal_count: 12 },
  { id: 'TCN-2025-007', status: 'info_requested',signal_count: 0  },
  { id: 'TCN-2025-008', status: 'pending',       signal_count: 0  },
  { id: 'TCN-2025-009', status: 'pending',       signal_count: 0  },
  { id: 'TCN-2025-010', status: 'pending',       signal_count: 0  },
  { id: 'TCN-2025-011', status: 'pending',       signal_count: 0  },
  { id: 'TCN-2025-012', status: 'info_requested',signal_count: 0  },
];

export async function resetDemoData(): Promise<void> {
  // 1. Reset statuses for all 12 demo listings
  await Promise.all(
    DEMO_ORIGINALS.map(({ id, status, signal_count }) =>
      supabase
        .from('listings')
        .update({ status, signal_count, updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  );

  // 2. Delete any listings submitted via the form during demo
  await supabase
    .from('listings')
    .delete()
    .eq('submitter_id', 'sub-temp');

  // 3. Clear all collaboration signals
  await supabase
    .from('collaboration_signals')
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000');
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getAuditLogs(): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) { console.error('getAuditLogs:', error); return []; }
  return (data || []).map(rowToAuditEvent);
}

export async function insertAuditLog(event: Omit<AuditEvent, 'id'>): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    timestamp: new Date().toISOString(),
    event_type: event.eventType,
    user_id: event.userId,
    user_name: event.userName,
    role: event.role,
    details: event.details,
    listing_id: event.listingId ?? null,
  });
  if (error) console.error('insertAuditLog:', error);
}
