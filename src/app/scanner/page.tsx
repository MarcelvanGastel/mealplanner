"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

export default function ScannerPage() {
  const { t } = useI18n();
  const [image, setImage] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImage(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImage(base64);
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/ai/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        setRecipes(data.recipes || []);
      } catch {
        setError(t.scannerError);
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-2">{t.scannerTitle}</h1>
      <p className="text-sm text-muted mb-6">{t.scannerSubtitle}</p>

      {!image ? (
        <div className="space-y-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border p-12 hover:border-primary transition-colors"
          >
            <Camera size={48} className="text-muted" />
            <span className="text-muted">{t.scannerPrompt}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImage(file);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white"
          >
            <Upload size={18} />
            {t.scannerUpload}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={image}
              alt="Fridge"
              className="w-full h-48 object-cover"
            />
            <button
              onClick={() => {
                setImage(null);
                setRecipes([]);
              }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full px-3 py-1 text-sm"
            >
              {t.scannerRetry}
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted">
              <Loader2 size={20} className="animate-spin" />
              {t.scannerAnalyzing}
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {recipes.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">{t.scannerResults}</h2>
              {recipes.map((recipe, i) => (
                <RecipeCard key={i} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
      >
        <h3 className="font-semibold">{recipe.title}</h3>
        <p className="text-sm text-muted mt-1">{recipe.description}</p>
        <div className="flex gap-4 mt-2 text-xs text-muted">
          {recipe.prep_time && <span>{recipe.prep_time}</span>}
          {recipe.estimated_cost && (
            <span>~€{recipe.estimated_cost.toFixed(2)}</span>
          )}
          <span>{recipe.servings} {t.persons}</span>
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">{t.scannerIngredients}</h4>
            <ul className="text-sm text-muted space-y-0.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>• {ing}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">{t.scannerInstructions}</h4>
            <ol className="text-sm text-muted space-y-1 list-decimal list-inside">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
