import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, isMining, miningStartTime } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    // 1. Nemo ainihin balance na yanzu daga database
    const { data: user, error: fetchErr } = await supabase
      .from('User')
      .select('balance, miningSpeed')
      .eq('id', userId)
      .single();

    if (fetchErr || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 2. Ƙara mining increment kawai (misali na daƙiƙa 10) maimakon overwrite
    const speed = Number(user.miningSpeed || 0.5);
    const earnedIn10Sec = (speed / 3600) * 10;
    const updatedBalance = Number(user.balance || 0) + (isMining ? earnedIn10Sec : 0);

    const parsedStartTime = miningStartTime ? Number(miningStartTime) : null;

    const { data, error } = await supabase
      .from('User')
      .update({
        balance: updatedBalance,
        isMining: Boolean(isMining),
        miningStartTime: parsedStartTime,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('balance, isMining')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Mayar da sabon balance ɗin zuwa ga frontend domin ya yi daidai da database
    return NextResponse.json({ success: true, balance: data.balance });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
