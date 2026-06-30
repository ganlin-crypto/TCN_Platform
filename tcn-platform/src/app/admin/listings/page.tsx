import { redirect } from 'next/navigation';

export default function AdminListings() {
  redirect('/admin?tab=all');
}
