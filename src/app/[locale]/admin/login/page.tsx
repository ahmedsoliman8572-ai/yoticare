"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(t("error"));
        setIsLoading(false);
        return;
      }

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (adminError || !adminData) {
        // Not an admin — sign them out
        await supabase.auth.signOut();
        setError(t("notAdmin"));
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard or previous page
      router.push(redirect || `/${locale}/admin`);
      router.refresh();
    } catch {
      setError(t("error"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-light p-4">
      {/* Language switcher */}
      <div className="fixed top-4 end-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-border p-8 animate-fade-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <Image
              src="/logo.jpg"
              alt="YotiCare"
              width={240}
              height={80}
              className="h-20 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold font-heading text-text">
              {t("title")}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {t("subtitle")}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-error-light text-error rounded-lg text-sm text-center animate-fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text mb-1.5"
              >
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                placeholder="admin@yoticare.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text mb-1.5"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-white text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                t("signIn")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
