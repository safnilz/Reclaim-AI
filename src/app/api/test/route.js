import { fetchUnpaidInvoices } from '@/lib/zoho';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await fetchUnpaidInvoices();
  return NextResponse.json({ count: data.length, data });
}
