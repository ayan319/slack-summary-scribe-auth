import AuthGuard from '@/components/AuthGuard';
import ResponsivePage from './responsive-page';

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ResponsivePage />
    </AuthGuard>
  );
}
