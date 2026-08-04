import { zohoApiRequest } from './src/lib/zoho.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const booksClientId = process.env.ZOHO_BOOKS_CLIENT_ID;
  const booksClientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET;
  const booksRefreshToken = process.env.ZOHO_BOOKS_REFRESH_TOKEN;
  const booksOrgId = process.env.ZOHO_BOOKS_ORG_ID;

  const tokenUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${booksRefreshToken}&client_id=${booksClientId}&client_secret=${booksClientSecret}&grant_type=refresh_token`;
  
  const tokenRes = await fetch(tokenUrl, { method: 'POST', cache: 'no-store' });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  
  const invoicesUrl = `https://www.zohoapis.com/books/v3/invoices?organization_id=${booksOrgId}&page=1`;
  const headers = { 'Authorization': `Zoho-oauthtoken ${accessToken}` };
  const invoicesRes = await fetch(invoicesUrl, { headers, cache: 'no-store' });
  const invoicesData = await invoicesRes.json();
  
  console.log(JSON.stringify(invoicesData.invoices.slice(0, 2), null, 2));
}

run();
