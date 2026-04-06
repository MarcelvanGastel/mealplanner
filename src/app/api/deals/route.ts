import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

const budgetRecipesSchema = z.object({
  recipes: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      ingredients: z.array(z.string()),
      instructions: z.array(z.string()),
      estimated_cost: z.number(),
      prep_time: z.string(),
      servings: z.number(),
      nutrition: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
        fiber: z.number(),
        groente_fruit: z.number(),
        granen: z.number(),
        zuivel: z.number(),
        vis_vlees_ei: z.number(),
        smeer_kook: z.number(),
      }),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const { budget, people, days } = await req.json();
    const budgetPerMeal = (budget / (days * people)).toFixed(2);

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: budgetRecipesSchema,
      prompt: `Je bent een Nederlandse budgetkook-expert. Maak een weekmenu met recepten.

Vereisten:
- Totaal budget: €${budget} voor ${people} personen over ${days} dagen
- Dat is ~€${budgetPerMeal} per maaltijd per persoon
- Focus op betaalbare ingrediënten uit Nederlandse supermarkten (Albert Heijn, Jumbo, Lidl)
- Gebruik seizoensproducten en veelvoorkomende aanbiedingen
- Houd rekening met de Schijf van 5 richtlijnen
- Minimaal 250g groenten per persoon per dag
- Varieer in eiwitbronnen (peulvruchten, eieren, kip, vis)

Geef ${Math.min(days, 5)} recepten. Houd beschrijvingen en instructies kort.`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Deals error:", error);
    return NextResponse.json(
      { error: "Kon geen recepten genereren" },
      { status: 500 }
    );
  }
}
