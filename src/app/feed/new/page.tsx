"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewRecipePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
    prep_time: "",
    servings: "2",
    estimated_cost: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    await supabase.from("recipes").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      ingredients: form.ingredients
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      instructions: form.instructions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      prep_time: form.prep_time || null,
      servings: parseInt(form.servings) || 2,
      estimated_cost: form.estimated_cost
        ? parseFloat(form.estimated_cost)
        : null,
      is_public: true,
    });

    setLoading(false);
    router.push("/feed");
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/feed" className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Recept delen</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">Titel *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Bijv. Pasta Pesto met Kip"
            required
            className="w-full rounded-xl border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Beschrijving</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Kort verhaal over dit recept..."
            rows={2}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Ingrediënten (1 per regel)
          </label>
          <textarea
            value={form.ingredients}
            onChange={(e) => update("ingredients", e.target.value)}
            placeholder={"200g pasta\n1 potje pesto\n2 kipfilets\nHandje pijnboompitten"}
            rows={5}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Bereiding (1 stap per regel)
          </label>
          <textarea
            value={form.instructions}
            onChange={(e) => update("instructions", e.target.value)}
            placeholder={"Kook de pasta\nBak de kip goudbruin\nMeng alles met pesto"}
            rows={5}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">Bereidingstijd</label>
            <input
              type="text"
              value={form.prep_time}
              onChange={(e) => update("prep_time", e.target.value)}
              placeholder="30 min"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Personen</label>
            <input
              type="number"
              value={form.servings}
              onChange={(e) => update("servings", e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Kosten (€)</label>
            <input
              type="number"
              step="0.01"
              value={form.estimated_cost}
              onChange={(e) => update("estimated_cost", e.target.value)}
              placeholder="5.00"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.title.trim()}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Publiceren..." : "Publiceer recept"}
        </button>
      </form>
    </div>
  );
}
