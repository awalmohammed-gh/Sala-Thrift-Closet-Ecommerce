"use client";

import Image from "next/image";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FiArrowLeft, FiArrowRight, FiImage, FiPlus, FiStar, FiTrash2, FiUploadCloud } from "react-icons/fi";
import type { ImageAsset, UploadFolder } from "@salasty-thrift-closet/shared";
import { Spinner } from "@/components/ui/Spinner";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

async function uploadFile(file: File, folder: UploadFolder): Promise<ImageAsset> {
  if (!ACCEPT.includes(file.type)) throw new Error(`${file.name}: use a JPEG, PNG, WebP or AVIF image.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 4 MB.`);
  const form = new FormData();
  form.append("image", file);
  return api.post<ImageAsset>(`/admin/uploads?folder=${folder}`, form);
}

interface MultiProps {
  value: ImageAsset[];
  onChange: (images: ImageAsset[]) => void;
  folder: UploadFolder;
  max: number;
  hint?: string;
  error?: string;
}

/** Uploads straight to the API (which stores them in Cloudinary). The first image is the main image. */
export function ImageListUploader({ value, onChange, folder, max, hint, error }: MultiProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await uploadFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (!uploading) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: handleDrop,
  };

  async function uploadFiles(selected: File[]) {
    const files = selected.slice(0, Math.max(0, max - value.length));
    if (!files.length) return;
    setUploadError(null);
    setUploading(files.length);
    const uploaded: ImageAsset[] = [];
    const failures: string[] = [];
    for (const file of files) {
      try {
        uploaded.push(await uploadFile(file, folder));
      } catch (e) {
        failures.push(errorMessage(e));
      }
      setUploading((n) => n - 1);
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    if (failures.length) setUploadError(failures.join(" "));
  }

  const move = (index: number, delta: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item!);
    onChange(next);
  };

  const makeMain = (index: number) => onChange([value[index]!, ...value.filter((_, i) => i !== index)]);
  const empty = value.length === 0 && uploading === 0;
  const iconButton = "flex size-9 items-center justify-center rounded-lg bg-white/95 text-ink shadow-sm transition-colors hover:bg-white disabled:opacity-30";

  return (
    <div className="space-y-3">
      {empty ? (
        <label
          htmlFor={inputId}
          {...dropHandlers}
          className={cn(
            "flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors sm:min-h-80",
            dragging ? "border-brand bg-brand-50" : error ? "border-danger bg-danger-50" : "border-brand/30 bg-brand-50/40 hover:border-brand hover:bg-brand-50",
          )}
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-white text-brand shadow-card">
            <FiUploadCloud className="size-8" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold text-ink">{dragging ? "Drop your photos here" : "Tap to add photos"}</span>
          <span className="hidden text-sm text-muted sm:block">or drag and drop them here</span>
          <span className="mt-1 inline-flex min-h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm">Choose photos</span>
        </label>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((image, index) => (
            <li key={image.publicId} className={cn("group relative aspect-square overflow-hidden rounded-2xl border border-line bg-cream-200", index === 0 && "col-span-2 row-span-2")}>
              <Image src={image.url} alt="" fill sizes={index === 0 ? "(min-width: 640px) 400px, 90vw" : "200px"} className="object-cover" />
              {index === 0 ? (
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                  <FiStar className="size-3.5 fill-current" aria-hidden="true" /> Main photo
                </span>
              ) : (
                <button type="button" onClick={() => makeMain(index)} className="absolute left-2 top-2 inline-flex min-h-8 items-center gap-1 rounded-full bg-white/95 px-2.5 text-xs font-semibold text-ink shadow-sm hover:bg-white" aria-label={`Make photo ${index + 1} the main photo`}>
                  <FiStar className="size-3.5" aria-hidden="true" /> Make main
                </button>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1.5 bg-linear-to-t from-black/60 to-transparent p-2 pt-6">
                <div className="flex gap-1.5">
                  <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className={iconButton} aria-label="Move photo left">
                    <FiArrowLeft className="size-4" />
                  </button>
                  <button type="button" disabled={index === value.length - 1} onClick={() => move(index, 1)} className={iconButton} aria-label="Move photo right">
                    <FiArrowRight className="size-4" />
                  </button>
                </div>
                <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className={cn(iconButton, "text-danger")} aria-label="Remove photo">
                  <FiTrash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <li key={`uploading-${i}`} className={cn("flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 bg-brand-50 text-sm font-medium text-brand", value.length === 0 && i === 0 && "col-span-2 row-span-2")}>
              <Spinner label="Uploading" />
              Uploading…
            </li>
          ))}
          {value.length + uploading < max && (
            <li>
              <label
                htmlFor={inputId}
                {...dropHandlers}
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center text-sm font-semibold transition-colors",
                  dragging ? "border-brand bg-brand-50 text-brand" : error ? "border-danger text-danger" : "border-brand/30 bg-brand-50/40 text-brand hover:border-brand hover:bg-brand-50",
                )}
              >
                <FiPlus className="size-7" aria-hidden="true" />
                Add more
                <span className="text-xs font-normal text-muted">{value.length} of {max}</span>
              </label>
            </li>
          )}
        </ul>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        className="sr-only"
        onChange={handleFiles}
        disabled={uploading > 0}
      />
      <p className="text-xs text-muted">{hint ?? `Up to ${max} images, 4 MB each. JPEG, PNG, WebP or AVIF. The first image is shown on product cards.`}</p>
      {(uploadError || error) && (
        <p className="text-xs font-medium text-danger" role="alert">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}

interface SingleProps {
  label: string;
  value: ImageAsset | null;
  onChange: (image: ImageAsset | null) => void;
  folder: UploadFolder;
  hint?: string;
  aspect?: string;
  error?: string;
  required?: boolean;
}

export function SingleImageUploader({ label, value, onChange, folder, hint, aspect = "aspect-video", error, required }: SingleProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      onChange(await uploadFile(file, folder));
    } catch (e) {
      setUploadError(errorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
      </p>
      <div className={cn("relative overflow-hidden rounded-xl border bg-cream-200", aspect, error ? "border-danger" : "border-line")}>
        {value ? (
          <Image src={value.url} alt="" fill sizes="480px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted">
            <FiImage className="size-7" aria-hidden="true" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-brand">
            <Spinner label="Uploading" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={inputId}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-brand/40 hover:bg-brand-50"
        >
          <FiUploadCloud className="size-4" aria-hidden="true" /> {value ? "Replace" : "Upload"}
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-50">
            <FiTrash2 className="size-4" aria-hidden="true" /> Remove
          </button>
        )}
      </div>
      <input id={inputId} type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={handleFile} disabled={uploading} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {(uploadError || error) && (
        <p className="text-xs font-medium text-danger" role="alert">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}
