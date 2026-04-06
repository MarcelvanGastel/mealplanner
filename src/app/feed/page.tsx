"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, Share2, BookmarkPlus, Clock, Users } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";

export default function FeedPage() {
  const { t } = useI18n();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  async function fetchFeed() {
    const supabase = createClient();
    const { data } = await supabase
      .from("recipes")
      .select("*, profiles(display_name, avatar_url)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setRecipes(data as Recipe[]);
    setLoading(false);
  }

  async function toggleLike(recipeId: string, hasLiked: boolean) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (hasLiked) {
      await supabase
        .from("recipe_likes")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("recipe_likes")
        .insert({ recipe_id: recipeId, user_id: user.id });
    }
    fetchFeed();
  }

  async function shareRecipe(recipe: Recipe) {
    if (navigator.share) {
      await navigator.share({
        title: recipe.title,
        text: recipe.description || "",
        url: window.location.href,
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        {t.loading}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t.feedTitle}</h1>
        <a
          href="/feed/new"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          {t.feedShare}
        </a>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg mb-2">{t.feedEmpty}</p>
          <p className="text-sm">{t.feedEmptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-full bg-primary-light/50 flex items-center justify-center text-xs font-bold text-primary">
                    {recipe.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm text-muted">
                    {recipe.profiles?.display_name || t.feedAnonymous}
                  </span>
                </div>

                <h3 className="font-semibold text-lg">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-sm text-muted mt-1">
                    {recipe.description}
                  </p>
                )}

                <div className="flex gap-4 mt-2 text-xs text-muted">
                  {recipe.prep_time && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {recipe.prep_time}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {recipe.servings} {t.persPeriod}
                  </span>
                  {recipe.estimated_cost && (
                    <span>€{recipe.estimated_cost.toFixed(2)}</span>
                  )}
                </div>

                {recipe.ingredients.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {recipe.ingredients.slice(0, 6).map((ing, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-background border border-border px-2 py-0.5 text-xs text-muted"
                      >
                        {ing}
                      </span>
                    ))}
                    {recipe.ingredients.length > 6 && (
                      <span className="text-xs text-muted px-2 py-0.5">
                        +{recipe.ingredients.length - 6} {t.feedMore}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() =>
                      toggleLike(recipe.id, !!recipe.user_has_liked)
                    }
                    className={`flex items-center gap-1 text-sm ${
                      recipe.user_has_liked
                        ? "text-red-500"
                        : "text-muted hover:text-red-500"
                    }`}
                  >
                    <Heart
                      size={18}
                      fill={recipe.user_has_liked ? "currentColor" : "none"}
                    />
                    {recipe.likes_count}
                  </button>
                  <button
                    onClick={() => shareRecipe(recipe)}
                    className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
                  >
                    <Share2 size={18} />
                    {t.feedShareBtn}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted hover:text-primary ml-auto">
                    <BookmarkPlus size={18} />
                    {t.feedSaveBtn}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
