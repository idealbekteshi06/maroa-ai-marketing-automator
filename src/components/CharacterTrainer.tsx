import { useEffect, useState } from "react";
import {
  characterCreate,
  characterTrain,
  charactersList,
  characterSetDefault,
  type BusinessCharacter,
} from "@/lib/api";

interface Props {
  businessId: string;
  onTrained?: (characterId: string) => void;
}

const CHARACTER_TYPES: BusinessCharacter["character_type"][] = [
  "founder",
  "mascot",
  "model_persona",
  "customer_proxy",
  "other",
];

export function CharacterTrainer({ businessId, onTrained }: Props) {
  const [characters, setCharacters] = useState<BusinessCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // New-character form state
  const [name, setName] = useState("");
  const [type, setType] = useState<BusinessCharacter["character_type"]>("founder");
  const [makeDefault, setMakeDefault] = useState(false);
  const [imageUrlsText, setImageUrlsText] = useState("");

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8000); // poll while training
    return () => clearInterval(interval);
  }, [businessId]);

  async function refresh() {
    try {
      const r = await charactersList({ businessId });
      setCharacters(r.characters || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function create() {
    const urls = imageUrlsText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http"));
    if (urls.length === 0) {
      setErr("Paste at least 1 reference photo URL (5+ photos = much stronger Soul ID)");
      return;
    }
    if (!name.trim()) {
      setErr("Name the character (e.g. 'founder', 'sarah')");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await characterCreate({
        businessId,
        name: name.trim(),
        type,
        sourceImageUrls: urls,
        makeDefault,
      });
      // Auto-kick off training
      await characterTrain({ businessId, characterId: r.characterId });
      setName("");
      setImageUrlsText("");
      setMakeDefault(false);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function trainExisting(c: BusinessCharacter) {
    setBusy(c.id);
    try {
      await characterTrain({ businessId, characterId: c.id });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function setDefault(c: BusinessCharacter) {
    setBusy(c.id);
    try {
      await characterSetDefault({ businessId, characterId: c.id });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold">Train a Soul ID character</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload 1-5 reference photos to lock identity consistency across every generation.
          More photos (10-20) = stronger Soul ID. ~40 credits / ~$2.50 per character.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="founder, sarah, mascot"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
            />
          </label>
          <label className="text-xs">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BusinessCharacter["character_type"])}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
            >
              {CHARACTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-xs">
          Reference image URLs (comma or newline separated)
          <textarea
            value={imageUrlsText}
            onChange={(e) => setImageUrlsText(e.target.value)}
            placeholder="https://...photo1.jpg&#10;https://...photo2.jpg"
            rows={4}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
            disabled={loading}
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
            disabled={loading}
          />
          Make default (used when no character_id specified)
        </label>
        <button
          type="button"
          onClick={create}
          disabled={loading || !name.trim() || !imageUrlsText.trim()}
          className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating + training…" : "Create & Train"}
        </button>
        {err ? <div className="mt-2 text-xs text-destructive">{err}</div> : null}
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold">Trained characters</div>
        {characters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No characters yet. Train one above.
          </div>
        ) : (
          <ul className="space-y-2">
            {characters.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.character_type}</span>
                    {c.is_default ? <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] uppercase text-primary">default</span> : null}
                    <StatusBadge status={c.training_status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.source_image_count} reference photo{c.source_image_count === 1 ? "" : "s"}
                    {c.higgsfield_character_id ? ` · HF id: ${c.higgsfield_character_id.slice(0, 12)}…` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  {c.training_status === "ready" && !c.is_default ? (
                    <button
                      type="button"
                      onClick={() => setDefault(c)}
                      disabled={busy === c.id}
                      className="rounded-md border border-border px-3 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                    >
                      Set default
                    </button>
                  ) : null}
                  {c.training_status === "failed" || c.training_status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => trainExisting(c)}
                      disabled={busy === c.id}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {busy === c.id ? "Training…" : c.training_status === "failed" ? "Retry" : "Train"}
                    </button>
                  ) : null}
                  {c.training_status === "ready" ? (
                    <button
                      type="button"
                      onClick={() => onTrained?.(c.id)}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      Use →
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BusinessCharacter["training_status"] }) {
  const cls =
    status === "ready"
      ? "bg-emerald-500/20 text-emerald-700"
      : status === "training" || status === "uploading"
        ? "bg-amber-500/20 text-amber-700 animate-pulse"
        : status === "failed"
          ? "bg-destructive/20 text-destructive"
          : "bg-muted text-muted-foreground";
  return <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${cls}`}>{status}</span>;
}
