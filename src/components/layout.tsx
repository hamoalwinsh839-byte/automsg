import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Loader2, LayoutDashboard, KeyRound, ListTodo, ScrollText, LogOut, TerminalSquare, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/language";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe();
  const logout = useLogout();
  const { t, lang, setLang, isRtl } = useLanguage();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (isError) setLocation("/");
  }, [isError, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", labelKey: "overview" as const, icon: LayoutDashboard },
    { href: "/tokens", labelKey: "tokens" as const, icon: KeyRound },
    { href: "/tasks", labelKey: "tasks" as const, icon: ListTodo },
    { href: "/logs", labelKey: "logs" as const, icon: ScrollText },
  ];

  return (
    <div className={`min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className={`w-full md:w-64 bg-card/50 backdrop-blur-xl border-b md:border-b-0 ${isRtl ? "md:border-l" : "md:border-r"} border-border/50 flex flex-col sticky top-0 md:h-[100dvh] shadow-2xl`}>
        {/* Logo */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <TerminalSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground block">{t("appName")}</span>
              <span className="text-[10px] text-muted-foreground">by Alwinsh</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
                  }`}
                  data-testid={`nav-${item.href.replace("/", "")}`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : "group-hover:text-foreground"}`} />
                  <span className="text-sm">{t(item.labelKey)}</span>
                  {isActive && <div className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-primary`} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border/50 space-y-2">
          {/* Language Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/30">
            <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground flex-1">{lang === "ar" ? "اللغة" : "Language"}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setLang("ar")}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                ع
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                EN
              </button>
            </div>
          </div>

          {/* User */}
          <div className="px-3 py-2 rounded-lg bg-secondary/20 border border-border/20">
            <p className="text-[10px] text-muted-foreground mb-0.5">{lang === "ar" ? "المستخدم" : "Logged in as"}</p>
            <p className="text-sm font-medium truncate" title={user.username}>@{user.username}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
            onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/") })}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("logout")}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
        <footer className="py-3 text-center border-t border-border/30">
          <p className="text-xs text-muted-foreground font-mono">{t("copyright")}</p>
        </footer>
      </div>
    </div>
  );
}
