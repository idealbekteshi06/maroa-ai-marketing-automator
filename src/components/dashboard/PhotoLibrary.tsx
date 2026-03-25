import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const photoTypes = ["Product", "Team", "Interior", "Exterior", "Behind the scenes", "Lifestyle"];

interface Photo {
  id: string;
  photo_url: string;
  photo_type: string | null;
  file_name: string | null;
}

export default function PhotoLibrary() {
  const { businessId } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    if (!businessId) return;
    setLoading(true);
    const { data } = await externalSupabase
      .from("business_photos")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setPhotos((data as Photo[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPhotos(); }, [businessId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !businessId) return;

    for (const file of Array.from(files)) {
      const fileName = `${businessId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await externalSupabase.storage
        .from("business-photos")
        .upload(fileName, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = externalSupabase.storage
        .from("business-photos")
        .getPublicUrl(fileName);

      await externalSupabase.from("business_photos").insert({
        business_id: businessId,
        photo_url: urlData.publicUrl,
        file_name: file.name,
        photo_type: "Product",
      });
    }

    toast.success("Photos uploaded!");
    fetchPhotos();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    const { error } = await externalSupabase.from("business_photos").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Photo deleted");
    fetchPhotos();
  };

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 pb-20 md:pb-0">
        {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Your business photos used in AI-generated content.</p>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">No photos yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Upload your business photos to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square rounded-2xl bg-muted overflow-hidden">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.file_name ?? "Photo"} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs">{p.file_name}</div>
              )}
              <div className="absolute inset-0 flex items-start justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="rounded-full bg-background/80 px-2 py-1 text-[10px] font-medium text-foreground">{p.photo_type ?? "Uncategorized"}</span>
                <button onClick={() => handleDelete(p.id)} className="rounded-full bg-background/80 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">Photo types: {photoTypes.join(", ")}</div>
    </div>
  );
}
