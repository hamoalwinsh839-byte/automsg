import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TerminalSquare, Loader2, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language";

const authSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});
type AuthFormValues = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRtl, lang, setLang } = useLanguage();
  const { data: user, isLoading: isUserLoading } = useGetMe({ query: { retry: false } });

  const loginForm = useForm<AuthFormValues>({ resolver: zodResolver(authSchema), defaultValues: { username: "", password: "" } });
  const registerForm = useForm<AuthFormValues>({ resolver: zodResolver(authSchema), defaultValues: { username: "", password: "" } });
  const login = useLogin();
  const register = useRegister();

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  React.useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  if (isUserLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onLogin = (data: AuthFormValues) => {
    login.mutate({ data }, {
      onSuccess: () => setLocation("/dashboard"),
      onError: (err: any) => toast({ variant: "destructive", title: t("error"), description: err?.response?.data?.message || "فشل تسجيل الدخول" }),
    });
  };

  const onRegister = (data: AuthFormValues) => {
    register.mutate({ data }, {
      onSuccess: () => setLocation("/dashboard"),
      onError: (err: any) => toast({ variant: "destructive", title: t("error"), description: err?.response?.data?.message || "فشل إنشاء الحساب" }),
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Language switcher */}
      <div className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} flex gap-1 bg-card/50 border border-border/50 rounded-lg p-1`}>
        <button onClick={() => setLang("ar")} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>ع</button>
        <button onClick={() => setLang("en")} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>EN</button>
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-lg shadow-primary/10">
          <TerminalSquare className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">{t("appName")}</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">{t("appDesc")}</p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          { icon: Zap, label: lang === "ar" ? "إرسال تلقائي" : "Auto Send" },
          { icon: Shield, label: lang === "ar" ? "آمن ومشفر" : "Secure" },
          { icon: Clock, label: lang === "ar" ? "جدولة متقدمة" : "Scheduling" },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border/40 text-xs text-muted-foreground">
            <Icon className="h-3 w-3 text-primary" /> {label}
          </span>
        ))}
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm">
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-auto p-0">
              <TabsTrigger value="login" className="flex-1 rounded-none py-3.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent transition-all">
                {t("login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 rounded-none py-3.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-b-2 border-transparent transition-all">
                {t("register")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="p-6 space-y-4 mt-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField control={loginForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t("username")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enterUsername")} className="bg-background/50 border-border/50 h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t("password")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t("enterPassword")} className="bg-background/50 border-border/50 h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full h-10 font-medium shadow-lg shadow-primary/20" disabled={login.isPending}>
                    {login.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{t("loggingIn")}</> : t("loginBtn")}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="p-6 space-y-4 mt-0">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField control={registerForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t("username")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("enterUsername")} className="bg-background/50 border-border/50 h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{t("password")}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t("enterPassword")} className="bg-background/50 border-border/50 h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full h-10 font-medium shadow-lg shadow-primary/20" disabled={register.isPending}>
                    {register.isPending ? <><Loader2 className="h-4 w-4 animate-spin me-2" />{t("registering")}</> : t("registerBtn")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground font-mono">{t("copyright")}</p>
    </div>
  );
}
