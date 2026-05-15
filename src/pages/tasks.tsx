import React, { useState, useRef } from "react";
import {
  useListTasks, getListTasksQueryKey,
  useCreateTask,
  useDeleteTask,
  useToggleTask,
  useSendTaskNow,
  useListTokens, getListTokensQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ListTodo, Plus, Trash2, Loader2, Play, CalendarClock, MessageSquare, KeyRound, Image, X, Upload, Timer, Clock4 } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language";

const taskSchema = z.object({
  tokenId: z.coerce.number().min(1, { message: "يرجى اختيار التوكن" }),
  serverId: z.string().optional(),
  channelId: z.string().min(1, { message: "معرف القناة مطلوب" }),
  message: z.string().min(1, { message: "الرسالة مطلوبة" }),
  imagePath: z.string().optional(),
  scheduleMode: z.enum(["interval", "cron"]).default("interval"),
  intervalPreset: z.string().optional(),
  intervalCustom: z.coerce.number().optional(),
  scheduleTime: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

const INTERVAL_PRESETS = [
  { value: "30", labelKey: "seconds30" as const },
  { value: "60", labelKey: "seconds60" as const },
  { value: "300", labelKey: "seconds300" as const },
  { value: "600", labelKey: "seconds600" as const },
  { value: "1800", labelKey: "seconds1800" as const },
  { value: "3600", labelKey: "seconds3600" as const },
  { value: "custom", labelKey: "custom" as const },
];

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: tasks, isLoading: isTasksLoading } = useListTasks({ query: { queryKey: getListTasksQueryKey() } });
  const { data: tokens } = useListTokens({ query: { queryKey: getListTokensQueryKey() } });

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTask();
  const sendTaskNow = useSendTaskNow();

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      tokenId: 0,
      serverId: "",
      channelId: "",
      message: "",
      imagePath: "",
      scheduleMode: "interval",
      intervalPreset: "30",
      intervalCustom: 30,
      scheduleTime: "0 * * * *",
    },
  });

  const scheduleMode = form.watch("scheduleMode");
  const intervalPreset = form.watch("intervalPreset");
  const imagePath = form.watch("imagePath");

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      form.setValue("imagePath", data.url);
      setPreviewImage(URL.createObjectURL(file));
      toast({ title: t("imageUploaded") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("error"), description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    form.setValue("imagePath", "");
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (data: TaskForm) => {
    let intervalSeconds: number | undefined;
    let scheduleTime = "0 * * * *";

    if (data.scheduleMode === "interval") {
      if (data.intervalPreset === "custom") {
        intervalSeconds = data.intervalCustom || 30;
      } else {
        intervalSeconds = parseInt(data.intervalPreset || "30", 10);
      }
    } else {
      scheduleTime = data.scheduleTime || "0 * * * *";
    }

    createTask.mutate(
      {
        data: {
          tokenId: data.tokenId,
          serverId: data.serverId || undefined,
          channelId: data.channelId,
          message: data.message,
          imagePath: data.imagePath || undefined,
          scheduleTime,
          intervalSeconds,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          toast({ title: t("taskCreated") });
          setIsAddOpen(false);
          setPreviewImage(null);
          form.reset();
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: t("error"), description: err?.response?.data?.message || "فشل في إنشاء المهمة" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteTask.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: t("taskDeleted") });
      },
    });
  };

  const handleToggle = (id: number) => {
    toggleTask.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
    });
  };

  const handleSendNow = (id: number) => {
    setSendingId(id);
    sendTaskNow.mutate({ id }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setSendingId(null);
        toast({ title: res.success ? t("sendSuccess") : t("sendFailed"), description: res.message, variant: res.success ? "default" : "destructive" });
      },
      onError: (err: any) => {
        setSendingId(null);
        toast({ variant: "destructive", title: t("error"), description: err?.response?.data?.message });
      },
    });
  };

  const getTokenLabel = (id: number) => {
    const token = tokens?.find(t => t.id === id);
    return token ? (token.label || `#${token.id}`) : `#${id}`;
  };

  const formatSchedule = (task: any) => {
    if (task.intervalSeconds) {
      const s = task.intervalSeconds;
      if (s < 60) return `${s}s`;
      if (s < 3600) return `${s / 60}m`;
      return `${s / 3600}h`;
    }
    return task.scheduleTime;
  };

  const activeTokens = tokens?.filter(t => t.status === "active") ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tasksTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("tasksDesc")}</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-add-task">
              <Plus className="h-4 w-4" />{t("addTask")}
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-[560px] max-h-[90dvh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{t("newTask")}</DialogTitle>
              <DialogDescription>{t("newTaskDesc")}</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-1">
                {/* Token */}
                <FormField control={form.control} name="tokenId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("selectToken")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder={t("selectTokenPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent dir="rtl">
                        {activeTokens.map(token => (
                          <SelectItem key={token.id} value={String(token.id)}>
                            {token.label || `توكن #${token.id}`}
                          </SelectItem>
                        ))}
                        {activeTokens.length === 0 && <SelectItem value="0" disabled>{t("noActiveTokens")}</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Channel & Server */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="channelId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("channelId")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("channelPlaceholder")} dir="ltr" className="font-mono bg-background/50 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="serverId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("serverId")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("serverPlaceholder")} dir="ltr" className="font-mono bg-background/50 text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Schedule Mode */}
                <FormField control={form.control} name="scheduleMode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("scheduleType")}</FormLabel>
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => field.onChange("interval")}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${field.value === "interval" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:border-border"}`}>
                        <Timer className="h-4 w-4" />{t("intervalMode")}
                      </button>
                      <button type="button"
                        onClick={() => field.onChange("cron")}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${field.value === "cron" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/50 text-muted-foreground hover:border-border"}`}>
                        <Clock4 className="h-4 w-4" />{t("cronMode")}
                      </button>
                    </div>
                  </FormItem>
                )} />

                {/* Interval Settings */}
                {scheduleMode === "interval" && (
                  <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <FormField control={form.control} name="intervalPreset" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">{t("intervalLabel")}</FormLabel>
                        <div className="grid grid-cols-3 gap-1.5">
                          {INTERVAL_PRESETS.map((preset) => (
                            <button key={preset.value} type="button"
                              onClick={() => field.onChange(preset.value)}
                              className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${field.value === preset.value ? "bg-primary text-primary-foreground border-primary" : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"}`}>
                              {t(preset.labelKey)}
                            </button>
                          ))}
                        </div>
                      </FormItem>
                    )} />

                    {intervalPreset === "custom" && (
                      <FormField control={form.control} name="intervalCustom" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{t("customSeconds")}</FormLabel>
                          <FormControl>
                            <Input type="number" min={5} placeholder="30" dir="ltr" className="bg-background/50 font-mono" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                )}

                {/* Cron Settings */}
                {scheduleMode === "cron" && (
                  <FormField control={form.control} name="scheduleTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cronExpr")}</FormLabel>
                      <FormControl>
                        <Input placeholder="0 * * * *" dir="ltr" className="font-mono bg-background/50" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs font-mono" dir="ltr">{t("cronHelper")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {/* Message */}
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("messageContent")}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("messagePlaceholder")} className="resize-none h-20 bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">{t("uploadImage")}</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />

                  {previewImage ? (
                    <div className="relative inline-block">
                      <img src={previewImage} alt="preview" className="h-24 w-auto rounded-lg border border-border/50 object-cover" />
                      <button type="button" onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/80 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all text-sm disabled:opacity-50 w-full justify-center">
                      {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("imageUploading")}</> : <><Upload className="h-4 w-4" />{t("uploadImageBtn")}</>}
                    </button>
                  )}

                  {/* Or URL */}
                  {!previewImage && (
                    <FormField control={form.control} name="imagePath" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="https://... (اختياري)" dir="ltr" className="font-mono bg-background/50 text-xs" {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                  )}
                </div>

                <DialogFooter className="pt-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setPreviewImage(null); form.reset(); }}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={createTask.isPending || activeTokens.length === 0} data-testid="submit-task">
                    {createTask.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {createTask.isPending ? t("saving") : t("save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isTasksLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <Card key={task.id}
              className={`border-border/50 transition-all duration-300 overflow-hidden ${task.isActive ? "bg-card/40 hover:bg-card/60" : "bg-muted/10 opacity-70 grayscale-[20%]"}`}>

              {/* Card Header */}
              <CardHeader className="p-4 pb-3 border-b border-border/20 flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${task.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {t("task")} #{task.id}
                      <Badge variant="outline"
                        className={`text-[10px] h-4 px-1.5 ${task.isActive ? "border-primary/30 text-primary" : "border-muted-foreground/30 text-muted-foreground"}`}>
                        {task.isActive ? t("on") : t("off")}
                      </Badge>
                      {task.intervalSeconds && (
                        <Badge className="text-[10px] h-4 px-1.5 bg-blue-500/10 text-blue-400 border-blue-500/30">
                          <Timer className="h-2.5 w-2.5 me-1" />{formatSchedule(task)}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[11px] mt-0.5" dir="ltr">{task.channelId}</CardDescription>
                  </div>
                </div>
                <Switch checked={task.isActive} onCheckedChange={() => handleToggle(task.id)} disabled={toggleTask.isPending} />
              </CardHeader>

              {/* Image preview if available */}
              {task.imagePath && (
                <div className="px-4 pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 border border-border/20">
                    <Image className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="truncate font-mono" dir="ltr">{task.imagePath}</span>
                  </div>
                </div>
              )}

              {/* Message */}
              <CardContent className="p-4 space-y-3">
                <div className="bg-background/40 px-3 py-2.5 rounded-lg border border-border/30 text-sm line-clamp-2 min-h-[42px] text-muted-foreground">
                  {task.message}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {task.intervalSeconds ? <Timer className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                      <span className="font-mono" dir="ltr">{formatSchedule(task)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-s border-border/40 ps-3">
                      <KeyRound className="h-3 w-3" />
                      <span className="truncate max-w-[90px]">{getTokenLabel(task.tokenId)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <div className="text-xs text-muted-foreground">
                    {t("sentCount")}: <span className="font-mono font-semibold text-foreground ms-1">{task.sentCount}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"
                      className="h-7 text-xs border-primary/20 text-primary hover:bg-primary/10 gap-1"
                      onClick={() => handleSendNow(task.id)}
                      disabled={sendingId === task.id || !task.isActive}
                      data-testid={`send-task-${task.id}`}>
                      {sendingId === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      {t("sendNow")}
                    </Button>
                    <Button variant="outline" size="sm"
                      className="h-7 w-7 p-0 border-destructive/20 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(task.id)}
                      data-testid={`delete-task-${task.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 bg-card/20">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center">
            <ListTodo className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1 text-foreground">{t("noTasks")}</p>
            <p className="text-sm max-w-sm">{t("noTasksDesc")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
