import { fetchAllActiveDeals } from '@/lib/zoho';
import { PrismaClient } from '@prisma/client';
import WeeklyReviewClient from './WeeklyReviewClient';

const prisma = new PrismaClient();

export default async function WeeklyReviewPage() {
  const opportunities = await fetchAllActiveDeals();
  
  // Group opportunities by salesperson
  const salesTeam = {};
  let totalPipeline = 0;

  opportunities.forEach(opp => {
    if (!salesTeam[opp.ownerId]) {
      salesTeam[opp.ownerId] = {
        name: opp.ownerId,
        deals: [],
        totalValue: 0
      };
    }
    salesTeam[opp.ownerId].deals.push(opp);
    salesTeam[opp.ownerId].totalValue += opp.expectedRevenue;
    totalPipeline += opp.expectedRevenue;
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
    return {
      ...person,
      percentageOfPipeline: Math.round((person.totalValue / (totalPipeline || 1)) * 100),
      savedQuestions: questions
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  return <WeeklyReviewClient teamArray={teamArray} />;
}
