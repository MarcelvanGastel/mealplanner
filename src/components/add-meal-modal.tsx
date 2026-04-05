"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Sparkles } from "lucide-react";
import type { MealType } from "@/lib/types";
import { MEAL_TYPE_LABELS } from "@/lib/types";

interface AddMealModalProps {
  date: string;
  mealType: MealType;
  onClose: () => void;
  onSaved: () => void;
}

export function AddMealModal({
  date,
  mealType,
  onClose,
  onSaved,
}: AddMealModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("meals").insert({
        user_id: user.id,
        date,
        meal_type: mealType,
        title: title.trim(),
        description: description.trim() || null,
      });
    }
    setLoading(false);
    onSaved();
  }

  async function generateSuggestions() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, date }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      // ignore
    }
    setAiLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">
            {MEAL_TYPE_LABELS[mealType]} toevoegen
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Wat ga je eten?"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notities (optioneel)"
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />

        <button
          onClick={generateSuggestions}
          disabled={aiLoading}
          className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
        >
          <Sparkles size={16} />
          {aiLoading ? "AI denkt na..." : "AI suggesties"}
        </button>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setTitle(s)}
                className="rounded-full bg-primary-light/30 px-3 py-1 text-sm text-primary hover:bg-primary-light/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading || !title.trim()}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </div>
  );
}
