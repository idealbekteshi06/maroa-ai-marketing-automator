import { useEffect } from "react";

const DEFAULT_TITLE = "maroa.ai — AI Marketing for Every Business";

/**
 * Set the document title for the current route. Restores the previous title
 * on unmount so a tab that briefly mounts a route doesn't leave a stale title.
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.title;
    document.title = title && title.trim() ? `${title} · maroa.ai` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
