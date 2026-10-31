"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { FiCheck, FiEye, FiImage, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  LIMITS,
  categoryInputSchema,
  flattenIssues,
  formatGHS,
  parseCedisToPesewas,
  pesewasToInput,
  productInputSchema,
  slugify,
  variantLabel,
  type AdminProductDTO,
  type CategoryDTO,
  type ImageAsset,
  type ProductInput,
} from "@salasty-thrift-closet/shared";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Toggle } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ApiClientError, api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ImageListUploader } from "./ImageUploader";
import { parseValues, rowKey, syncVariants, type OptionRow, type VariantRow } from "./productOptions";

const isSize = (option: OptionRow) => /^size$/i.test(option.name.trim());
const isColour = (option: OptionRow) => /^(colou?r)$/i.test(option.name.trim());
const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "One size"] as const;
const COLOUR_PALETTE = [
  { name: "Black", hex: "#171717" },
  { name: "White", hex: "#ffffff" },
  { name: "Grey", hex: "#808080" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Sky blue", hex: "#7dd3fc" },
  { name: "Red", hex: "#dc2626" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Pink", hex: "#f472b6" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Green", hex: "#16a34a" },
  { name: "Olive", hex: "#808000" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Orange", hex: "#f97316" },
  { name: "Brown", hex: "#92400e" },
  { name: "Beige", hex: "#d8c3a5" },
  { name: "Cream", hex: "#fff1d6" },
  { name: "Gold", hex: "#d4af37" },
  { name: "Silver", hex: "#c0c0c0" },
] as const;

interface FormState {
  name: string;
  slug: string;
  description: string;
  category: string;
  subCategory: string;
  regularPrice: string;
  discountPrice: string;
  images: ImageAsset[];
  hasVariants: boolean;
  options: OptionRow[];
  variants: VariantRow[];
  stock: string;
  lowStockThreshold: string;
  isFeatured: boolean;
  isActive: boolean;
}

function fromProduct(product?: AdminProductDTO | null): FormState {
  if (!product) {
    return {
      name: "",
      slug: "",
      description: "",
      category: "",
      subCategory: "",
      regularPrice: "",
      discountPrice: "",
      images: [],
      hasVariants: false,
      options: [],
      variants: [],
      stock: "0",
      lowStockThreshold: String(LIMITS.defaultLowStockThreshold),
      isFeatured: false,
      isActive: true,
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category?.id ?? "",
    subCategory: product.subCategory ?? "",
    regularPrice: pesewasToInput(product.compareAtPrice ?? product.price),
    discountPrice: product.compareAtPrice ? pesewasToInput(product.price) : "",
    images: product.images,
    hasVariants: product.variants.length > 0,
    options: product.options.length
      ? product.options.map((o) => ({ key: rowKey(), name: o.name, valuesText: o.values.join(", ") }))
      : [],
    variants: product.variants.map((v) => ({
      key: rowKey(),
      id: v.id,
      attributes: v.attributes,
      sku: v.sku ?? "",
      price: pesewasToInput(v.price),
      stock: String(v.stock),
      isActive: v.isActive,
    })),
    stock: String(product.variants.length ? 0 : product.stock),
    lowStockThreshold: String(product.lowStockThreshold),
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  };
}

/** Maps API/schema error paths to form field names. */
function mapErrors(fields: Record<string, string>, hasDiscount: boolean): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, message] of Object.entries(fields)) {
    let key = path;
    if (path === "compareAtPrice") key = "regularPrice";
    else if (path === "price") key = hasDiscount ? "discountPrice" : "regularPrice";
    else if (/^variants\.\d+\.compareAtPrice$/.test(path)) key = path.replace("compareAtPrice", "price");
    if (!(key in result)) result[key] = message;
  }
  return result;
}

/** One numbered card in the form. The number turns into a tick once the step is filled in. */
function Step({ id, number, title, description, done, optional, children }: { id: string; number: number; title: string; description: string; done?: boolean; optional?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-24 rounded-2xl border border-line bg-white shadow-card">
      <header className="flex items-start gap-3 border-b border-line px-4 py-4 sm:px-6">
        <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors", done ? "bg-success text-white" : "bg-brand-50 text-brand")}>
          {done ? <FiCheck className="size-4" /> : number}
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-base font-semibold text-ink">
            {title}
            {optional && <span className="ml-2 rounded-full bg-cream-200 px-2 py-0.5 align-middle text-[11px] font-medium text-muted">Optional</span>}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </header>
      <div className="space-y-5 p-4 sm:p-6">{children}</div>
    </section>
  );
}

/** Tap-to-select pill used for categories, sizes and colours. */
function Chip({ selected, onClick, disabled, children }: { selected: boolean; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand/50 hover:bg-brand-50",
      )}
    >
      {children}
      {selected && <FiCheck aria-hidden="true" className="size-3.5" />}
    </button>
  );
}

interface ProductFormProps {
  product?: AdminProductDTO | null;
  categories: CategoryDTO[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>(() => fromProduct(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [addedCategories, setAddedCategories] = useState<CategoryDTO[]>([]);
  const [categoryName, setCategoryName] = useState(product?.category?.name ?? "");
  const [categoryError, setCategoryError] = useState("");
  const availableCategories = [...categories, ...addedCategories.filter((added) => !categories.some((category) => category.id === added.id))];

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const pickCategory = (name: string) => {
    setCategoryName(name);
    setCategoryError("");
    setDirty(true);
  };

  const setOptions = (options: OptionRow[]) => {
    setForm((f) => {
      const variants = syncVariants(options, f.variants);
      if (!f.hasVariants && variants.length === 1) variants[0]!.stock = f.stock;
      const stock = !options.length && f.hasVariants ? String(f.variants.filter((variant) => variant.isActive).reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0)) : f.stock;
      return { ...f, options, variants, hasVariants: options.length > 0, stock };
    });
    setDirty(true);
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !/^(options|variants|stock)/.test(key))));
  };

  const setOptionValues = (matches: (option: OptionRow) => boolean, name: string, valuesText: string) => {
    const option = form.options.find(matches);
    if (!valuesText.trim()) setOptions(form.options.filter((item) => item !== option));
    else if (option) setOptions(form.options.map((item) => item === option ? { ...item, valuesText } : item));
    else if (form.options.length >= LIMITS.maxProductOptions) toast.error("Remove another option before adding this one.");
    else setOptions([...form.options, { key: rowKey(), name, valuesText }]);
  };

  const toggleValue = (matches: (option: OptionRow) => boolean, name: string, value: string) => {
    const current = parseValues(form.options.find(matches)?.valuesText ?? "");
    const selected = current.some((item) => item.toLowerCase() === value.toLowerCase());
    setOptionValues(matches, name, (selected ? current.filter((item) => item.toLowerCase() !== value.toLowerCase()) : [...current, value]).join(", "));
  };

  const updateVariant = (key: string, patch: Partial<VariantRow>) => {
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }));
    setDirty(true);
  };

  /** Bring the first problem into view so it is never hidden further down the page. */
  const focusFirstError = () => requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());

  function buildPayload(category: string): { payload?: ProductInput; errors?: Record<string, string> } {
    const errs: Record<string, string> = {};
    const regular = parseCedisToPesewas(form.regularPrice);
    const discount = form.discountPrice.trim() ? parseCedisToPesewas(form.discountPrice) : null;
    if (regular === null) errs.regularPrice = "Enter a price like 45 or 45.50";
    if (form.discountPrice.trim() && discount === null) errs.discountPrice = "Enter a price like 39.99";

    const variants = form.hasVariants
      ? form.variants.map((v, i) => {
          const price = v.price.trim() ? parseCedisToPesewas(v.price) : null;
          if (v.price.trim() && price === null) errs[`variants.${i}.price`] = "Invalid price";
          const stock = Number(v.stock);
          if (!Number.isInteger(stock) || stock < 0) errs[`variants.${i}.stock`] = "Whole number";
          return { id: v.id, attributes: v.attributes, sku: v.sku.trim() || null, price, stock, isActive: v.isActive };
        })
      : [];

    const stock = Number(form.stock);
    if (!form.hasVariants && (!Number.isInteger(stock) || stock < 0)) errs.stock = "Enter a whole number, 0 or more";
    const threshold = Number(form.lowStockThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) errs.lowStockThreshold = "Enter a whole number";
    if (Object.keys(errs).length) return { errors: errs };

    const payload = {
      name: form.name,
      slug: form.slug.trim() ? slugify(form.slug) : undefined,
      description: form.description,
      category,
      subCategory: form.subCategory,
      price: discount ?? regular!,
      compareAtPrice: discount !== null ? regular : null,
      images: form.images,
      options: form.hasVariants
        ? form.options.map((o) => ({ name: o.name.trim(), values: parseValues(o.valuesText) }))
        : [],
      variants,
      stock: form.hasVariants ? 0 : stock,
      lowStockThreshold: threshold,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    const check = productInputSchema.safeParse(payload);
    if (!check.success) return { errors: mapErrors(flattenIssues(check.error.issues), discount !== null) };
    return { payload: check.data };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const categoryCheck = categoryInputSchema.safeParse({ name: categoryName });
    if (!categoryCheck.success) {
      setCategoryError(flattenIssues(categoryCheck.error.issues).name ?? "Enter a category name.");
      focusFirstError();
      return;
    }
    setCategoryError("");
    const existingCategory = availableCategories.find((category) => category.name.toLowerCase() === categoryCheck.data.name.toLowerCase());
    // Validate the full product before creating a new category. Replace the temporary ID before saving.
    const { payload, errors: clientErrors } = buildPayload(existingCategory?.id ?? "000000000000000000000000");
    if (clientErrors) {
      setErrors(clientErrors);
      toast.error("Please fix the highlighted fields.");
      focusFirstError();
      return;
    }
    if (!payload) return;
    setErrors({});
    setSaving(true);
    try {
      let category = existingCategory;
      if (!category) {
        try {
          category = await api.post<CategoryDTO>("/admin/categories", categoryCheck.data);
        } catch (error) {
          setCategoryError(error instanceof ApiClientError ? error.message : "Could not save the category. Try again.");
          return;
        }
        const createdCategory = category;
        setAddedCategories((current) => [...current, createdCategory]);
      }
      payload.category = category.id;
      if (product) {
        const saved = await api.patch<AdminProductDTO>(`/admin/products/${product.id}`, payload);
        setForm(fromProduct(saved));
        setDirty(false);
        toast.success("Product saved");
        router.refresh();
      } else {
        const saved = await api.post<AdminProductDTO>("/admin/products", payload);
        setDirty(false);
        toast.success(`${saved.name} created`);
        router.push("/admin/products");
      }
    } catch (error) {
      if (error instanceof ApiClientError && Object.keys(error.fieldErrors).length) {
        setErrors(mapErrors(error.fieldErrors, !!form.discountPrice.trim()));
        focusFirstError();
      }
      toast.error(error instanceof ApiClientError ? error.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  }

  const sizeOption = form.options.find(isSize);
  const colourOption = form.options.find(isColour);
  const selectedSizes = parseValues(sizeOption?.valuesText ?? "");
  const selectedColours = parseValues(colourOption?.valuesText ?? "");
  const isPicked = (values: string[], value: string) => values.some((item) => item.toLowerCase() === value.toLowerCase());
  const extraOptions = form.options.filter((option) => option !== sizeOption && option !== colourOption);
  const optionError = (option: OptionRow | undefined) => {
    const index = option ? form.options.indexOf(option) : -1;
    return errors[`options.${index}.values`] || errors[`options.${index}.name`];
  };
  const discountValue = parseCedisToPesewas(form.discountPrice);
  const regularValue = parseCedisToPesewas(form.regularPrice);
  const savings = discountValue !== null && regularValue !== null && regularValue > discountValue ? Math.floor(((regularValue - discountValue) * 100) / regularValue) : null;
  const totalStock = form.hasVariants
    ? form.variants.filter((variant) => variant.isActive).reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0)
    : Number(form.stock) || 0;
  const hasError = (pattern: RegExp) => Object.entries(errors).some(([key, message]) => message && pattern.test(key));

  const steps = [
    { id: "product-photos", label: "Photos", done: form.images.length > 0, error: hasError(/^images/) },
    { id: "product-details", label: "Name & category", done: !!form.name.trim() && !!categoryName.trim(), error: !!categoryError || hasError(/^(name|category|description|slug)/) },
    { id: "product-price", label: "Price", done: regularValue !== null && regularValue > 0, error: hasError(/^(regularPrice|discountPrice)/) },
    { id: "product-stock", label: "Sizes & stock", done: totalStock > 0, error: hasError(/^(stock|options|variants)/) },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const cover = form.images[0];

  const actions = (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/admin/products")} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" className="flex-2" loading={saving}>
        {product ? "Save changes" : "Add product"}
      </Button>
    </div>
  );

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div className="min-w-0 space-y-5">
        <nav aria-label="Form steps" className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 xl:hidden">
          {steps.map((step, index) => (
            <a key={step.id} href={`#${step.id}`} className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold", step.error ? "border-danger/40 bg-danger-50 text-danger" : step.done ? "border-success/30 bg-success-50 text-success" : "border-line bg-white text-ink")}>
              {step.done && !step.error ? <FiCheck aria-hidden="true" className="size-3.5" /> : <span aria-hidden="true">{index + 1}</span>}
              {step.label}
            </a>
          ))}
        </nav>

        <Step id="product-photos" number={1} title="Photos" description="Add clear photos of the item. The first photo is the one shoppers see first." done={steps[0]!.done}>
          <ImageListUploader value={form.images} onChange={(images) => set("images", images)} folder="products" max={LIMITS.maxProductImages} error={errors.images} hint={`Up to ${LIMITS.maxProductImages} photos, 4 MB each (JPEG, PNG, WebP or AVIF). Tap "Make main" to change the cover photo.`} />
        </Step>

        <Step id="product-details" number={2} title="Name & category" description="What is it, and where should shoppers find it?" done={steps[1]!.done}>
          <Input label="Product name" required value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} maxLength={120} placeholder="e.g. Vintage wide-leg jeans" />
          <div className="space-y-2.5">
            <Input label="Category" required value={categoryName} onChange={(event) => pickCategory(event.target.value)} maxLength={60} placeholder="e.g. Jeans, Tops or Jackets" hint={availableCategories.length ? "Tap a category below, or type a new one." : "Type a category. We will create it for you."} error={categoryError || errors.category} disabled={saving} />
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Your categories">
                {availableCategories.map((category) => (
                  <Chip key={category.id} selected={categoryName.trim().toLowerCase() === category.name.toLowerCase()} onClick={() => pickCategory(category.name)} disabled={saving}>
                    {category.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => set("description", e.target.value)} error={errors.description} maxLength={5000} rows={3} placeholder="Condition, fit, fabric, measurements…" hint="Optional, but it helps shoppers decide." />
        </Step>

        <Step id="product-price" number={3} title="Price" description="Set what shoppers pay. Add a sale price to show a discount." done={steps[2]!.done}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Price" required inputMode="decimal" leading="GHS" value={form.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} error={errors.regularPrice} placeholder="0.00" />
            <Input
              label="Sale price"
              inputMode="decimal"
              leading="GHS"
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              error={errors.discountPrice}
              placeholder="Optional"
              hint={savings ? <span className="font-semibold text-success">Shoppers see {savings}% off</span> : "Leave blank if it is not on sale."}
            />
          </div>
        </Step>

        <Step id="product-stock" number={4} title="Sizes, colours & stock" description="Skip sizes and colours if they don't apply. Just enter how many you have." done={steps[3]!.done}>
          <fieldset disabled={saving} className="space-y-3">
            <legend className="text-sm font-medium text-ink">Sizes</legend>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((size) => (
                <Chip key={size} selected={isPicked(selectedSizes, size)} onClick={() => toggleValue(isSize, "Size", size)}>
                  {size}
                </Chip>
              ))}
            </div>
            <Input aria-label="Sizes" value={sizeOption?.valuesText ?? ""} onChange={(event) => setOptionValues(isSize, "Size", event.target.value)} placeholder="Or type sizes, e.g. 30, 32, 34" hint="Separate sizes with commas." error={optionError(sizeOption)} />
          </fieldset>

          <div className="border-t border-line pt-5">
          <fieldset disabled={saving} className="space-y-3">
            <legend className="text-sm font-medium text-ink">Colours</legend>
            <div className="flex flex-wrap gap-2">
              {COLOUR_PALETTE.map((colour) => (
                <Chip key={colour.name} selected={isPicked(selectedColours, colour.name)} onClick={() => toggleValue(isColour, "Colour", colour.name)}>
                  <span aria-hidden="true" className="size-4 rounded-full border border-black/15 shadow-sm" style={{ backgroundColor: colour.hex }} />
                  {colour.name}
                </Chip>
              ))}
            </div>
            <Input aria-label="Colours" value={colourOption?.valuesText ?? ""} onChange={(event) => setOptionValues(isColour, "Colour", event.target.value)} placeholder="Or type colours, e.g. Acid wash" hint="Separate colours with commas." error={optionError(colourOption)} />
          </fieldset>
          </div>

          {extraOptions.map((option) => {
            const index = form.options.indexOf(option);
            return (
              <div key={option.key} className="grid gap-3 rounded-xl border border-line bg-cream-200/50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-start">
                <Input label="Option name" value={option.name} placeholder="e.g. Material" maxLength={30} onChange={(event) => setOptions(form.options.map((item) => item === option ? { ...item, name: event.target.value } : item))} error={errors[`options.${index}.name`]} disabled={saving} />
                <Input label="Choices" value={option.valuesText} placeholder="e.g. Cotton, Linen" hint="Separate choices with commas." onChange={(event) => setOptions(form.options.map((item) => item === option ? { ...item, valuesText: event.target.value } : item))} error={errors[`options.${index}.values`]} disabled={saving} />
                <Button variant="ghost" size="icon" className="sm:mt-7" aria-label={`Remove ${option.name || "option"}`} onClick={() => setOptions(form.options.filter((item) => item !== option))} disabled={saving}><FiTrash2 aria-hidden="true" /></Button>
              </div>
            );
          })}
          {form.options.length < LIMITS.maxProductOptions && (
            <Button variant="link" leftIcon={<FiPlus aria-hidden="true" />} onClick={() => setOptions([...form.options, { key: rowKey(), name: "", valuesText: "" }])} disabled={saving}>
              Add another option (e.g. material)
            </Button>
          )}
          {(errors.options || errors.variants) && <p className="text-xs font-medium text-danger" role="alert">{errors.options || errors.variants}</p>}

          <div className="border-t border-line pt-5">
            {!form.hasVariants ? (
              <Input label="How many do you have?" required inputMode="numeric" wrapperClassName="max-w-xs" value={form.stock} onChange={(e) => set("stock", e.target.value)} error={errors.stock} hint="One-of-a-kind thrift piece? Enter 1." />
            ) : form.variants.length > 0 && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-ink">Stock for each choice</p>
                  <p className="text-xs text-muted">Leave the price blank to use the main price. Untick a choice you are not selling.</p>
                </div>
                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-3 bg-cream-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted md:grid">
                    <span>Choice</span>
                    <span>Price (optional)</span>
                    <span>Stock</span>
                    <span className="w-16 text-right">Selling</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {form.variants.map((variant, i) => (
                      <li key={variant.key} className={cn("grid grid-cols-2 gap-3 p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] md:items-center", !variant.isActive && "bg-cream-200/60")}>
                        <p className={cn("col-span-2 text-sm font-semibold md:col-span-1", variant.isActive ? "text-ink" : "text-muted line-through")}>{variantLabel(variant.attributes)}</p>
                        <div>
                          <p className="mb-1 text-xs text-muted md:hidden">Price (optional)</p>
                          <input
                            aria-label={`Price override for ${variantLabel(variant.attributes)} in GHS`}
                            aria-invalid={!!errors[`variants.${i}.price`] || undefined}
                            value={variant.price}
                            inputMode="decimal"
                            onChange={(e) => updateVariant(variant.key, { price: e.target.value })}
                            placeholder="Main price"
                            className={cn("h-11 w-full rounded-lg border bg-white px-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 md:text-sm", errors[`variants.${i}.price`] ? "border-danger" : "border-line")}
                          />
                          {errors[`variants.${i}.price`] && <p className="mt-1 text-xs text-danger">{errors[`variants.${i}.price`]}</p>}
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-muted md:hidden">Stock</p>
                          <input
                            aria-label={`Stock for ${variantLabel(variant.attributes)}`}
                            aria-invalid={!!errors[`variants.${i}.stock`] || undefined}
                            value={variant.stock}
                            inputMode="numeric"
                            onChange={(e) => updateVariant(variant.key, { stock: e.target.value })}
                            className={cn("h-11 w-full rounded-lg border bg-white px-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 md:text-sm", errors[`variants.${i}.stock`] ? "border-danger" : "border-line")}
                          />
                          {errors[`variants.${i}.stock`] && <p className="mt-1 text-xs text-danger">{errors[`variants.${i}.stock`]}</p>}
                        </div>
                        <label className="col-span-2 flex min-h-11 items-center justify-end gap-2 text-xs text-muted md:col-span-1 md:w-16">
                          <span className="md:sr-only">Selling this</span>
                          <input
                            type="checkbox"
                            checked={variant.isActive}
                            onChange={(e) => updateVariant(variant.key, { isActive: e.target.checked })}
                            className="size-5 accent-brand"
                            aria-label={`${variantLabel(variant.attributes)} available for sale`}
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted">Total in stock: <span className="font-semibold text-ink">{totalStock}</span></p>
              </div>
            )}
          </div>
        </Step>

        <Step id="product-visibility" number={5} title="Visibility" description="Choose where this product shows up.">
          <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} label="Show in store" description="Turn off to hide it from shoppers without deleting it." />
          <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Feature on homepage" description="Shows it in the Featured products section." />
          <div className="border-t border-line pt-5">
            <Input label="Warn me when stock drops to" inputMode="numeric" wrapperClassName="max-w-xs" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} error={errors.lowStockThreshold} hint="You get a low-stock alert at this number." />
          </div>
        </Step>
      </div>

      <aside className="hidden space-y-4 xl:sticky xl:top-24 xl:block">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <p className="flex items-center gap-1.5 border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted"><FiEye aria-hidden="true" className="size-3.5" />Shopper preview</p>
          <div className="relative aspect-4/5 bg-cream-200">
            {cover ? (
              <Image src={cover.url} alt="" fill sizes="320px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
                <FiImage aria-hidden="true" className="size-8" />
                <span className="text-xs">Your main photo shows here</span>
              </div>
            )}
            {savings && <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white">-{savings}%</span>}
            {!form.isActive && <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white">Hidden</span>}
          </div>
          <div className="space-y-1 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{categoryName.trim() || "Category"}</p>
            <p className={cn("line-clamp-2 font-medium", form.name.trim() ? "text-ink" : "text-muted")}>{form.name.trim() || "Product name"}</p>
            <p className="flex items-baseline gap-2">
              <span className="font-bold text-ink">{formatGHS((savings ? discountValue : regularValue) ?? 0)}</span>
              {savings && regularValue !== null && <span className="text-sm text-muted line-through">{formatGHS(regularValue)}</span>}
            </p>
          </div>
        </div>

        <nav aria-label="Form steps" className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">Checklist</span>
            <span className="text-xs text-muted">{doneCount} of {steps.length} done</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-cream-200">
            <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <ol className="space-y-0.5">
            {steps.map((step, index) => (
              <li key={step.id}>
                <a href={`#${step.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-ink transition-colors hover:bg-brand-50">
                  <span aria-hidden="true" className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", step.done ? "bg-success text-white" : "bg-cream-200 text-muted")}>
                    {step.done ? <FiCheck className="size-3" /> : index + 1}
                  </span>
                  <span className="flex-1">{step.label}</span>
                  {step.error && <span className="text-xs font-semibold text-danger">Fix</span>}
                  <span className="sr-only">{step.done ? "(done)" : "(to do)"}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {actions}
      </aside>

      <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 rounded-2xl border border-line bg-white/95 p-3 shadow-pop backdrop-blur-md xl:hidden">
        <p className="mb-2 px-1 text-xs text-muted">{doneCount} of {steps.length} steps done</p>
        {actions}
      </div>
    </form>
  );
}
