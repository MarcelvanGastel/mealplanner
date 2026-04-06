import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, locale, weekDays } = await req.json();

    const daysContext = weekDays
      .map((d: { date: string; dayName: string }) => `${d.dayName} = ${d.date}`)
      .join(", ");

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: z.object({
        dish: z.string().describe("The dish/meal name extracted from the input"),
        date: z.string().describe("The date in yyyy-MM-dd format"),
        mealType: z.enum(["ontbijt", "lunch", "diner", "snack"]).describe("The meal type"),
        servings: z.number().describe("Number of servings"),
      }),
      prompt: `Extract the dish name, day, meal type and servings from this user input: "${text}"

Available days this week: ${daysContext}
Today is ${weekDays.find((d: { date: string; dayName: string }) => d.date === new Date().toISOString().split("T")[0])?.dayName || weekDays[0].dayName}.
User locale: ${locale}

Rules:
- If no day is mentioned, use today's date
- If no meal type is mentioned, default to "diner"
- If no servings mentioned, default to 2
- Extract just the dish name (e.g. "pasta carbonara", "stamppot boerenkool")
- "vandaag/today/heute/hoy/aujourd'hui" = today
- "morgen/tomorrow/morgen/demain/mañana" = tomorrow`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("AI parse error:", error);
    return NextResponse.json(
      { error: "Kon input niet verwerken" },
      { status: 500 }
    );
  }
}
