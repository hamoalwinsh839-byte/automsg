import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language";

export default function LogsPage() {
  const { data: logs, isLoading: isLogsLoading } = useListLogs({ query: { queryKey: getListLogsQueryKey() } });
  const { data: tasks } = useListTasks({ query: { queryKey: getListTasksQueryKey() } });
  const { t } = useLanguage();

  const getTaskContext = (taskId: number) => {
    if (!tasks) return null;
    return tasks.find(t => t.id === taskId);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("logsTitle")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("logsDesc")}</p>
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            {t("logsTitle")}
          </CardTitle>
          <CardDescription className="text-xs">{t("logsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLogsLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-xs">{t("task")}</TableHead>
                  <TableHead className="text-xs">{t("channel")}</TableHead>
                  <TableHead className="text-xs">{t("status")}</TableHead>
                  <TableHead className="text-xs">{t("reason")}</TableHead>
                  <TableHead className="text-xs">{t("time")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const task = getTaskContext(log.taskId);
                  return (
                    <TableRow key={log.id} className="border-border/20 hover:bg-muted/10">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-green-500" : "bg-red-500"}`} />
                          <span className="text-sm font-medium">#{log.taskId}</span>
                          {task && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{task.message.slice(0, 20)}…</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded" dir="ltr">
                          {log.channelId}
                        </code>
                      </TableCell>
                      <TableCell>
                        {log.status === "success" ? (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />{t("success")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <XCircle className="h-3 w-3" />{t("failed")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px]">
                        <span className="truncate block">{log.errorMessage || "—"}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {format(new Date(log.sentAt), "MM/dd HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
              <ScrollText className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">{t("noLogs")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
