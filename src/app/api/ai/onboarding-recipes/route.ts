import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { diet, allergies } = await req.json();

    const allergyText = allergies.length > 0
      ? `Vermijd allergenen: ${allergies.join(", ")}.`
      : "";
    const dietText = diet !== "geen"
      ? `Dieet: ${diet}.`
      : "";

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: z.object({
        recipes: z.array(
          z.object({
            title: z.string(),
            emoji: z.string(),
            tags: z.array(z.string()).length(2),
          })
        ).length(12),
      }),
      prompt: `Geef 12 populaire gerechten die Nederlanders vaak eten, als smaakprofiel-selectie.
${dietText} ${allergyText}
Mix van keukens: Hollands, Italiaans, Aziatisch, Mexicaans, Midden-Oosten, etc.
Mix van typen: pasta, rijst, aardappel, salade, soep, ovenschotel, etc.
Geef per recept een passende emoji en 2 korte tags (bijv. "Italiaans", "Pasta").
Houd titels kort (max 4 woorden).`,
    });

    return NextResponse.json(object);
  } catch {
    return NextResponse.json({ recipes: [] });
  }
}
