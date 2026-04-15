// app/api/issues/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // <-- Updated to Promise
) {
  try {
    // Await the params before using them (Next.js 15+ requirement)
    const { id } = await params;

    await dbConnect();
    const body = await req.json();
    const { status, resolutionNotes } = body;

    const updatedIssue = await Issue.findByIdAndUpdate(
      id, // <-- Now using the awaited 'id'
      { $set: { status, ...(resolutionNotes && { resolutionNotes }) } },
      { new: true }
    );

    if (!updatedIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // --- TRIGGER SOCKET EVENT ---
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/socket/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: updatedIssue.reportedBy,
          issueId: updatedIssue._id,
          title: updatedIssue.title,
          status: updatedIssue.status,
        }),
      });
    } catch (socketError) {
      console.error('Socket broadcast failed (non-fatal):', socketError);
    }

    return NextResponse.json({ success: true, issue: updatedIssue }, { status: 200 });
  } catch (error: any) {
    console.error('Update issue error:', error);
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}