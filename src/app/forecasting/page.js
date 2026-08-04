import { fetchAllActiveDeals, fetchUnpaidInvoices } from '@/lib/zoho';
import ForecastingClient from './ForecastingClient';
import { format, parseISO, isValid } from 'date-fns';
import { stageProbabilities } from '@/lib/mockData';

export default async function ForecastingPage() {
  const [opportunities, unpaidInvoices] = await Promise.all([
    fetchAllActiveDeals(),
    fetchUnpaidInvoices()
  ]);
  
  // Aggregate revenue by month
  const monthlyData = {};
  
  // Add pipeline data
  opportunities.forEach(opp => {
    if (opp.stage === 'Closed Lost') return;
    
    // Use cash collection date, fallback to close date
    const dateStr = opp.cashCollectionDate || opp.closeDate;
    if (!dateStr) return;
    
    const date = parseISO(dateStr);
    if (!isValid(date)) return;
    
    const month = format(date, 'MMM yyyy');
    const sortKey = format(date, 'yyyy-MM');
    const value = opp.expectedRevenue || 0;
    const probability = stageProbabilities[opp.stage] || 0;
    const weightedValue = value * (probability / 100);
    
    if (!monthlyData[sortKey]) {
      monthlyData[sortKey] = {
        name: month,
        sortKey,
        bestCase: 0,
        commit: 0,
        invoiced: 0,
        deals: 0
      };
    }
    
    monthlyData[sortKey].bestCase += value;
    monthlyData[sortKey].commit += weightedValue;
    monthlyData[sortKey].deals += 1;
  });

  // Add invoiced data
  unpaidInvoices.forEach(inv => {
    if (!inv.dueDate) return;
    
    const date = parseISO(inv.dueDate);
    if (!isValid(date)) return;
    
    const month = format(date, 'MMM yyyy');
    const sortKey = format(date, 'yyyy-MM');
    const value = inv.balance || 0;
    
    if (!monthlyData[sortKey]) {
      monthlyData[sortKey] = {
        name: month,
        sortKey,
        bestCase: 0,
        commit: 0,
        invoiced: 0,
        deals: 0
      };
    }
    
    monthlyData[sortKey].invoiced += value;
  });

  const chartData = Object.values(monthlyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return <ForecastingClient chartData={chartData} />;
}
