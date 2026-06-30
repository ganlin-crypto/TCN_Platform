import AuthGuard from '@/components/AuthGuard';

export default function TctOwnerLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="tct_owner">{children}</AuthGuard>;
}
