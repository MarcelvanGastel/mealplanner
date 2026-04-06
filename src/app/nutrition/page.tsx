"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";
import { nl as nlLocale } from "date-fns/locale";
import { de as deLocale } from "date-fns/locale";
import { fr as frLocale } from "date-fns/locale";
import { es as esLocale } from "date-fns/locale";
import { enUS as enLocale } from "date-fns/locale";
import { SchijfVan5 } from "@/components/schijf-van-5";
import type { NutritionInfo, Meal } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

const DATE_LOCALES: Record<Locale, typeof nlLocale> = {
  nl: nlLocale,
  en: enLocale,
  de: deLocale,
  fr: frLocale,
  es: esLocale,
};

const EMPTY_NUTRITION: NutritionInfo = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  groente_fruit: 0,
  granen: 0,
  zuivel: 0,
  vis_vlees_ei: 0,
  smeer_kook: 0,
};

export default function NutritionPage() {
  const { t, locale } = useI18n();
  const dateLocale = DATE_LOCALES[locale];

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [meals, setMeals] = useState<Meal[]>([]);
  const [dayNutrition, setDayNutrition] =
    useState<NutritionInfo>(EMPTY_NUTRITION);

  const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd")
  );

  const fetchMeals = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("meals")
      .select("*")
      .eq("date", selectedDate);

    const mealData = (data || []) as Meal[];
    setMeals(mealData);

    const totals = mealData.reduce<NutritionInfo>((acc, meal) => {
      if (!meal.nutrition) return acc;
      return {
        calories: acc.calories + (meal.nutrition.calories || 0),
        protein: acc.protein + (meal.nutrition.protein || 0),
        carbs: acc.carbs + (meal.nutrition.carbs || 0),
        fat: acc.fat + (meal.nutrition.fat || 0),
        fiber: acc.fiber + (meal.nutrition.fiber || 0),
        groente_fruit:
          acc.groente_fruit + (meal.nutrition.groente_fruit || 0),
        granen: acc.granen + (meal.nutrition.granen || 0),
        zuivel: acc.zuivel + (meal.nutrition.zuivel || 0),
        vis_vlees_ei:
          acc.vis_vlees_ei + (meal.nutrition.vis_vlees_ei || 0),
        smeer_kook: acc.smeer_kook + (meal.nutrition.smeer_kook || 0),
      };
    }, { ...EMPTY_NUTRITION });

    setDayNutrition(totals);
  }, [selectedDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  function navigate(direction: -1 | 1) {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(format(date, "yyyy-MM-dd"));
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-6">{t.nutritionTitle}</h1>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold">
          {format(new Date(selectedDate), "EEEE d MMMM", { locale: dateLocale })}
        </span>
        <button
          onClick={() => navigate(1)}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {weekDays.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
              d === selectedDate
                ? "bg-primary text-white"
                : "bg-card border border-border text-muted hover:border-primary"
            }`}
          >
            {format(new Date(d), "EEE", { locale: dateLocale })[0].toUpperCase()}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <SchijfVan5 nutrition={dayNutrition} size={220} />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: t.nutritionProtein, value: dayNutrition.protein, unit: "g", color: "text-blue-500" },
          { label: t.nutritionCarbs, value: dayNutrition.carbs, unit: "g", color: "text-yellow-500" },
          { label: t.nutritionFat, value: dayNutrition.fat, unit: "g", color: "text-red-400" },
          { label: t.nutritionFiber, value: dayNutrition.fiber, unit: "g", color: "text-green-500" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-card p-3 text-center"
          >
            <p className={`text-lg font-bold ${m.color}`}>
              {m.value.toFixed(0)}
              <span className="text-xs font-normal">{m.unit}</span>
            </p>
            <p className="text-xs text-muted">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted">
          {t.nutritionMealsToday}
        </h2>
        {meals.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            {t.nutritionNoMeals}
          </p>
        ) : (
          meals.map((meal) => (
            <div
              key={meal.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{meal.title}</p>
                <p className="text-xs text-muted capitalize">
                  {t.plannerMealTypes[meal.meal_type]}
                </p>
              </div>
              {meal.nutrition && (
                <span className="text-sm font-semibold text-primary">
                  {meal.nutrition.calories} kcal
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
