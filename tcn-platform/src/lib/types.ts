export type Role = 'tct_owner' | 'participant' | 'submitter' | 'admin';
export type ListingStatus = 'pending' | 'info_requested' | 'approved' | 'rejected' | 'archived';
export type Sector = 'Energy' | 'Renewable Energy' | 'Real Estate' | 'Technology';
export type EventType =
  | 'listing_submitted'
  | 'listing_approved'
  | 'listing_rejected'
  | 'listing_info_requested'
  | 'interest_signaled'
  | 'user_login';

export interface Listing {
  id: string;
  name: string;
  sector: Sector;
  status: ListingStatus;
  submittedAt: string;
  updatedAt: string;
  submitterId: string;
  submitterName: string;
  description: string;
  targetAmount: number;
  location: string;
  timeline: string;
  highlights: string[];
  signalCount: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: EventType;
  userId: string;
  userName: string;
  role: Role;
  details: string;
  listingId?: string;
}
