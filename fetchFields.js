import { zohoApiRequest } from './src/lib/zoho.js';

async function fetchDeals() {
  try {
    const data = await zohoApiRequest('/Deals?fields=Deal_Name,Amount,Stage,Closing_Date,Next_Step,Modified_Time,Account_Name,Owner');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(error);
  }
}

fetchDeals();
