import { fetchAllActiveDeals, fetchCollectedRevenueThisWeekBySalesperson } from '@/lib/zoho';
import { calculateHygieneScore } from '@/lib/logic';
import { PrismaClient } from '@prisma/client';
import WeeklyReviewClient from './WeeklyReviewClient';

const prisma = new PrismaClient();

export default async function WeeklyReviewPage() {
  const allOpportunities = await fetchAllActiveDeals(true);
  const collectedThisWeek = await fetchCollectedRevenueThisWeekBySalesperson();
  
  const today = new Date();
  const dayOfWeek = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);
  
  // Group opportunities by salesperson
  const salesTeam = {};
  let totalPipeline = 0;

  allOpportunities.forEach(opp => {
    if (!salesTeam[opp.ownerId]) {
      salesTeam[opp.ownerId] = {
        name: opp.ownerId,
        deals: [],
        totalValue: 0,
        wonThisWeekCount: 0,
        wonThisWeekValue: 0,
        hygieneIssues: 0,
        totalActiveDeals: 0
      };
    }
    
    const isClosedWon = opp.stage === 'Closed Won' || opp.stage === 'Revenue Collected' || opp.stage === 'Job Completed';
    const isClosedLost = opp.stage === 'Closed Lost' || opp.stage === 'Closed - Lost to Competitor';
    
    if (isClosedWon) {
      if (opp.closeDate && new Date(opp.closeDate) >= monday) {
        salesTeam[opp.ownerId].wonThisWeekCount += 1;
        salesTeam[opp.ownerId].wonThisWeekValue += (opp.expectedRevenue || 0);
      }
    } else if (!isClosedLost) {
      // It's an active deal
      salesTeam[opp.ownerId].deals.push(opp);
      salesTeam[opp.ownerId].totalValue += (opp.expectedRevenue || 0);
      salesTeam[opp.ownerId].totalActiveDeals += 1;
      totalPipeline += (opp.expectedRevenue || 0);
      
      // Check CRM Hygiene using the universal logic
      const hygiene = calculateHygieneScore(opp);
      salesTeam[opp.ownerId].totalHygieneScore = (salesTeam[opp.ownerId].totalHygieneScore || 0) + hygiene.score;
      if (hygiene.score < 75) {
        salesTeam[opp.ownerId].hygieneIssues += 1;
      }
    }
  });

  // Fetch saved reviews from database
  const savedReviews = await prisma.weeklyReview.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Attach the latest saved questions to the salesperson
  const teamArray = Object.values(salesTeam).map(person => {
    const latestReview = savedReviews.find(r => r.salespersonName === person.name);
    let questions = [];
    if (latestReview) {
      try {
        questions = JSON.parse(latestReview.reviewContent);
      } catch (e) {}
    }
    
    const hygieneScore = person.totalActiveDeals > 0 
      ? Math.round((person.totalHygieneScore || 0) / person.totalActiveDeals) 
      : 100;
      
    return {
      ...person,
      percentageOfPipeline: Math.round((person.totalValue / (totalPipeline || 1)) * 100),
      collectedThisWeek: collectedThisWeek[person.name] || 0,
      hygieneScore,
      savedQuestions: questions
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  return <WeeklyReviewClient teamArray={teamArray} />;
}
