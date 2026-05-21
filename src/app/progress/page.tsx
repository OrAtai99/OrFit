"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import { Card, Button, EmptyState, useToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { todayISO, dayNameHe, formatDate } from "@/lib/calculations";
import { getUserId } from "@/lib/use-user";
import { useState, useEffect, useRef } from "react";
import { Camera, X, GitCompare } from "lucide-react";
import type { ProgressPhoto } from "@/types";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

export const dynamic = "force-dynamic";

interface PhotoWithUrl extends ProgressPhoto {
  url: string;
}

export default function ProgressPage() {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [compare, setCompare] = useState<{ before: PhotoWithUrl; after: PhotoWithUrl } | null>(null);
  const [selectMode, setSelectMode] = useState<"none" | "first" | "second">("none");
  const [firstPick, setFirstPick] = useState<PhotoWithUrl | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("progress_photos")
      .select("*")
      .order("date", { ascending: false });
    if (data) {
      const withUrls: PhotoWithUrl[] = await Promise.all(
        (data as ProgressPhoto[]).map(async (p) => {
          const { data: signed } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { ...p, url: signed?.signedUrl ?? "" };
        })
      );
      setPhotos(withUrls.filter((p) => p.url));
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.show("יש לבחור קובץ תמונה", "error");
      return;
    }
    setUploading(true);
    try {
      const userId = await getUserId();
      if (!userId) {
        toast.show("אינך מחובר", "error");
        return;
      }
      const supabase = createClient();
      const compressed = await compressImage(file, 1080, 0.85);
      const date = todayISO();
      const path = `${userId}/${date}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("progress-photos")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
      if (upErr) {
        toast.show("שגיאת העלאה: " + upErr.message, "error");
        return;
      }
      const { data: weightRow } = await supabase
        .from("daily_weight")
        .select("weight_kg")
        .eq("date", date)
        .maybeSingle();
      const { error: insErr } = await supabase.from("progress_photos").insert({
        user_id: userId,
        date,
        storage_path: path,
        weight_at_time: weightRow?.weight_kg ?? null,
      });
      if (insErr) {
        toast.show("שגיאה: " + insErr.message, "error");
        return;
      }
      toast.show("תמונה נשמרה", "success");
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(p: PhotoWithUrl) {
    if (!confirm("למחוק את התמונה הזאת?")) return;
    const supabase = createClient();
    await supabase.storage.from("progress-photos").remove([p.storage_path]);
    await supabase.from("progress_photos").delete().eq("id", p.id);
    setPhotos((arr) => arr.filter((x) => x.id !== p.id));
  }

  function handlePhotoClick(p: PhotoWithUrl) {
    if (selectMode === "first") {
      setFirstPick(p);
      setSelectMode("second");
    } else if (selectMode === "second" && firstPick) {
      // older = before, newer = after
      const sorted = [firstPick, p].sort((a, b) => a.date.localeCompare(b.date));
      setCompare({ before: sorted[0], after: sorted[1] });
      setSelectMode("none");
      setFirstPick(null);
    }
  }

  return (
    <PageWrapper title="התקדמות">
      <div className="space-y-4">
        <Card>
          <div className="flex gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                if (fileInput.current) fileInput.current.value = "";
              }}
              className="hidden"
            />
            <Button
              onClick={() => fileInput.current?.click()}
              loading={uploading}
              variant="primary"
              size="lg"
              fullWidth
            >
              <Camera size={18} /> הוסף תמונה היום
            </Button>
            {photos.length >= 2 && (
              <Button
                onClick={() => {
                  if (selectMode === "none") {
                    setSelectMode("first");
                  } else {
                    setSelectMode("none");
                    setFirstPick(null);
                  }
                }}
                variant={selectMode !== "none" ? "secondary" : "outline"}
                size="lg"
              >
                <GitCompare size={18} />
              </Button>
            )}
          </div>
          {selectMode !== "none" && (
            <p className="text-xs text-primary mt-2 text-center">
              {selectMode === "first" ? "בחר תמונה ראשונה להשוואה" : "בחר תמונה שנייה"}
            </p>
          )}
        </Card>

        {compare && (
          <Card noPadding className="overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
              <p className="text-sm font-medium">השוואה</p>
              <button
                onClick={() => setCompare(null)}
                className="w-8 h-8 rounded-lg bg-[var(--border)]/40 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={compare.before.url}
                  alt="לפני"
                  style={{ objectFit: "cover" }}
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={compare.after.url}
                  alt="אחרי"
                  style={{ objectFit: "cover" }}
                />
              }
              style={{ height: 400 }}
            />
            <div className="grid grid-cols-2 p-3 text-xs text-center">
              <div>
                <p className="text-muted">לפני</p>
                <p className="font-bold">{formatDate(compare.before.date)}</p>
                {compare.before.weight_at_time && (
                  <p className="text-primary">{compare.before.weight_at_time} ק&quot;ג</p>
                )}
              </div>
              <div>
                <p className="text-muted">אחרי</p>
                <p className="font-bold">{formatDate(compare.after.date)}</p>
                {compare.after.weight_at_time && (
                  <p className="text-primary">{compare.after.weight_at_time} ק&quot;ג</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {photos.length === 0 && loaded && (
          <Card>
            <EmptyState
              icon={Camera}
              title="עוד אין תמונות"
              description="צלם או העלה את התמונה הראשונה. המאמן ימליץ לצלם בכל ראש חודש כדי לעקוב אחר שינויים שהמשקל לא מראה."
            />
          </Card>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <button
                key={p.id}
                onClick={() => (selectMode !== "none" ? handlePhotoClick(p) : null)}
                className={
                  "relative rounded-2xl overflow-hidden bg-[var(--card)] border " +
                  (selectMode !== "none" && firstPick?.id === p.id
                    ? "border-primary ring-2 ring-primary"
                    : "border-[var(--border)]")
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full aspect-[3/4] object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-right">
                  <p className="text-[11px]">{dayNameHe(p.date)}</p>
                  <p className="text-xs font-bold">{formatDate(p.date)}</p>
                  {p.weight_at_time && <p className="text-[11px]">{p.weight_at_time} ק&quot;ג</p>}
                </div>
                {selectMode === "none" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(p);
                    }}
                    className="absolute top-1 left-1 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center"
                    aria-label="מחק"
                  >
                    <X size={12} />
                  </button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

async function compressImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b!),
      "image/jpeg",
      quality
    );
  });
}
