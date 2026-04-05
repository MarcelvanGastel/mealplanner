"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { MEAL_TYPE_LABELS } from "@/lib/types";
import type { Meal, MealType } from "@/lib/types";
import { AddMealModal } from "@/components/add-meal-modal";

export default function PlannerPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<MealType>("diner");

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE d MMM", { locale: nl }),
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
      .order("meal_type");

    if (data) setMeals(data as Meal[]);
  }, [currentWeekStart]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  async function deleteMeal(id: string) {
    const supabase = createClient();
    await supabase.from("meals").delete().eq("id", id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  function openAddMeal(date: string, mealType: MealType) {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowModal(true);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentWeekStart((d) => addDays(d, -7))}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">
          Week van{" "}
          {format(currentWeekStart, "d MMMM", { locale: nl })}
        </h1>
        <button
          onClick={() => setCurrentWeekStart((d) => addDays(d, 7))}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {weekDays.map((day) => {
          const dayMeals = meals.filter((m) => m.date === day.date);
          return (
            <div
              key={day.date}
              className={`rounded-2xl border p-4 ${
                day.isToday
                  ? "border-primary bg-primary-light/20"
                  : "border-border bg-card"
              }`}
            >
              <h2
                className={`text-sm font-semibold mb-3 capitalize ${
                  day.isToday ? "text-primary" : "text-muted"
                }`}
              >
                {day.label}
                {day.isToday && (
                  <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                    Vandaag
                  </span>
                )}
              </h2>

              {(["ontbijt", "lunch", "diner", "snack"] as MealType[]).map(
                (type) => {
                  const meal = dayMeals.find((m) => m.meal_type === type);
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-xs text-muted w-16">
                        {MEAL_TYPE_LABELS[type]}
                      </span>
                      {meal ? (
                        <div className="flex-1 flex items-center justify-between ml-2">
                          <span className="text-sm truncate">
                            {meal.title}
                          </span>
                          <button
                            onClick={() => deleteMeal(meal.id)}
                            className="text-muted hover:text-red-500 ml-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAddMeal(day.date, type)}
                          className="flex-1 ml-2 flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                        >
                          <Plus size={14} />
                          Toevoegen
                        </button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <AddMealModal
          date={selectedDate}
          mealType={selectedMealType}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchMeals();
          }}
        />
      )}
    </div>
  );
}
