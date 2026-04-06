import { NextResponse } from "next/server";

export async function GET() {
  const name = "Marcel";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mealplanner.app";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f5f5f4;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
    <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 8px;">MealPlanner</h1>
    <p style="color: #1c1917; font-size: 16px;">Hoi ${name}! 👋</p>
    <p style="color: #44403c; font-size: 15px; line-height: 1.6;">
      Het is zondag — tijd om je week voor te bereiden! We kunnen op basis van je voorkeuren en budget een weekmenu samenstellen en je boodschappenlijst vullen.
    </p>
    <a href="${appUrl}/planner"
       style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
      Plan mijn week
    </a>
    <p style="color: #a8a29e; font-size: 13px; margin-top: 32px;">
      Je ontvangt deze mail omdat je een MealPlanner account hebt.
    </p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
