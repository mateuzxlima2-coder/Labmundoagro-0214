import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useCatalog() {
  return useQuery(orpc.catalog.list.queryOptions({ staleTime: 5 * 60_000 }));
}

export function useSlots(date: string | undefined, method: "lab" | "coleta") {
  return useQuery({
    ...orpc.catalog.slots.queryOptions({ input: { date: date ?? "", method } }),
    enabled: Boolean(date),
  });
}

export function useCreateOrder() {
  return useMutation(orpc.orders.create.mutationOptions());
}

export function useTrack(code: string | undefined) {
  return useQuery({
    ...orpc.orders.track.queryOptions({ input: { code: code ?? "" } }),
    enabled: Boolean(code),
    retry: false,
  });
}

function useInvalidateOrders() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: orpc.orders.key() });
}

export function useAddTracking() {
  const inv = useInvalidateOrders();
  return useMutation(orpc.orders.addTracking.mutationOptions({ onSuccess: inv }));
}

export function usePaymentConfig() {
  return useQuery(orpc.payments.config.queryOptions({ staleTime: 5 * 60_000 }));
}

export function useCreateCheckout() {
  return useMutation(orpc.payments.createCheckout.mutationOptions());
}

export function useVerifyStripe() {
  const inv = useInvalidateOrders();
  return useMutation(orpc.payments.verifyStripe.mutationOptions({ onSuccess: inv }));
}

export function useConfirmSimulated() {
  const inv = useInvalidateOrders();
  return useMutation(orpc.payments.confirmSimulated.mutationOptions({ onSuccess: inv }));
}

export function useSetPaymentMethod() {
  const inv = useInvalidateOrders();
  return useMutation(orpc.payments.setMethod.mutationOptions({ onSuccess: inv }));
}

export function useReportUrl() {
  return useMutation(orpc.orders.reportUrl.mutationOptions());
}
