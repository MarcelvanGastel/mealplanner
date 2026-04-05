import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

const recipeSchema = z.object({
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
    const { image } = await req.json();

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: recipeSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyseer deze foto van een koelkast. Identificeer de ingrediënten die je ziet.
Bedenk 3 recepten die je kunt maken met deze ingrediënten.
Geef voor elk recept:
- Een Nederlandse titel
- Korte beschrijving
- Lijst ingrediënten (markeer welke al in de koelkast zitten)
- Stap-voor-stap bereiding
- Geschatte kosten in euro's (alleen voor ingrediënten die je moet bijkopen)
- Bereidingstijd
- Aantal personen
- Voedingswaarden inclusief Schijf van 5 porties (groente_fruit, granen, zuivel, vis_vlees_ei, smeer_kook)`,
            },
            {
              type: "image",
              image,
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("AI scan error:", error);
    return NextResponse.json(
      { error: "Kon de foto niet analyseren" },
      { status: 500 }
    );
  }
}
