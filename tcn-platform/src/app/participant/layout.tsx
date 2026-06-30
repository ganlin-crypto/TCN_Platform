import AuthGuard from '@/components/AuthGuard';

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="participant">{children}</AuthGuard>;
}
