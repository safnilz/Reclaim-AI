import { differenceInDays } from 'date-fns';
import { stageProbabilities } from './mockData';

export function calculateQualificationScore(opportunity) {
  const mandatoryFields = [
    'name', 'accountId', 'ownerId', 'expectedRevenue', 'closeDate', 'nextAction'
  ];
  
  let score = 0;
  let missingFields = [];
  
  mandatoryFields.forEach(field => {
    if (opportunity[field] !== null && opportunity[field] !== undefined && opportunity[field] !== '') {
      score += 1;
    } else {
      missingFields.push(field);
    }
  });

  const percentage = Math.round((score / mandatoryFields.length) * 100);
  
  let status = 'Unqualified';
  if (percentage === 100) status = 'Qualified';
  else if (percentage >= 50) status = 'Needs Qualification';

  return { percentage, missingFields, status };
}

export function detectStaleDeal(opportunity) {
  const today = new Date();
  const lastUpdated = new Date(opportunity.lastUpdated);
  const nextActionDate = opportunity.nextActionDate ? new Date(opportunity.nextActionDate) : null;
  const closeDate = opportunity.closeDate ? new Date(opportunity.closeDate) : null;

  const daysSinceUpdate = differenceInDays(today, lastUpdated);
  const isOverdueNextAction = nextActionDate ? differenceInDays(today, nextActionDate) > 0 : true;
  const isPassedCloseDate = closeDate ? differenceInDays(today, closeDate) > 0 : false;

  let severity = 'None';
  let reason = '';

  if (isPassedCloseDate && daysSinceUpdate > 14) {
    severity = 'Critical';
    reason = 'Passed closing date and no update > 14 days.';
  } else if (daysSinceUpdate > 30 || (isOverdueNextAction && daysSinceUpdate > 7)) {
    severity = 'High';
    reason = 'No update > 30 days OR overdue next action.';
  } else if (daysSinceUpdate > 14) {
    severity = 'Medium';
    reason = 'No update for > 14 days.';
  } else if (daysSinceUpdate > 7) {
    severity = 'Low';
    reason = 'No update for > 7 days.';
  }

  return { isStale: severity !== 'None', severity, reason, daysSinceUpdate };
}

export function calculateHygieneScore(opportunity) {
  let score = 100;
  const { status, missingFields } = calculateQualificationScore(opportunity);
  
  if (missingFields.includes('nextAction')) score -= 10;
  if (missingFields.includes('closeDate')) score -= 10;
  if (missingFields.includes('accountId')) score -= 5;
  if (missingFields.includes('ownerId')) score -= 5;
  
  const closeDateObj = opportunity.closeDate ? new Date(opportunity.closeDate) : null;
  if (closeDateObj && differenceInDays(new Date(), closeDateObj) > 0) score -= 10;

  let category = 'High Risk';
  if (score >= 90) category = 'Excellent';
  else if (score >= 75) category = 'Good';
  else if (score >= 60) category = 'Needs Improvement';

  return { score, category };
}

export function calculateDashboardKPIs(opportunities) {
  let totalPipeline = 0;
  let qualifiedPipeline = 0;
  let weightedPipeline = 0;

  opportunities.forEach(opp => {
    const value = opp.expectedRevenue || 0;
    const { status } = calculateQualificationScore(opp);
    const prob = stageProbabilities[opp.stage] || 0;

    totalPipeline += value;
    if (status === 'Qualified') {
      qualifiedPipeline += value;
    }
    weightedPipeline += value * (prob / 100);
  });

  return { totalPipeline, qualifiedPipeline, weightedPipeline };
}
