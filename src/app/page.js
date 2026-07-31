import { fetchAllActiveDeals } from '@/lib/zoho';
import DashboardClient from '@/components/DashboardClient';

export default async function CommandCentrePage() {
  const opportunities = await fetchAllActiveDeals();
  return <DashboardClient opportunities={opportunities} />;
}
