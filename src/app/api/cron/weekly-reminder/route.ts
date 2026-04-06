import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all users who completed onboarding
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("onboarding_completed", true);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Get emails from auth.users
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userEmails = new Map(users.map((u) => [u.id, u.email]));

  let sent = 0;

  for (const profile of profiles) {
    const email = userEmails.get(profile.id);
    if (!email) continue;

    const name = profile.display_name || email.split("@")[0];

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY!,
        },
        body: JSON.stringify({
          sender: {
            name: process.env.EMAIL_FROM_NAME || "MealPlanner",
            email: process.env.EMAIL_FROM_ADDRESS || "noreply@mealplanner.app",
          },
          to: [{ email, name }],
          subject: "Zullen we je boodschappenlijst maken? 🛒",
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
              <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 8px;">MealPlanner</h1>
              <p style="color: #1c1917; font-size: 16px;">Hoi ${name}! 👋</p>
              <p style="color: #44403c; font-size: 15px; line-height: 1.6;">
                Het is zondag — tijd om je week voor te bereiden! We kunnen op basis van je voorkeuren en budget een weekmenu samenstellen en je boodschappenlijst vullen.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://mealplanner.app"}/planner"
                 style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
                Plan mijn week
              </a>
              <p style="color: #a8a29e; font-size: 13px; margin-top: 32px;">
                Je ontvangt deze mail omdat je een MealPlanner account hebt.
              </p>
            </div>
          `,
        }),
      });
      sent++;
    } catch {
      // Continue with next user
    }
  }

  return NextResponse.json({ sent });
}
