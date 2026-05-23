/**
 * Syncs the module-level handler context (user + business + query
 * client) so action handlers can call the backend without props.
 *
 * Mounted once at the top of AppShell.
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { setHandlerContext } from "./context";

export function useSyncHandlerContext() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    setHandlerContext({
      userId: user?.id,
      businessId: business?.id,
      queryClient,
    });
  }, [user?.id, business?.id, queryClient]);
}
