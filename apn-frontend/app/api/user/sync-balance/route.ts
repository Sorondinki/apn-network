import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, balance, isMining, miningStartTime } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400 }
      );
    }

    const parsedBalance = parseFloat(balance);
    const parsedStartTime = miningStartTime ? Number(miningStartTime) : null;

    // Fixed Table Name: "User" (Capitalized singular)
    // Fixed Column Names: camelCase matching Supabase schema
    const { data, error } = await supabase
      .from('User')
      .update({
        balance: parsedBalance,
        isMining: Boolean(isMining),
        miningStartTime: parsedStartTime,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Sync Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });

  } catch (error: any) {
    console.error("Sync Balance API Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}