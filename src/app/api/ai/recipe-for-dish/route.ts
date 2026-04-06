import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { dish, servings = 2 } = await req.json();

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: z.object({
        title: z.string(),
        description: z.string(),
        prep_time: z.string(),
        ingredients: z.array(
          z.object({
            item: z.string(),
            amount: z.string(),
          })
        ),
        instructions: z.array(z.string()),
        estimated_cost: z.number(),
      }),
      prompt: `Geef een recept voor "${dish}" voor ${servings} personen.
Geef een korte beschrijving, bereidingstijd, ingrediënten met hoeveelheden, stap-voor-stap bereiding, en geschatte kosten in euro's.
Gebruik Nederlandse ingrediëntnamen en gangbare hoeveelheden.
Houd het praktisch en realistisch.`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("AI recipe error:", error);
    return NextResponse.json(
      { error: "Kon geen recept genereren" },
      { status: 500 }
    );
  }
}
