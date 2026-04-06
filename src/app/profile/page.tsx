"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User, Mail, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/translations";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
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
      <h1 className="text-xl font-bold mb-6">{t.profileTitle}</h1>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-light/50 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <User size={32} className="text-primary" />
            )}
          </div>
          <div>
            <p className="font-semibold text-lg">
              {profile?.display_name || t.profileNameless}
            </p>
            <p className="text-sm text-muted flex items-center gap-1">
              <Mail size={14} />
              {email}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            {t.profileDisplayName}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t.profileNamePlaceholder}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-1 mb-1">
            <Globe size={14} />
            {t.profileLanguage}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLocale(code)}
                className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                  locale === code
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t.saving : t.save}
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <LogOut size={18} />
        {t.profileLogout}
      </button>
    </div>
  );
}
