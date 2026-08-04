import { fetchUnpaidInvoices } from './src/lib/zoho.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function run() {
  const data = await fetchUnpaidInvoices();
  fs.writeFileSync('scratch/unpaid.json', JSON.stringify(data, null, 2));
  console.log("Done. Found", data.length, "invoices.");
}

run();
