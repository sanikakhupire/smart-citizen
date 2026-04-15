// app/api/analytics/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';

export async function GET() {
  try {
    await dbConnect();

    // 1. Status Distribution
    const statusRaw = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Map colors for the frontend pie chart
    const statusColors: Record<string, string> = {
      'resolved': '#22c55e', // green-500
      'in-progress': '#eab308', // yellow-500
      'pending': '#ef4444', // red-500
      'duplicate': '#94a3b8' // slate-400
    };

    const statusData = statusRaw.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      color: statusColors[item._id] || '#cbd5e1'
    }));

    // 2. Category Breakdown
    const categoryRaw = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryData = categoryRaw.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      count: item.count
    }));

    // 3. Timeline (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineRaw = await Issue.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          issues: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const timelineData = timelineRaw.map(item => ({
      date: item._id,
      issues: item.issues
    }));

    // Total Counts
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });

    return NextResponse.json({
      success: true,
      data: {
        totalIssues,
        resolvedIssues,
        resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
        statusData,
        categoryData,
        timelineData
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}