import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

const photoTypes = ["Product", "Team", "Interior", "Exterior", "Behind the scenes", "Lifestyle"];

const samplePhotos = [
  { id: 1, type: "Product", name: "croissants.jpg" },
  { id: 2, type: "Interior", name: "shop-front.jpg" },
  { id: 3, type: "Team", name: "bakers.jpg" },
  { id: 4, type: "Product", name: "birthday-cake.jpg" },
];

export default function PhotoLibrary() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Your business photos used in AI-generated content.</p>
        <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {samplePhotos.map((p) => (
          <div key={p.id} className="group relative aspect-square rounded-2xl bg-muted overflow-hidden">
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">{p.name}</div>
            <div className="absolute inset-0 flex items-start justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="rounded-full bg-background/80 px-2 py-1 text-[10px] font-medium text-foreground">{p.type}</span>
              <button className="rounded-full bg-background/80 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">Photo types: {photoTypes.join(", ")}</div>
    </div>
  );
}
