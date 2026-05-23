/**
 * Products + Higgsfield pipeline.
 *
 * Flow: user pastes/uploads a product image URL → vetCustomerAsset scores it
 * across 8 dimensions → smartProcessAsset auto-branches (use-as-is / Soul I2I
 * enhance / regenerate fresh / reject). Generated assets are returned and
 * shown inline. Products are saved to localStorage until a backend table
 * exists.
 */
import { useState, useEffect } from "react";
import { Card, Btn, Pill } from "@/v2/components/common/Card";
import { Package, Upload, Sparkles, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { vetCustomerAsset, smartProcessAsset, type VetterVerdict } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { toast } from "sonner";

interface ProductPhoto {
  id: string;
  url: string;
  verdict?: VetterVerdict;
  generated?: string[];
  path?: string;
  status: "pending" | "vetting" | "processing" | "ready" | "rejected" | "error";
  error?: string;
}
interface Product {
  id: string;
  name: string;
  description: string;
  photos: ProductPhoto[];
  createdAt: string;
}

const STORAGE_KEY = "maroa-products";

function loadProducts(): Product[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function saveProducts(p: Product[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* */ }
}

const VERDICT_LABEL: Record<string, { tone: "success" | "info" | "warning" | "neutral"; label: string }> = {
  use_as_is: { tone: "success", label: "Use as-is" },
  needs_enhance: { tone: "info", label: "Enhanced" },
  enhance_via_higgsfield: { tone: "info", label: "Enhanced" },
  needs_regen: { tone: "warning", label: "Regenerated" },
  regenerate_fresh: { tone: "warning", label: "Regenerated" },
  reject: { tone: "neutral", label: "Rejected" },
};

export default function Products() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const businessId = business?.id;

  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => { saveProducts(products); }, [products]);

  async function runPipeline(productId: string, photoId: string, url: string, contentTheme: string) {
    if (!businessId) { toast.error("Loading your business…"); return; }
    setProducts((prev) => prev.map((p) => p.id !== productId ? p : ({
      ...p, photos: p.photos.map((ph) => ph.id !== photoId ? ph : { ...ph, status: "vetting" }),
    })));
    try {
      const verdict = await vetCustomerAsset({ businessId, imageUrl: url, contentTheme });
      const next: ProductPhoto["status"] =
        verdict.verdict === "reject" ? "rejected" :
        verdict.verdict === "use_as_is" ? "ready" : "processing";
      setProducts((prev) => prev.map((p) => p.id !== productId ? p : ({
        ...p, photos: p.photos.map((ph) => ph.id !== photoId ? ph : { ...ph, verdict, status: next }),
      })));
      if (verdict.verdict === "use_as_is" || verdict.verdict === "reject") return;

      const result = await smartProcessAsset({ businessId, imageUrl: url, contentTheme });
      setProducts((prev) => prev.map((p) => p.id !== productId ? p : ({
        ...p, photos: p.photos.map((ph) => ph.id !== photoId ? ph
          : { ...ph, verdict: result.verdict, generated: result.generated, path: result.path, status: "ready" }),
      })));
      toast.success("Product image processed", {
        description: `${result.generated.length} creative${result.generated.length === 1 ? "" : "s"} ready.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Pipeline failed";
      setProducts((prev) => prev.map((p) => p.id !== productId ? p : ({
        ...p, photos: p.photos.map((ph) => ph.id !== photoId ? ph : { ...ph, status: "error", error: msg }),
      })));
      toast.error("Couldn't process image", { description: msg });
    }
  }

  function addProduct() {
    if (!name.trim() || !imageUrl.trim()) {
      toast.error("Add a name and a product image URL");
      return;
    }
    const pid = `p-${Date.now()}`;
    const phid = `ph-${Date.now()}`;
    const newP: Product = {
      id: pid, name: name.trim(), description: description.trim(),
      photos: [{ id: phid, url: imageUrl.trim(), status: "pending" }],
      createdAt: new Date().toISOString(),
    };
    setProducts((p) => [newP, ...p]);
    setName(""); setDescription(""); setImageUrl(""); setCreating(false);
    runPipeline(pid, phid, newP.photos[0].url, `${newP.name}${newP.description ? " — " + newP.description : ""}`);
  }

  function removeProduct(id: string) {
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  function addPhotoToProduct(productId: string) {
    const url = window.prompt("Paste a product image URL");
    if (!url || !url.startsWith("http")) return;
    const phid = `ph-${Date.now()}`;
    setProducts((prev) => prev.map((p) => p.id !== productId ? p
      : { ...p, photos: [...p.photos, { id: phid, url, status: "pending" }] }));
    const product = products.find((p) => p.id === productId);
    runPipeline(productId, phid, url, `${product?.name ?? "Product"}${product?.description ? " — " + product.description : ""}`);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Products</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Upload your products once. Maroa scores each image and auto-creates publish-ready creatives.
          </p>
        </div>
        <Btn variant="primary" size="md" onClick={() => setCreating((v) => !v)}>
          <Upload size={13} />
          Add product
        </Btn>
      </header>

      {creating && (
        <Card title="New product">
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium block mb-1">Product name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                     placeholder="e.g. Lavender Hand Cream"
                     className="w-full h-10 px-3 rounded-lg text-[13px] outline-none focus:ring-2"
                     style={{ background: "hsl(var(--m-background))", border: "1px solid hsl(var(--m-border-subtle))" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium block mb-1">Short description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)}
                     placeholder="What it is, who it's for, key benefit"
                     className="w-full h-10 px-3 rounded-lg text-[13px] outline-none focus:ring-2"
                     style={{ background: "hsl(var(--m-background))", border: "1px solid hsl(var(--m-border-subtle))" }} />
            </div>
            <div>
              <label className="text-[12px] font-medium block mb-1">Product photo (public URL)</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                     placeholder="https://…/product.jpg"
                     className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none focus:ring-2"
                     style={{ background: "hsl(var(--m-background))", border: "1px solid hsl(var(--m-border-subtle))" }} />
              <p className="text-[11px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                Paste a hosted image URL. Direct file upload coming soon.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={addProduct}>
                <Sparkles size={13} />
                Add & analyze
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {products.length === 0 ? (
        <div className="rounded-xl px-6 py-16 text-center"
             style={{ background: "hsl(var(--m-surface-elevated))", border: "1px solid hsl(var(--m-border-subtle))" }}>
          <Package size={28} strokeWidth={1.5} className="mx-auto mb-3"
                   style={{ color: "hsl(var(--m-muted-foreground))" }} />
          <h2 className="text-[15px] font-semibold">No products yet</h2>
          <p className="text-[13px] mt-1 max-w-md mx-auto" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            Add a product and a photo. Maroa's AI scores the image across 8 dimensions, then either uses it,
            enhances it via Higgsfield Soul I2I, or generates fresh creatives.
          </p>
          <div className="mt-5">
            <Btn variant="primary" onClick={() => setCreating(true)}>
              <Upload size={13} />
              Add your first product
            </Btn>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {products.map((p) => (
            <Card key={p.id} title={p.name} action={
              <div className="flex items-center gap-2">
                <Btn variant="secondary" onClick={() => addPhotoToProduct(p.id)}>
                  <Upload size={13} />
                  Add photo
                </Btn>
                <Btn variant="ghost" onClick={() => removeProduct(p.id)}>
                  <X size={13} />
                </Btn>
              </div>
            }>
              {p.description && (
                <p className="text-[12.5px] mb-4" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  {p.description}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {p.photos.map((ph) => (
                  <div key={ph.id} className="rounded-lg overflow-hidden"
                       style={{ border: "1px solid hsl(var(--m-border-subtle))",
                                background: "hsl(var(--m-background))" }}>
                    <div className="aspect-[4/3] bg-black/5 overflow-hidden">
                      <img src={ph.url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <PhotoStatus status={ph.status} verdict={ph.verdict} />
                        {ph.verdict && (
                          <span className="text-[11px] font-mono tabular-nums"
                                style={{ color: "hsl(var(--m-muted-foreground))" }}>
                            {ph.verdict.total_100?.toFixed(0) ?? "—"}/100
                          </span>
                        )}
                      </div>
                      {ph.status === "error" && (
                        <p className="text-[11px]" style={{ color: "hsl(var(--m-destructive))" }}>{ph.error}</p>
                      )}
                      {ph.generated && ph.generated.length > 0 && (
                        <div>
                          <div className="text-[11px] font-medium mb-1.5">
                            {ph.generated.length} ready-to-post creative{ph.generated.length === 1 ? "" : "s"}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {ph.generated.slice(0, 3).map((g) => (
                              <a key={g} href={g} target="_blank" rel="noreferrer"
                                 className="aspect-square overflow-hidden rounded bg-black/5"
                                 style={{ border: "1px solid hsl(var(--m-border-subtle))" }}>
                                <img src={g} alt="Generated" className="w-full h-full object-cover" loading="lazy" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoStatus({ status, verdict }: { status: ProductPhoto["status"]; verdict?: VetterVerdict }) {
  if (status === "vetting") return <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}><Loader2 size={11} className="animate-spin" /> Scoring image…</span>;
  if (status === "processing") return <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}><Loader2 size={11} className="animate-spin" /> Generating creatives…</span>;
  if (status === "pending") return <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}><Loader2 size={11} className="animate-spin" /> Queued…</span>;
  if (status === "error") return <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "hsl(var(--m-destructive))" }}><AlertCircle size={11} /> Error</span>;
  if (status === "rejected") return <Pill tone="muted">Rejected</Pill>;
  if (status === "ready" && verdict) {
    const v = VERDICT_LABEL[verdict.verdict] ?? { tone: "neutral" as const, label: "Ready" };
    return <span className="inline-flex items-center gap-1"><CheckCircle2 size={11} style={{ color: "hsl(var(--m-success))" }} /><Pill tone={v.tone}>{v.label}</Pill></span>;
  }
  return <Pill tone="muted">Ready</Pill>;
}
