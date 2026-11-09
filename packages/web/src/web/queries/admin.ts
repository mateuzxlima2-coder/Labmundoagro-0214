import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "../lib/api";

export function useAdminLogin() {
  return useMutation(orpc.admin.login.mutationOptions());
}

export function useAdminOrders(key: string | null) {
  return useQuery({
    ...orpc.admin.list.queryOptions({ input: { key: key ?? "" } }),
    enabled: Boolean(key),
    refetchInterval: 30_000,
  });
}

export function useAdminUpdateStatus() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.updateStatus.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.key() }) }),
  );
}

export function useAdminMarkPaid() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.markPaid.mutationOptions({ onSuccess: () => qc.invalidateQueries({ queryKey: orpc.admin.key() }) }),
  );
}

export function useAdminPrices(key: string | null) {
  return useQuery({ ...orpc.admin.prices.queryOptions({ input: { key: key ?? "" } }), enabled: Boolean(key) });
}

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: orpc.admin.key() });
    qc.invalidateQueries({ queryKey: orpc.catalog.key() });
  };
}

export function useAdminUpdatePrices() {
  const inv = useInvalidateAll();
  return useMutation(orpc.admin.updatePrices.mutationOptions({ onSuccess: inv }));
}

export function useAdminResetPrices() {
  const inv = useInvalidateAll();
  return useMutation(orpc.admin.resetPrices.mutationOptions({ onSuccess: inv }));
}

export function useAdminReportUrl() {
  return useMutation(orpc.admin.reportUrl.mutationOptions());
}

export const MAX_REPORT_MB = 20;

/** Valida o PDF no navegador, pede URL assinada e envia direto ao storage. */
export function useUploadReport() {
  return useMutation({
    mutationFn: async ({ key, id, file }: { key: string; id: number; file: File }) => {
      if (file.type !== "application/pdf" || !/\.pdf$/i.test(file.name)) throw new Error("Envie apenas arquivos PDF.");
      if (file.size === 0) throw new Error("O arquivo está vazio.");
      if (file.size > MAX_REPORT_MB * 1024 * 1024) throw new Error(`O PDF deve ter no máximo ${MAX_REPORT_MB} MB.`);
      const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (String.fromCharCode(...head) !== "%PDF-") throw new Error("O arquivo não parece ser um PDF válido.");
      const { url, objectKey } = await client.admin.presignReport({
        key,
        id,
        filename: file.name,
        contentType: "application/pdf",
        size: file.size,
      });
      const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf" } });
      if (!res.ok) throw new Error(`Falha no upload (HTTP ${res.status}). Tente novamente.`);
      return { objectKey, name: file.name };
    },
  });
}
