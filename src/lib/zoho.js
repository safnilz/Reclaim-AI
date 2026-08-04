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

export const excludedStages = ['Closed Won', 'Revenue Collected', 'Closed Lost', 'Closed - Lost to Competitor', 'Job Completed'];

export async function fetchAllActiveDeals(includeClosed = false) {
  let allDeals = [];
  let pageToken = null;
  let hasMore = true;
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';

  while (hasMore) {
    const url = `/Deals?fields=Deal_Name,Amount,Stage,Closing_Date,Next_Step,Modified_Time,Account_Name,Owner,Pipeline,Estimated_Revenue,Next_action,Next_action_date,Estimated_direct_cost,Proposal_Sent_Date,Decision_maker,Expected_close_date,Key_Objection_Open_Issue`;
    const data = await zohoApiRequest(url + (pageToken ? `&page_token=${pageToken}` : ''));
    
    if (data && data.data) {
      allDeals = allDeals.concat(data.data);
    }

    if (data && data.info && data.info.more_records) {
      pageToken = data.info.next_page_token;
    } else {
      hasMore = false;
    }
  }

  // Filter out closed deals unless includeClosed is true
  const activeDeals = allDeals.filter(deal => {
    const isActive = includeClosed || !excludedStages.includes(deal.Stage);
    const pipelineName = deal.Pipeline || '';
    const isTargetPipeline = pipelineName.includes('ReClaim') || pipelineName.includes('ReCoVa');
    const is2026 = deal.Closing_Date && deal.Closing_Date.startsWith('2026');
    const ownerName = deal.Owner ? deal.Owner.name : '';
    const isValidOwner = !ownerName.includes('Katherine') && !ownerName.includes('Aliyu');
    
    return isActive && isTargetPipeline && is2026 && isValidOwner;
  });

  return activeDeals.map(deal => ({
    id: deal.id,
    dealName: deal.Deal_Name || 'Unnamed Deal',
    accountId: deal.Account_Name ? deal.Account_Name.id : null,
    accountName: deal.Account_Name ? deal.Account_Name.name : 'Unknown Account',
    ownerId: deal.Owner ? deal.Owner.name : 'Unknown',
    pipeline: deal.Pipeline || 'Unknown',
    stage: deal.Stage || 'Unknown',
    expectedRevenue: deal.Estimated_Revenue || deal.Amount || 0,
    estimatedDirectCost: deal.Estimated_direct_cost || null,
    grossMarginPercent: null,
    paymentTerms: null,
    closeDate: deal.Expected_close_date ? `${deal.Expected_close_date}T00:00:00Z` : (deal.Closing_Date ? `${deal.Closing_Date}T00:00:00Z` : null),
    nextAction: deal.Next_action || deal.Next_Step || null,
    nextActionDate: deal.Next_action_date ? `${deal.Next_action_date}T00:00:00Z` : null,
    lastUpdated: deal.Modified_Time || new Date().toISOString(),
    decisionMaker: deal.Decision_maker || null,
    contactPerson: null,
    materialType: null,
    estimatedVolume: null,
    proposalSentDate: deal.Proposal_Sent_Date ? `${deal.Proposal_Sent_Date}T00:00:00Z` : null,
    keyObjectionOpenIssue: deal.Key_Objection_Open_Issue || null
  }));
}

export async function searchModule(module, criteria) {
  return zohoApiRequest(`/${module}/search?criteria=${criteria}`);
}

// ZOHO BOOKS INTEGRATION
const booksClientId = process.env.ZOHO_BOOKS_CLIENT_ID;
const booksClientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET;
const booksRefreshToken = process.env.ZOHO_BOOKS_REFRESH_TOKEN;
const booksOrgId = process.env.ZOHO_BOOKS_ORG_ID;

// Helper to fetch all invoices with basic caching (1 hour)
async function _fetchAllBooksInvoices() {
  const tokenUrl = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${booksRefreshToken}&client_id=${booksClientId}&client_secret=${booksClientSecret}&grant_type=refresh_token`;
  
  try {
    const tokenRes = await fetch(tokenUrl, { method: 'POST', cache: 'no-store' });
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error('Failed to get Zoho Books token:', tokenData.error);
      return [];
    }
    
    const accessToken = tokenData.access_token;
    
    let hasMore = true;
    let page = 1;
    let allInvoices = [];
    
    while(hasMore) {
      const invoicesUrl = `https://www.zohoapis.com/books/v3/invoices?organization_id=${booksOrgId}&page=${page}`;
      const headers = { 'Authorization': `Zoho-oauthtoken ${accessToken}` };
      // Cache this massive payload for 1 hour to prevent rate limits during forecasting
      const invoicesRes = await fetch(invoicesUrl, { headers, next: { revalidate: 3600 } });
      const invoicesData = await invoicesRes.json();
      
      if (invoicesData.invoices) {
        allInvoices = allInvoices.concat(invoicesData.invoices);
      }
      
      if (invoicesData.page_context && invoicesData.page_context.has_more_page) {
        page++;
      } else {
        hasMore = false;
      }
    }
    
    return allInvoices;
  } catch (err) {
    console.error('Error fetching from Zoho Books:', err);
    return [];
  }
}

export async function fetchCollectedRevenueBySalesperson() {
  const allInvoices = await _fetchAllBooksInvoices();
  
  const collectedBySalesperson = {};
  allInvoices.forEach(inv => {
    const sp = inv.salesperson_name || 'Unknown';
    const collected = (inv.total || 0) - (inv.balance || 0);
    if (collected > 0) {
      if (!collectedBySalesperson[sp]) {
        collectedBySalesperson[sp] = 0;
      }
      collectedBySalesperson[sp] += collected;
    }
  });
  
  return collectedBySalesperson;
}

export async function fetchUnpaidInvoices() {
  const allInvoices = await _fetchAllBooksInvoices();
  
  const unpaid = allInvoices.filter(i => (i.balance || 0) > 0 && i.status !== 'void');
  
  return unpaid.map(inv => ({
    id: inv.invoice_id,
    number: inv.invoice_number,
    customerName: inv.customer_name,
    dueDate: inv.due_date,
    balance: inv.balance
  }));
}

export async function fetchCustomerInvoiceHistory() {
  const allInvoices = await _fetchAllBooksInvoices();
  
  const customerHistory = {};
  
  allInvoices.forEach(inv => {
    if (inv.status === 'void') return;
    
    const custId = inv.customer_id;
    if (!customerHistory[custId]) {
      customerHistory[custId] = {
        customerId: custId,
        customerName: inv.customer_name,
        invoices: []
      };
    }
    customerHistory[custId].invoices.push({
      date: inv.date,
      total: inv.total || 0
    });
  });
  
  return Object.values(customerHistory);
}
