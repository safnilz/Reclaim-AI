let accessToken = null;
let tokenExpiresAt = 0;

export async function getZohoAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';

  const url = `${accountsUrl}/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`;

  try {
    const response = await fetch(url, {
      method: 'POST',
    });

    const data = await response.json();

    if (data.error) {
      console.error('Error fetching Zoho Access Token:', data.error);
      throw new Error(`Zoho API Error: ${data.error}`);
    }

    accessToken = data.access_token;
    // Token usually expires in 3600 seconds (1 hour)
    tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

    return accessToken;
  } catch (error) {
    console.error('Failed to get Zoho Access Token:', error);
    throw error;
  }
}

export async function zohoApiRequest(endpoint, options = {}) {
  const token = await getZohoAccessToken();
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
  // Default to v6 API, can be overridden if needed
  const baseUrl = `${apiDomain}/crm/v6`;

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const defaultHeaders = {
    'Authorization': `Zoho-oauthtoken ${token}`,
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Zoho API Request Failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Zoho API Request Failed: ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Example Helper Functions
export async function getLeads() {
  return zohoApiRequest('/Leads?fields=Last_Name,First_Name,Email,Company');
}

export async function getContacts() {
  return zohoApiRequest('/Contacts?fields=Last_Name,First_Name,Email,Account_Name');
}

export async function getDeals() {
  return zohoApiRequest('/Deals?fields=Deal_Name,Amount,Stage,Closing_Date');
}

export async function fetchAllActiveDeals() {
  let allDeals = [];
  let pageToken = null;
  let hasMore = true;

  while (hasMore) {
    const url = `/Deals?fields=Deal_Name,Amount,Stage,Closing_Date,Next_Step,Modified_Time,Account_Name,Owner,Pipeline${pageToken ? `&page_token=${pageToken}` : ''}`;
    const data = await zohoApiRequest(url);
    
    if (data && data.data) {
      allDeals = allDeals.concat(data.data);
    }

    if (data && data.info && data.info.more_records) {
      pageToken = data.info.next_page_token;
    } else {
      hasMore = false;
    }
  }

  // Filter out closed deals (Closed Won / Closed Lost) and map to internal format
  // Additionally, ONLY include deals from 'ReClaim' or 'ReCoVa' pipelines
  const activeDeals = allDeals.filter(deal => {
    const isActive = deal.Stage !== 'Closed Won' && deal.Stage !== 'Closed Lost' && deal.Stage !== 'Closed - Lost to Competitor';
    const pipelineName = deal.Pipeline || '';
    const isTargetPipeline = pipelineName.includes('ReClaim') || pipelineName.includes('ReCoVa');
    const is2026 = deal.Closing_Date && deal.Closing_Date.startsWith('2026');
    
    return isActive && isTargetPipeline && is2026;
  });

  return activeDeals.map(deal => ({
    id: deal.id,
    dealName: deal.Deal_Name || 'Unnamed Deal',
    accountId: deal.Account_Name ? deal.Account_Name.id : null,
    accountName: deal.Account_Name ? deal.Account_Name.name : 'Unknown Account',
    ownerId: deal.Owner ? deal.Owner.name : 'Unknown',
    stage: deal.Stage || 'Unknown',
    expectedRevenue: deal.Amount || 0,
    estimatedDirectCost: null,
    grossMarginPercent: null,
    paymentTerms: null,
    closeDate: deal.Closing_Date ? `${deal.Closing_Date}T00:00:00Z` : null,
    nextAction: deal.Next_Step || null,
    nextActionDate: null,
    lastUpdated: deal.Modified_Time || new Date().toISOString(),
    decisionMaker: null,
    contactPerson: null,
    materialType: null,
    estimatedVolume: null,
  }));
}

export async function searchModule(module, criteria) {
  return zohoApiRequest(`/${module}/search?criteria=${criteria}`);
}
