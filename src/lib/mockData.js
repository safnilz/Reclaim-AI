import { subDays, addDays, formatISO } from 'date-fns';

const today = new Date();

export const stageProbabilities = {
  'Qualified Lead': 10,
  'Commercial Assessment': 20,
  'Route & Margin Approved': 40,
  'Proposal Submitted': 60,
  'Negotiation or Contracting': 75,
  'Contract Signed': 90,
  'Service Execution': 95,
  'Job Completed': 100,
  'Revenue Collected': 100,
  'Live / Active Account': 100,
  'Closed Lost': 0,
};

export const salespeople = [
  { id: 'u1', name: 'Jonathan Sale', role: 'Salesperson', target: 6000000 },
  { id: 'u2', name: 'Sarah Closer', role: 'Salesperson', target: 6000000 },
];

export const accounts = [
  { id: 'a1', name: 'TechCorp Industries', segment: 'Enterprise', approvedPaymentPeriod: 30, riskScore: 'Low', totalHistoricalRevenue: 450000 },
  { id: 'a2', name: 'Global Logistics LLC', segment: 'Mid-Market', approvedPaymentPeriod: 60, riskScore: 'Medium', totalHistoricalRevenue: 120000 },
  { id: 'a3', name: 'EcoRetail', segment: 'Enterprise', approvedPaymentPeriod: 30, riskScore: 'High', totalHistoricalRevenue: 85000 },
];

export const opportunities = [
  // 1. Perfectly Qualified Deal, high value
  {
    id: 'o1',
    dealName: 'TechCorp Annual Secure Destruction',
    accountId: 'a1',
    ownerId: 'u1',
    stage: 'Proposal/Price Quote',
    expectedRevenue: 350000,
    estimatedDirectCost: 140000,
    grossMarginPercent: 60, // (350-140)/350 = 60%
    paymentTerms: '30 Days',
    closeDate: formatISO(addDays(today, 5)),
    cashCollectionDate: formatISO(addDays(today, 35)),
    nextAction: 'Follow up on proposal feedback',
    nextActionDate: formatISO(addDays(today, 1)),
    lastUpdated: formatISO(subDays(today, 2)),
    decisionMaker: 'Jane Smith',
    contactPerson: 'John Doe',
    materialType: 'Electronic Waste',
    estimatedVolume: '5 Tons',
    poNumber: null,
    proposalStatus: 'Submitted',
    contractStatus: 'Pending',
    operationalFeasibility: 'High',
    collectionRisk: 'Low'
  },
  // 2. Needs Qualification (Missing Margin, Missing DM)
  {
    id: 'o2',
    dealName: 'Global Logistics Trading',
    accountId: 'a2',
    ownerId: 'u2',
    stage: 'Needs Analysis',
    expectedRevenue: 150000,
    estimatedDirectCost: null, // Missing cost -> missing margin
    grossMarginPercent: null,
    paymentTerms: '60 Days',
    closeDate: formatISO(addDays(today, 15)),
    cashCollectionDate: formatISO(addDays(today, 75)),
    nextAction: 'Site Visit',
    nextActionDate: formatISO(addDays(today, 4)),
    lastUpdated: formatISO(subDays(today, 5)),
    decisionMaker: null, // Missing
    contactPerson: 'Mike Johnson',
    materialType: 'Plastic',
    estimatedVolume: '10 Tons',
    poNumber: null,
    proposalStatus: 'Not Started',
    contractStatus: 'Not Started',
    operationalFeasibility: 'Medium',
    collectionRisk: 'Medium'
  },
  // 3. Stale Deal (Critical) - No update for 35 days, past close date
  {
    id: 'o3',
    dealName: 'EcoRetail Initial Setup',
    accountId: 'a3',
    ownerId: 'u1',
    stage: 'Identify Decision Makers',
    expectedRevenue: 80000,
    estimatedDirectCost: 40000,
    grossMarginPercent: 50,
    paymentTerms: '30 Days',
    closeDate: formatISO(subDays(today, 10)), // Overdue
    cashCollectionDate: null,
    nextAction: 'Call to find DM',
    nextActionDate: formatISO(subDays(today, 20)), // Overdue
    lastUpdated: formatISO(subDays(today, 35)), // Stale
    decisionMaker: null,
    contactPerson: 'Sarah Connor',
    materialType: 'Cardboard',
    estimatedVolume: '2 Tons',
    poNumber: null,
    proposalStatus: 'Not Started',
    contractStatus: 'Not Started',
    operationalFeasibility: 'Low',
    collectionRisk: 'High'
  },
  // 4. Low Margin - Needs Approval (15% Margin)
  {
    id: 'o4',
    dealName: 'TechCorp Low Margin Trading',
    accountId: 'a1',
    ownerId: 'u2',
    stage: 'Negotiation/Review',
    expectedRevenue: 500000,
    estimatedDirectCost: 425000,
    grossMarginPercent: 15, // Below 20%, needs CEO approval
    paymentTerms: '90 Days', // Above approved 30 days
    closeDate: formatISO(addDays(today, 2)),
    cashCollectionDate: formatISO(addDays(today, 92)),
    nextAction: 'Get CEO Approval',
    nextActionDate: formatISO(today),
    lastUpdated: formatISO(today),
    decisionMaker: 'Jane Smith',
    contactPerson: 'John Doe',
    materialType: 'Commodity Plastic',
    estimatedVolume: '100 Tons',
    poNumber: null,
    proposalStatus: 'Submitted',
    contractStatus: 'Drafted',
    operationalFeasibility: 'High',
    collectionRisk: 'Medium'
  },
  // 5. Unqualified Deal
  {
    id: 'o5',
    dealName: 'Unknown Logistics Lead',
    accountId: 'a2',
    ownerId: 'u1',
    stage: 'Qualification',
    expectedRevenue: null, // Unqualified
    estimatedDirectCost: null,
    grossMarginPercent: null,
    paymentTerms: null,
    closeDate: null,
    cashCollectionDate: null,
    nextAction: null, // No next action
    nextActionDate: null,
    lastUpdated: formatISO(subDays(today, 2)),
    decisionMaker: null,
    contactPerson: null,
    materialType: null,
    estimatedVolume: null,
    poNumber: null,
    proposalStatus: 'Not Started',
    contractStatus: 'Not Started',
    operationalFeasibility: 'Unknown',
    collectionRisk: 'Unknown'
  },
];
