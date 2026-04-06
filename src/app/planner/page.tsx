"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { nl as nlLocale } from "date-fns/locale";
import { de as deLocale } from "date-fns/locale";
import { fr as frLocale } from "date-fns/locale";
import { es as esLocale } from "date-fns/locale";
import { enUS as enLocale } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Check,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import type { Meal, MealType } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { VoiceInput } from "@/components/voice-input";

const DATE_LOCALES: Record<Locale, typeof nlLocale> = {
  nl: nlLocale,
  en: enLocale,
  de: deLocale,
  fr: frLocale,
  es: esLocale,
};

interface RecipeIngredient {
  item: string;
  amount: string;
}

export default function PlannerPage() {
  const { t, locale } = useI18n();
  const dateLocale = DATE_LOCALES[locale];

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [meals, setMeals] = useState<Meal[]>([]);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [editingIngredients, setEditingIngredients] = useState<string | null>(null);
  const [tempIngredients, setTempIngredients] = useState<string[]>([]);

  // Voice + text input
  const [inputText, setInputText] = useState("");
  const [processing, setProcessing] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE", { locale: dateLocale }),
      label: format(date, "EEE d MMM", { locale: dateLocale }),
      isToday: isToday(date),
    };
  });

  const fetchMeals = useCallback(async () => {
    const supabase = createClient();
    const start = format(currentWeekStart, "yyyy-MM-dd");
    const end = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

    const { data } = await supabase
      .from("meals")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date")
      .order("meal_type");

    if (data) setMeals(data as Meal[]);
  }, [currentWeekStart]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  async function handleVoiceResult(text: string) {
    setInputText(text);
    await processInput(text);
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;
    await processInput(inputText);
  }

  async function processInput(text: string) {
    setProcessing(true);

    try {
      // Step 1: Parse the input to extract day + dish
      const parseRes = await fetch("/api/ai/parse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          locale,
          weekDays: weekDays.map((d) => ({
            date: d.date,
            dayName: d.dayName,
          })),
        }),
      });
      const parsed = await parseRes.json();

      if (parsed.error) {
        setProcessing(false);
        return;
      }

      // Step 2: Get recipe for the dish
      const recipeRes = await fetch("/api/ai/recipe-for-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dish: parsed.dish,
          servings: parsed.servings || 2,
        }),
      });
      const recipe = await recipeRes.json();

      if (recipe.error) {
        setProcessing(false);
        return;
      }

      // Step 3: Save to database
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from("meals").insert({
          user_id: user.id,
          date: parsed.date,
          meal_type: parsed.mealType || "diner",
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients.map(
            (i: RecipeIngredient) => `${i.amount} ${i.item}`
          ),
          instructions: recipe.instructions,
          estimated_cost: recipe.estimated_cost,
        });

        await fetchMeals();
      }

      setInputText("");
    } catch {
      // ignore
    }

    setProcessing(false);
  }

  async function deleteMeal(id: string) {
    const supabase = createClient();
    await supabase.from("meals").delete().eq("id", id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
    if (expandedMeal === id) setExpandedMeal(null);
  }

  function startEditIngredients(meal: Meal) {
    setEditingIngredients(meal.id);
    setTempIngredients([...meal.ingredients]);
  }

  async function saveIngredients(mealId: string) {
    const supabase = createClient();
    const filtered = tempIngredients.filter((i) => i.trim());
    await supabase
      .from("meals")
      .update({ ingredients: filtered })
      .eq("id", mealId);

    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId ? { ...m, ingredients: filtered } : m
      )
    );
    setEditingIngredients(null);
  }

  async function addToShoppingList(meal: Meal) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !meal.ingredients.length) return;

    const items = meal.ingredients.map((item) => ({
      user_id: user.id,
      item,
      checked: false,
    }));

    await supabase.from("shopping_list").insert(items);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentWeekStart((d) => addDays(d, -7))}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">
          {t.plannerWeekOf}{" "}
          {format(currentWeekStart, "d MMMM", { locale: dateLocale })}
        </h1>
        <button
          onClick={() => setCurrentWeekStart((d) => addDays(d, 7))}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Voice + text input area */}
      <div className="rounded-2xl border border-border bg-card p-4 mb-6">
        <form onSubmit={handleTextSubmit} className="flex gap-3 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.plannerVoicePlaceholder}
            disabled={processing}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
          />
          <VoiceInput onResult={handleVoiceResult} disabled={processing} />
        </form>

        {processing && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" />
            {t.plannerProcessing}
          </div>
        )}
      </div>

      {/* Week overview */}
      <div className="space-y-3">
        {weekDays.map((day) => {
          const dayMeals = meals.filter((m) => m.date === day.date);
          return (
            <div
              key={day.date}
              className={`rounded-2xl border overflow-hidden ${
                day.isToday
                  ? "border-primary bg-primary-light/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="px-4 py-3">
                <h2
                  className={`text-sm font-semibold capitalize ${
                    day.isToday ? "text-primary" : "text-muted"
                  }`}
                >
                  {day.label}
                  {day.isToday && (
                    <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                      {t.plannerToday}
                    </span>
                  )}
                </h2>
              </div>

              {dayMeals.length === 0 ? (
                <div className="px-4 pb-3">
                  <p className="text-xs text-muted">{t.plannerEmpty}</p>
                </div>
              ) : (
                <div>
                  {dayMeals.map((meal) => {
                    const isExpanded = expandedMeal === meal.id;
                    const isEditing = editingIngredients === meal.id;

                    return (
                      <div key={meal.id} className="border-t border-border">
                        {/* Meal header */}
                        <button
                          onClick={() =>
                            setExpandedMeal(isExpanded ? null : meal.id)
                          }
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-background/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider text-muted font-medium">
                                {t.plannerMealTypes[meal.meal_type]}
                              </span>
                              {meal.estimated_cost && (
                                <span className="text-[10px] text-primary font-medium">
                                  €{meal.estimated_cost.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium truncate mt-0.5">
                              {meal.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMeal(meal.id);
                              }}
                              className="p-1.5 text-muted hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                            {isExpanded ? (
                              <ChevronUp size={16} className="text-muted" />
                            ) : (
                              <ChevronDown size={16} className="text-muted" />
                            )}
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3">
                            {meal.description && (
                              <p className="text-xs text-muted">
                                {meal.description}
                              </p>
                            )}

                            {/* Ingredients */}
                            {meal.ingredients.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                                    {t.plannerIngredients}
                                  </h4>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() =>
                                        addToShoppingList(meal)
                                      }
                                      className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                                    >
                                      <ShoppingCart size={12} />
                                      {t.plannerAddToList}
                                    </button>
                                    {!isEditing && (
                                      <button
                                        onClick={() =>
                                          startEditIngredients(meal)
                                        }
                                        className="p-1 text-muted hover:text-primary"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className="space-y-1.5">
                                    {tempIngredients.map((ing, idx) => (
                                      <div
                                        key={idx}
                                        className="flex gap-1.5 items-center"
                                      >
                                        <input
                                          type="text"
                                          value={ing}
                                          onChange={(e) => {
                                            const next = [...tempIngredients];
                                            next[idx] = e.target.value;
                                            setTempIngredients(next);
                                          }}
                                          className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                                        />
                                        <button
                                          onClick={() =>
                                            setTempIngredients((prev) =>
                                              prev.filter((_, i) => i !== idx)
                                            )
                                          }
                                          className="p-1 text-muted hover:text-red-500"
                                        >
                                          <Minus size={12} />
                                        </button>
                                      </div>
                                    ))}
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() =>
                                          setTempIngredients((prev) => [
                                            ...prev,
                                            "",
                                          ])
                                        }
                                        className="flex items-center gap-1 text-xs text-primary"
                                      >
                                        <Plus size={12} />
                                        {t.add}
                                      </button>
                                      <div className="flex-1" />
                                      <button
                                        onClick={() =>
                                          setEditingIngredients(null)
                                        }
                                        className="p-1.5 text-muted hover:text-foreground"
                                      >
                                        <X size={14} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          saveIngredients(meal.id)
                                        }
                                        className="p-1.5 text-primary hover:text-primary/80"
                                      >
                                        <Check size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <ul className="space-y-0.5">
                                    {meal.ingredients.map((ing, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-foreground/80 flex items-start gap-1.5"
                                      >
                                        <span className="text-muted mt-0.5">
                                          •
                                        </span>
                                        {ing}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {/* Instructions */}
                            {meal.instructions.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                                  {t.plannerInstructions}
                                </h4>
                                <ol className="space-y-1 list-decimal list-inside">
                                  {meal.instructions.map((step, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-foreground/80"
                                    >
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
