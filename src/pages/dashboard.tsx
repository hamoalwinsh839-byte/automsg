import React from "react";
import { Link } from "wouter";
import { useGetStats, getGetStatsQueryKey, useListLogs, getListLogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, ListTodo, CheckCircle2, Activity, Loader2, ArrowLeft, ScrollText, TrendingUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language";

export default function DashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useGetStats({ query: { queryKey: getGetStatsQueryKey() } });
  const { data: logs, isLoading: isLogsLoading } = useListLogs({ query: { queryKey: getListLogsQueryKey() } });
  const { t, isRtl } = useLanguage();

  const statCards = [
    { label: t("totalTokens"), value: stats?.totalTokens ?? 0, icon: KeyRound, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: t("activeTokens"), value: stats?.activeTokens ?? 0, icon: Activity, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: t("totalTasks"), value: stats?.totalTasks ?? 0, icon: ListTodo, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: t("activeTasks"), value: stats?.activeTasks ?? 0, icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: t("totalSent"), value: stats?.totalSent ?? 0, icon: Send, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
    { label: t("successRate"), value: stats ? `${stats.successRate.toFixed(1)}%` : "0%", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("dashTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("dashDesc")}</p>
        </div>
      </div>

      {/* Stats Grid */}
      {isStatsLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className={`border ${card.bg} bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 group`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 leading-relaxed">{card.label}</p>
                      <p className={`text-3xl font-bold ${card.color} tabular-nums`}>{card.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${card.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" />
                {t("recentActivity")}
              </CardTitle>
              <CardDescription className="text-xs mt-1">{t("recentActivityDesc")}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/logs">
                {t("viewAll")}
                <ArrowLeft className={`h-3 w-3 ${isRtl ? "" : "rotate-180"}`} />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLogsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="divide-y divide-border/30">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <p className="text-xs font-medium">{t("task")} #{log.taskId}</p>
                      <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{log.channelId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status === "success" ? "outline" : "destructive"} className={`text-[10px] h-5 ${log.status === "success" ? "border-green-500/30 text-green-400" : ""}`}>
                      {log.status === "success" ? t("success") : t("failed")}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {format(new Date(log.sentAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t("noActivity")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
