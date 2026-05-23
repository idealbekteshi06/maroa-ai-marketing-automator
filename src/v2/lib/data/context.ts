/**
 * Module-level handler context. Pages call setHandlerContext on mount
 * so action handlers can read the current user + business without
 * needing to thread props through every call site.
 *
 * Also exposes the QueryClient so handlers can invalidate caches
 * after mutations.
 */
import type { QueryClient } from "@tanstack/react-query";

interface HandlerContext {
  userId?: string;
  businessId?: string;
  queryClient?: QueryClient;
}

let ctx: HandlerContext = {};

export function setHandlerContext(next: Partial<HandlerContext>) {
  ctx = { ...ctx, ...next };
}

export function getHandlerContext(): HandlerContext {
  return ctx;
}

export function requireContext(): { userId: string; businessId: string } | null {
  if (!ctx.userId || !ctx.businessId) return null;
  return { userId: ctx.userId, businessId: ctx.businessId };
}
