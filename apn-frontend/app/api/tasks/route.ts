import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 1. Karɓo ayyukan da ke raye (Active Tasks) da status ɗinsu
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Karɓo ayyuka daga teburin 'Task'
    const { data: tasks, error: taskErr } = await supabase
      .from("Task")
      .select("*")
      .eq("isActive", true)
      .order("createdAt", { ascending: false });

    if (taskErr) throw taskErr;

    // Karɓo ayyukan da wannan mai amfani (user) ya riga ya kammala
    let completedTaskIds: string[] = [];
    if (userId) {
      const { data: completions } = await supabase
        .from("UserTaskCompletion")
        .select("taskId")
        .eq("userId", userId);

      if (completions) {
        completedTaskIds = completions.map((c) => c.taskId);
      }
    }

    const formattedTasks = (tasks || []).map((t) => ({
      ...t,
      isCompleted: completedTaskIds.includes(t.id),
    }));

    return NextResponse.json({ success: true, tasks: formattedTasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. Sarrafa Wallafa Sabon Task (Admin) KO Kammala Task/Claim Reward (User)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // HANYA A: WALFA SABON TASK (ADMIN / FOUNDER ACTION)
    if (body.title && body.link !== undefined) {
      const { title, description, reward, link, category } = body;

      if (!title || reward === undefined || reward === null || !link) {
        return NextResponse.json(
          { success: false, error: "Tabbatar ka shigar da Title, Reward amount, da Task Link URL daidai." },
          { status: 400 }
        );
      }

      const numericReward = parseFloat(String(reward));
      if (isNaN(numericReward)) {
        return NextResponse.json(
          { success: false, error: "Lambar Reward ba daidai take ba." },
          { status: 400 }
        );
      }

      const { data: newTask, error } = await supabase
        .from("Task")
        .insert([
          {
            title: String(title).trim(),
            description: description ? String(description).trim() : "",
            reward: numericReward,
            link: String(link).trim(),
            category: category || "GENERAL",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "An wallafa sabon Task cikin nasara! 🚀",
        task: newTask,
      });
    }

    // HANYA B: KAMMALA TASK DA KARBA LADA (USER CLAIM REWARD)
    const { userId, taskId } = body;

    if (!userId || !taskId) {
      return NextResponse.json(
        { success: false, error: "User ID da Task ID suna da buƙata." },
        { status: 400 }
      );
    }

    // Direct Check: Tabbatar idan mutum bai riga ya yi aikin ba
    const { data: existing } = await supabase
      .from("UserTaskCompletion")
      .select("id")
      .eq("userId", userId)
      .eq("taskId", taskId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Tuntuni ka riga ka kammala wannan aikin." },
        { status: 400 }
      );
    }

    // Karɓo bayanin aikin daga teburin 'Task'
    const { data: task, error: taskErr } = await supabase
      .from("Task")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskErr || !task || !task.isActive) {
      return NextResponse.json(
        { success: false, error: "Ba a samu wannan aikin ba ko kuma an kashe shi." },
        { status: 404 }
      );
    }

    const rewardAmount = parseFloat(String(task.reward || "0"));

    // Yi rikodin a teburin UserTaskCompletion
    const { error: completionErr } = await supabase.from("UserTaskCompletion").insert({
      userId,
      taskId,
      status: "COMPLETED",
    });

    if (completionErr) throw completionErr;

    // Sakawa mutum APN Reward ɗinsa a teburin Transaction
    const { error: txErr } = await supabase.from("Transaction").insert({
      userId,
      amount: rewardAmount,
      type: "TASK_REWARD",
      description: `Task Completed: ${task.title}`,
    });

    if (txErr) throw txErr;

    return NextResponse.json({
      success: true,
      message: `An kammala aikin cikin nasara! Ka samu +${rewardAmount} APN.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
