import { zohoApiRequest } from '@/lib/zoho';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const deals = await zohoApiRequest('/Deals?page=1&per_page=5&fields=Deal_Name,Stage,Amount');
    
    // Check if there are blueprint details
    let bp = null;
    if (deals.data && deals.data.length > 0) {
      const dealId = deals.data[0].id;
      try {
        bp = await zohoApiRequest(`/Deals/${dealId}/actions/blueprint`);
      } catch(e) {}
    }
    
    // Fetch Fields for Deals
    const fieldsData = await zohoApiRequest('/settings/fields?module=Deals');
    const importantFields = fieldsData.fields ? fieldsData.fields.filter(f => !f.system_mandatory).map(f => ({ name: f.api_name, label: f.field_label })) : [];
    
    return NextResponse.json({
      sampleDeals: deals.data,
      blueprint: bp,
      importantFields
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
