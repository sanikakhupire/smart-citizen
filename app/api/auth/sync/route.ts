// app/api/auth/sync/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { firebaseUid, email, name } = await req.json();

    if (!firebaseUid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // Create new user in MongoDB
      user = await User.create({
        firebaseUid,
        email,
        name: name || 'Citizen', // Fallback name
        role: 'citizen', // Default role
      });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}