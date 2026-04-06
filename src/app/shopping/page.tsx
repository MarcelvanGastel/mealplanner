"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Store,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface ShoppingItem {
  id: string;
  item: string;
  checked: boolean;
}

interface PriceMatch {
  supermarket_code: string;
  supermarket_name: string;
  product_name: string;
  price: number;
  amount: string | null;
  product_link: string | null;
}

export default function ShoppingPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [prices, setPrices] = useState<Record<string, PriceMatch[]>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("shopping_list")
      .select("id, item, checked")
      .order("checked")
      .order("created_at", { ascending: false });
    if (data) setItems(data);
  }, []);

  // Fetch prices for all unchecked items
  const fetchPrices = useCallback(async (shoppingItems: ShoppingItem[]) => {
    const uncheckedItems = shoppingItems
      .filter((i) => !i.checked)
      .map((i) => i.item);
    if (uncheckedItems.length === 0) return;

    setLoadingPrices(true);
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: uncheckedItems }),
      });
      if (res.ok) {
        const { results } = await res.json();
        setPrices(results || {});
      }
    } catch {
      // Silently fail — prices are a nice-to-have
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Fetch prices when items change
  useEffect(() => {
    if (items.length > 0) {
      fetchPrices(items);
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("shopping_list").insert({
      user_id: user.id,
      item: newItem.trim(),
    });
    setNewItem("");
    fetchItems();
  }

  async function toggleItem(id: string, checked: boolean) {
    const supabase = createClient();
    await supabase
      .from("shopping_list")
      .update({ checked: !checked })
      .eq("id", id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !checked } : item
      )
    );
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    await supabase.from("shopping_list").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function clearChecked() {
    const supabase = createClient();
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    await supabase.from("shopping_list").delete().in("id", checkedIds);
    setItems((prev) => prev.filter((i) => !i.checked));
  }

  function getCheapest(itemName: string): PriceMatch | null {
    const matches = prices[itemName];
    if (!matches || matches.length === 0) return null;
    return matches[0]; // Already sorted by price ascending
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  // Calculate estimated total (cheapest price per item)
  const estimatedTotal = unchecked.reduce((sum, item) => {
    const cheapest = getCheapest(item.item);
    return sum + (cheapest?.price || 0);
  }, 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t.shoppingTitle}</h1>
        {estimatedTotal > 0 && (
          <div className="text-right">
            <span className="text-xs text-muted block">{t.shoppingEstimated || "Geschat"}</span>
            <span className="text-lg font-bold text-primary">
              €{estimatedTotal.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={addItem} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={t.shoppingAdd}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="rounded-xl bg-primary px-4 py-3 text-white disabled:opacity-50"
        >
          <Plus size={20} />
        </button>
      </form>

      {loadingPrices && unchecked.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted mb-4">
          <Store size={14} className="animate-pulse" />
          <span>{t.shoppingLoadingPrices || "Prijzen ophalen..."}</span>
        </div>
      )}

      {unchecked.length === 0 && checked.length === 0 && (
        <p className="text-center text-muted py-12">{t.shoppingEmpty}</p>
      )}

      {unchecked.length > 0 && (
        <div className="space-y-2 mb-6">
          {unchecked.map((item) => {
            const cheapest = getCheapest(item.item);
            const allPrices = prices[item.item] || [];
            const isExpanded = expandedItem === item.id;

            return (
              <div key={item.id}>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <button
                    onClick={() => toggleItem(item.id, item.checked)}
                    className="h-6 w-6 shrink-0 rounded-full border-2 border-border hover:border-primary transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block">{item.item}</span>
                    {cheapest && (
                      <button
                        onClick={() =>
                          setExpandedItem(isExpanded ? null : item.id)
                        }
                        className="flex items-center gap-1 text-xs text-muted mt-0.5 hover:text-primary transition-colors"
                      >
                        <Store size={12} />
                        <span>
                          {cheapest.supermarket_name} — €
                          {cheapest.price.toFixed(2)}
                        </span>
                        {cheapest.amount && (
                          <span className="opacity-60">
                            ({cheapest.amount})
                          </span>
                        )}
                        {allPrices.length > 1 &&
                          (isExpanded ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          ))}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-muted hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Expanded price comparison */}
                {isExpanded && allPrices.length > 0 && (
                  <div className="ml-9 mt-1 mb-2 space-y-1">
                    {allPrices.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-card/50 border border-border/50"
                      >
                        <span
                          className={`font-medium ${idx === 0 ? "text-primary" : "text-foreground"}`}
                        >
                          {p.supermarket_name}
                        </span>
                        <span className="text-muted truncate flex-1">
                          {p.product_name}
                        </span>
                        {p.amount && (
                          <span className="text-muted">{p.amount}</span>
                        )}
                        <span className="font-bold">
                          €{p.price.toFixed(2)}
                        </span>
                        {p.product_link && (
                          <a
                            href={p.product_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted hover:text-primary"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {checked.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">
              {t.shoppingChecked} ({checked.length})
            </span>
            <button
              onClick={clearChecked}
              className="text-xs text-muted hover:text-red-500"
            >
              {t.shoppingRemoveChecked}
            </button>
          </div>
          <div className="space-y-2">
            {checked.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 opacity-50"
              >
                <button
                  onClick={() => toggleItem(item.id, item.checked)}
                  className="h-6 w-6 shrink-0 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check size={14} className="text-white" />
                </button>
                <span className="flex-1 line-through">{item.item}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-muted hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
