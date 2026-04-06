import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is vereist" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the requesting user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    // Get inviter's profile for the invite message
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const inviterName = profile?.display_name || "Iemand";

    // Send magic link invite
    await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          display_name: name,
          invited_by: user.id,
        },
        emailRedirectTo: `${req.headers.get("origin")}/auth/callback`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Kon uitnodiging niet versturen" },
      { status: 500 }
    );
  }
}
