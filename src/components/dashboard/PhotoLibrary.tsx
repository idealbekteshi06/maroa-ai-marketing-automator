import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const photoTypes = ["Product", "Team", "Interior", "Exterior", "Behind the scenes", "Lifestyle"];

interface Photo {
  id: string;
  photo_url: string;
  photo_type: string | null;
  description: string | null;
  is_active: boolean;
  use_count: number;
  last_used_at: string | null;
  uploaded_at: string;
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-2xl border border-border bg-card animate-pulse-soft" />)}
    </div>
  );
}

export default function PhotoLibrary() {
  const { businessId } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await externalSupabase
        .from("business_photos")
        .select("*")
        .eq("business_id", businessId)
        .order("uploaded_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch photos:", error);
        toast.error("Failed to load photos");
        return;
      }
      setPhotos((data as Photo[]) ?? []);
    } catch (err) {
      console.error("Photo fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !businessId) return;

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      try {
        const fileName = `${businessId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await externalSupabase.storage
          .from("business-photos")
          .upload(fileName, file);

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError);
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get the full public URL
        const { data: urlData } = externalSupabase.storage
          .from("business-photos")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        const { error: insertError } = await externalSupabase.from("business_photos").insert({
          business_id: businessId,
          photo_url: publicUrl,
          photo_type: "Product",
          description: file.name,
          is_active: true,
        });

        if (insertError) {
          console.error(`DB insert error for ${file.name}:`, insertError);
          toast.error(`Failed to save ${file.name}: ${insertError.message}`);
          continue;
        }

        successCount++;
      } catch (err) {
        console.error(`Unexpected error uploading ${file.name}:`, err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} photo${successCount > 1 ? "s" : ""} uploaded!`);
      // Immediately refresh the grid
      await fetchPhotos();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (photo: Photo) => {
    try {
      const url = new URL(photo.photo_url);
      const pathParts = url.pathname.split("/storage/v1/object/public/business-photos/");
      if (pathParts.length > 1) {
        const storagePath = decodeURIComponent(pathParts[1]);
        await externalSupabase.storage.from("business-photos").remove([storagePath]);
      }
    } catch (err) {
      console.warn("Could not delete from storage:", err);
    }

    const { error } = await externalSupabase.from("business_photos").delete().eq("id", photo.id);
    if (error) { toast.error("Failed to delete"); return; }
    
    // Optimistic removal from state
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    toast.success("Photo deleted");
  };

  if (loading && photos.length === 0) return <SkeletonGrid />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Your business photos used in AI-generated content.</p>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button size="sm" className="h-9 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Uploading...</> : <><Upload className="mr-2 h-3.5 w-3.5" /> Upload</>}
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card py-20 text-center cursor-pointer transition-colors hover:border-primary/30"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-5 text-base font-semibold text-foreground">Upload your business photos</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Add 5-10 photos of your products, team, and space. Our AI will use them to create stunning content.
          </p>
          <Button className="mt-6" size="sm" variant="outline">Choose files</Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-card-hover">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.description ?? "Photo"} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs">{p.description}</div>
              )}
              <div className="absolute inset-0 flex items-start justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-b from-foreground/20 to-transparent">
                <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium text-foreground">{p.photo_type ?? "Uncategorized"}</span>
                <button onClick={() => handleDelete(p)} className="rounded-full bg-background/90 p-1.5 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {photoTypes.map((t) => (
          <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{t}</span>
        ))}
      </div>
    </div>
  );
}
