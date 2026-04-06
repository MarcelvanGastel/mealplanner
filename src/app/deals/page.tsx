"use client";

import { useState } from "react";
import { Search, Loader2, Tag, ShoppingCart } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

export default function DealsPage() {
  const { t } = useI18n();
  const [budget, setBudget] = useState("25");
  const [people, setPeople] = useState("2");
  const [days, setDays] = useState("7");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  async function findDeals() {
    setLoading(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: parseFloat(budget),
          people: parseInt(people),
          days: parseInt(days),
        }),
      });
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-2">{t.dealsTitle}</h1>
      <p className="text-sm text-muted mb-6">{t.dealsSubtitle}</p>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">
              {t.dealsBudget}
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">{t.dealsPersons}</label>
            <input
              type="number"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">{t.dealsDays}</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={findDeals}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t.dealsSearching}
            </>
          ) : (
            <>
              <Search size={18} />
              {t.dealsSearch}
            </>
          )}
        </button>
      </div>

      {recipes.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <Tag size={18} className="text-primary" />
            {recipes.length} {t.dealsFound}
          </h2>
          {recipes.map((recipe, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{recipe.title}</h3>
                  <p className="text-sm text-muted mt-1">
                    {recipe.description}
                  </p>
                </div>
                {recipe.estimated_cost && (
                  <span className="shrink-0 rounded-full bg-primary-light/30 px-3 py-1 text-sm font-semibold text-primary">
                    €{recipe.estimated_cost.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {recipe.ingredients.map((ing, j) => (
                  <span
                    key={j}
                    className="rounded-full bg-background border border-border px-2 py-0.5 text-xs text-muted"
                  >
                    {ing}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex gap-4 text-xs text-muted">
                {recipe.prep_time && <span>{recipe.prep_time}</span>}
                <span>{recipe.servings} {t.persons}</span>
              </div>

              <button className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline">
                <ShoppingCart size={14} />
                {t.dealsAddToPlanner}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
