import React, { useState } from "react";
import {
  useListTokens, getListTokensQueryKey,
  useCreateToken,
  useDeleteToken,
  useTestToken
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Plus, Trash2, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language";

const tokenSchema = z.object({
  tokenValue: z.string().min(1),
  label: z.string().optional(),
});

export default function TokensPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  const { data: tokens, isLoading } = useListTokens({ query: { queryKey: getListTokensQueryKey() } });
  const createToken = useCreateToken();
  const deleteToken = useDeleteToken();
  const testToken = useTestToken();

  const form = useForm<z.infer<typeof tokenSchema>>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { tokenValue: "", label: "" },
  });

  const onSubmit = (data: z.infer<typeof tokenSchema>) => {
    createToken.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTokensQueryKey() });
        toast({ title: t("tokenAdded") });
        setIsAddOpen(false);
        form.reset();
      },
      onError: (err: any) => toast({ variant: "destructive", title: t("error"), description: err?.response?.data?.message }),
    });
  };

  const handleDelete = (id: number) => {
    deleteToken.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTokensQueryKey() });
        toast({ title: t("tokenDeleted") });
      },
    });
  };

  const handleTest = (id: number) => {
    setTestingId(id);
    testToken.mutate({ id }, {
      onSuccess: (res) => {
        setTestingId(null);
        queryClient.invalidateQueries({ queryKey: getListTokensQueryKey() });
        toast({ title: res.valid ? res.message : res.message, variant: res.valid ? "default" : "destructive" });
      },
      onError: () => setTestingId(null),
    });
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs"><CheckCircle2 className="h-3 w-3 me-1" />{t("active")}</Badge>;
    if (status === "invalid") return <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 me-1" />{t("invalid")}</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground">{t("unknown")}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tokensTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("tokensDesc")}</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-add-token">
              <Plus className="h-4 w-4" />{t("addToken")}
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("addToken")}</DialogTitle>
              <DialogDescription>{t("tokensDesc")}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="tokenValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tokenValue")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("tokenPlaceholder")} dir="ltr" className="font-mono text-sm bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tokenLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("labelPlaceholder")} className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>{t("cancel")}</Button>
                  <Button type="submit" disabled={createToken.isPending}>
                    {createToken.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}{t("addToken")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            {t("tokensTitle")}
          </CardTitle>
          <CardDescription className="text-xs">{t("tokensDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
          ) : tokens && tokens.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-xs">{t("tokenLabel")}</TableHead>
                  <TableHead className="text-xs">{t("tokenValue")}</TableHead>
                  <TableHead className="text-xs">{t("status")}</TableHead>
                  <TableHead className="text-xs">{t("addedOn")}</TableHead>
                  <TableHead className="text-xs text-end">{t("test")} / {t("delete")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id} className="border-border/20 hover:bg-muted/10">
                    <TableCell className="font-medium text-sm">{token.label || `#${token.id}`}</TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded" dir="ltr">
                        {token.tokenValue.slice(0, 12)}•••{token.tokenValue.slice(-4)}
                      </code>
                    </TableCell>
                    <TableCell>{statusBadge(token.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {format(new Date(token.createdAt), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs border-primary/20 text-primary hover:bg-primary/10 gap-1"
                          onClick={() => handleTest(token.id)} disabled={testingId === token.id}>
                          {testingId === token.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          {testingId === token.id ? t("testing") : t("test")}
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-destructive/20 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(token.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{t("noTokens")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
