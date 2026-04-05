export type MealType = "ontbijt" | "lunch" | "diner" | "snack";

export interface NutritionInfo {
  calories: number;
  protein: number;    // grams
  carbs: number;      // grams
  fat: number;        // grams
  fiber: number;      // grams
  // Schijf van 5 categories
  groente_fruit: number;   // portions
  granen: number;          // portions
  zuivel: number;          // portions
  vis_vlees_ei: number;    // portions
  smeer_kook: number;      // portions
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  estimated_cost: number | null;
  image_url: string | null;
  nutrition: NutritionInfo | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  estimated_cost: number | null;
  prep_time: string | null;
  servings: number;
  image_url: string | null;
  nutrition: NutritionInfo | null;
  is_public: boolean;
  likes_count: number;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
  user_has_liked?: boolean;
}

export interface Deal {
  store: string;
  product: string;
  original_price: number;
  sale_price: number;
  category: string;
}

export interface WeekDay {
  date: string;
  label: string;
  isToday: boolean;
  meals: Meal[];
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  ontbijt: "Ontbijt",
  lunch: "Lunch",
  diner: "Diner",
  snack: "Snack",
};

export const SCHIJF_VAN_5_COLORS: Record<string, string> = {
  groente_fruit: "#4ade80",
  granen: "#fbbf24",
  zuivel: "#60a5fa",
  vis_vlees_ei: "#f87171",
  smeer_kook: "#c084fc",
};

export const SCHIJF_VAN_5_LABELS: Record<string, string> = {
  groente_fruit: "Groente & Fruit",
  granen: "Brood & Granen",
  zuivel: "Zuivel",
  vis_vlees_ei: "Vis, Vlees & Ei",
  smeer_kook: "Smeer & Kookvet",
};
