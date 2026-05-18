import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV } from "./nav";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or ask Maroa…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/app/content")}>Generate posts</CommandItem>
          <CommandItem onSelect={() => go("/app/ads")}>New campaign</CommandItem>
          <CommandItem onSelect={() => go("/app/landing-pages")}>
            Create landing page
          </CommandItem>
          <CommandItem onSelect={() => go("/app/reviews")}>Reply to reviews</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        {NAV.map((group) => (
          <CommandGroup key={group.label} heading={`Go to · ${group.label}`}>
            {group.items.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => go(`/app${item.to ? `/${item.to}` : ""}`)}
              >
                <item.icon size={14} strokeWidth={1.5} className="mr-2" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
