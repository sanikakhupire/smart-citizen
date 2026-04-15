// app/api/issues/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { getDistanceInMeters } from '@/utils/helpers';
import { analyzeIssueWithAI } from '@/utils/openai';

// ... (Keep your existing GET method) ...

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { title, description, category, imageUrl, location, reportedBy } = body;

    if (!title || !description || !imageUrl || !location || !reportedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- 1. PRE-FILTER: Find recent issues in the database ---
    // Look at issues from the last 14 days to check for duplicates
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentIssues = await Issue.find({
      createdAt: { $gte: twoWeeksAgo },
      status: { $ne: 'resolved' } // Don't flag as duplicate if the old issue is already fixed
    }).lean();

    // --- 2. GEOSPATIAL MATH: Filter issues within 200 meters ---
    const nearbyIssues = recentIssues.filter((issue: any) => {
      const distance = getDistanceInMeters(
        location.lat, location.lng, 
        issue.location.lat, issue.location.lng
      );
      return distance <= 200;
    }).map((issue: any) => ({
      _id: issue._id.toString(),
      title: issue.title,
      description: issue.description
    }));

    // --- 3. AI INTELLIGENCE: Analyze and deduplicate ---
    const aiAnalysis = await analyzeIssueWithAI(
      { title, description, category }, 
      nearbyIssues
    );

    // --- 4. SAVE TO MONGODB ---
    const newIssue = await Issue.create({
      title,
      description,
      category: aiAnalysis.category || category, // Override with AI categorization
      imageUrl,
      location,
      reportedBy,
      status: aiAnalysis.is_duplicate ? 'duplicate' : 'pending',
      priority: aiAnalysis.priority || 'medium',
      aiSuggestedSolution: aiAnalysis.suggested_solution,
      duplicateOf: aiAnalysis.is_duplicate ? aiAnalysis.duplicate_of : undefined,
    });

    return NextResponse.json({ 
      success: true, 
      issue: newIssue,
      aiInsights: aiAnalysis 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Issue creation error:', error);
    return NextResponse.json({ error: 'Failed to report issue' }, { status: 500 });
  }
}

// Add this below your existing POST method in app/api/issues/route.ts

export async function GET(req: Request) {
  try {
    await dbConnect();
    
    // Parse URL for potential query parameters (for future server-side filtering)
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    let query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (userId) query.reportedBy = userId;

    // Fetch issues, sorted by newest first
    const issues = await Issue.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, issues }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch issues error:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}