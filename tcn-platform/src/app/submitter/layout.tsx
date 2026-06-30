import AuthGuard from '@/components/AuthGuard';

export default function SubmitterLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="submitter">{children}</AuthGuard>;
}
