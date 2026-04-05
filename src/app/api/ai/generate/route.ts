import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mealType, date } = await req.json();

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        suggestions: z.array(z.string()).length(5),
      }),
      prompt: `Je bent een Nederlandse maaltijdplanner. Geef 5 suggesties voor ${mealType} op ${date}.
Houd rekening met het seizoen en Nederlandse eetgewoonten.
Geef alleen de naam van het gerecht, kort en bondig (max 4 woorden per suggestie).`,
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json(
      { error: "Kon geen suggesties genereren" },
      { status: 500 }
    );
  }
}
