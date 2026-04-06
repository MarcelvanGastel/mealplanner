"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  AlertTriangle,
  Heart,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  X,
  Check,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface HouseholdMember {
  name: string;
  age: string;
  email: string;
  invite: boolean;
}

interface SampleRecipe {
  title: string;
  emoji: string;
  tags: string[];
}

const ALLERGIES = [
  "Gluten",
  "Lactose",
  "Noten",
  "Pinda",
  "Soja",
  "Ei",
  "Vis",
  "Schaaldieren",
  "Selderij",
  "Mosterd",
  "Sesam",
  "Sulfiet",
];

const DIET_KEYS = ["geen", "flexitarisch", "vegetarisch", "veganistisch", "pescotarisch"] as const;

const STEPS = [
  { icon: Users },
  { icon: AlertTriangle },
  { icon: Heart },
  { icon: Wallet },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Household
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([
    { name: "", age: "", email: "", invite: false },
  ]);

  // Step 2: Allergies & diet
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diet, setDiet] = useState("geen");

  // Step 3: Taste — sample recipes
  const [sampleRecipes, setSampleRecipes] = useState<SampleRecipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Step 4: Budget
  const [budgetAmount, setBudgetAmount] = useState("50");
  const [budgetPeriod, setBudgetPeriod] = useState<"week" | "maand">("week");

  // Load sample recipes when arriving at step 3
  useEffect(() => {
    if (step === 2 && sampleRecipes.length === 0) {
      loadSampleRecipes();
    }
  }, [step]);

  async function loadSampleRecipes() {
    setLoadingRecipes(true);
    try {
      const res = await fetch("/api/ai/onboarding-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diet,
          allergies,
          householdSize: householdMembers.length,
        }),
      });
      const data = await res.json();
      setSampleRecipes(data.recipes || []);
    } catch {
      setSampleRecipes([
        { title: "Spaghetti Bolognese", emoji: "🍝", tags: ["Italian", "Pasta"] },
        { title: "Chicken Tandoori", emoji: "🍛", tags: ["Indian", "Chicken"] },
        { title: "Stamppot Boerenkool", emoji: "🥬", tags: ["Dutch", "Winter"] },
        { title: "Pad Thai", emoji: "🥡", tags: ["Asian", "Noodles"] },
        { title: "Caesar Salad", emoji: "🥗", tags: ["Salad", "Light"] },
        { title: "Chili con Carne", emoji: "🌶️", tags: ["Mexican", "Spicy"] },
        { title: "Mushroom Risotto", emoji: "🍄", tags: ["Italian", "Creamy"] },
        { title: "Shoarma Bowl", emoji: "🥙", tags: ["Middle Eastern", "Bowl"] },
        { title: "Tomato Soup", emoji: "🍅", tags: ["Classic", "Soup"] },
        { title: "Salmon & Veggies", emoji: "🐟", tags: ["Fish", "Healthy"] },
        { title: "Pancakes", emoji: "🥞", tags: ["Classic", "Sweet"] },
        { title: "Buddha Bowl", emoji: "🥑", tags: ["Healthy", "Vegan"] },
      ]);
    }
    setLoadingRecipes(false);
  }

  function toggleAllergy(allergy: string) {
    setAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  }

  function toggleRecipe(title: string) {
    setLikedRecipes((prev) =>
      prev.includes(title)
        ? prev.filter((r) => r !== title)
        : [...prev, title]
    );
  }

  function addMember() {
    setHouseholdMembers((prev) => [...prev, { name: "", age: "", email: "", invite: false }]);
  }

  function removeMember(index: number) {
    setHouseholdMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMember(index: number, field: keyof HouseholdMember, value: string) {
    setHouseholdMembers((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        if (field === "invite") return { ...m, invite: value === "true" };
        return { ...m, [field]: value };
      })
    );
  }

  async function finish() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validMembers = householdMembers.filter((m) => m.name.trim());

      const membersToSave = validMembers.map(({ name, age, email, invite }) => ({
        name,
        age,
        email: invite ? email : "",
        invite,
      }));

      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          household_size: Math.max(validMembers.length, 1),
          household_members: membersToSave,
          allergies,
          diet_preference: diet,
          liked_recipes: likedRecipes,
          budget_amount: parseFloat(budgetAmount) || 50,
          budget_period: budgetPeriod,
        })
        .eq("id", user.id);

      // Send invite emails to family members
      const invites = validMembers.filter((m) => m.invite && m.email.trim());
      for (const member of invites) {
        await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: member.email, name: member.name }),
        });
      }

      router.push("/planner");
    } catch {
      // retry
    }
    setSaving(false);
  }

  function canNext(): boolean {
    if (step === 0) return householdMembers.some((m) => m.name.trim());
    if (step === 2) return likedRecipes.length >= 3;
    if (step === 3) return parseFloat(budgetAmount) > 0;
    return true;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted mt-2">
          {t.onboardingStep} {step + 1} {t.onboardingOf} {STEPS.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-32">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t.onboardingWelcome} 👋</h1>
              <p className="text-muted mt-1">{t.onboardingWelcomeDesc}</p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">{t.onboardingMembers}</label>
              {householdMembers.map((member, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={i === 0 ? t.onboardingYourName : t.onboardingName}
                      value={member.name}
                      onChange={(e) => updateMember(i, "name", e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder={t.onboardingAge}
                      value={member.age}
                      onChange={(e) => updateMember(i, "age", e.target.value)}
                      className="w-20 rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                    />
                    {householdMembers.length > 1 && (
                      <button
                        onClick={() => removeMember(i)}
                        className="p-2 text-muted hover:text-red-500"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  {i > 0 && member.name.trim() && (
                    <div className="ml-1 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => updateMember(i, "invite", (!member.invite).toString())}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            member.invite
                              ? "bg-primary border-primary"
                              : "border-border bg-card"
                          }`}
                        >
                          {member.invite && <Check size={12} className="text-white" />}
                        </button>
                        <span className="text-sm text-muted">{t.onboardingInvite}</span>
                      </label>
                      {member.invite && (
                        <input
                          type="email"
                          placeholder={t.onboardingEmail}
                          value={member.email}
                          onChange={(e) => updateMember(i, "email", e.target.value)}
                          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addMember}
                className="flex items-center gap-2 text-sm text-primary font-medium"
              >
                <Plus size={16} />
                {t.onboardingAddPerson}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t.onboardingAllergiesTitle}</h1>
              <p className="text-muted mt-1">{t.onboardingAllergiesDesc}</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">{t.onboardingAllergies}</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGIES.map((allergy) => (
                  <button
                    key={allergy}
                    onClick={() => toggleAllergy(allergy)}
                    className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                      allergies.includes(allergy)
                        ? "bg-primary text-white border-primary"
                        : "bg-card border-border text-foreground hover:border-primary"
                    }`}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">{t.onboardingDiet}</label>
              <div className="space-y-2">
                {DIET_KEYS.map((key) => {
                  const option = t.onboardingDietOptions[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setDiet(key)}
                      className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
                        diet === key
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border hover:border-primary"
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted">{option.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t.onboardingTasteTitle}</h1>
              <p className="text-muted mt-1">{t.onboardingTasteDesc}</p>
            </div>

            {loadingRecipes ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm text-muted mt-3">{t.onboardingTasteLoading}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {sampleRecipes.map((recipe) => (
                  <button
                    key={recipe.title}
                    onClick={() => toggleRecipe(recipe.title)}
                    className={`relative rounded-2xl border p-4 text-left transition-all ${
                      likedRecipes.includes(recipe.title)
                        ? "bg-primary/10 border-primary ring-1 ring-primary"
                        : "bg-card border-border hover:border-primary"
                    }`}
                  >
                    {likedRecipes.includes(recipe.title) && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    <div className="text-2xl mb-2">{recipe.emoji}</div>
                    <div className="font-medium text-sm leading-tight">
                      {recipe.title}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-muted bg-background rounded-full px-1.5 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {likedRecipes.length > 0 && (
              <p className="text-sm text-muted text-center">
                {likedRecipes.length} {t.onboardingTasteChosen}
                {likedRecipes.length < 3 && ` — ${t.onboardingTasteMore} ${3 - likedRecipes.length}`}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t.onboardingBudgetTitle}</h1>
              <p className="text-muted mt-1">{t.onboardingBudgetDesc}</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setBudgetPeriod("week")}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                    budgetPeriod === "week"
                      ? "bg-primary text-white border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  {t.onboardingPerWeek}
                </button>
                <button
                  onClick={() => setBudgetPeriod("maand")}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                    budgetPeriod === "maand"
                      ? "bg-primary text-white border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  {t.onboardingPerMonth}
                </button>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">
                    €
                  </span>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-4 text-2xl font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                {householdMembers.filter((m) => m.name.trim()).length > 0 && (
                  <p className="text-xs text-muted mt-2">
                    ~€
                    {(
                      parseFloat(budgetAmount || "0") /
                      Math.max(householdMembers.filter((m) => m.name.trim()).length, 1) /
                      (budgetPeriod === "maand" ? 30 : 7)
                    ).toFixed(2)}{" "}
                    {t.onboardingPerPersonPerDay}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(budgetPeriod === "week"
                  ? ["25", "50", "75"]
                  : ["100", "200", "300"]
                ).map((val) => (
                  <button
                    key={val}
                    onClick={() => setBudgetAmount(val)}
                    className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                      budgetAmount === val
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border"
                    }`}
                  >
                    €{val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center justify-center gap-1 rounded-xl border border-border px-4 py-3 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            {t.back}
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t.next}
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={saving || !canNext()}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t.onboardingSaving}
              </>
            ) : (
              <>
                {t.onboardingFinish}
                <ChevronRight size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
