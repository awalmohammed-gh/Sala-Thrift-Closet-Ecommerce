"use client";

import type { CategoryDTO } from "@salasty-thrift-closet/shared";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/AdminUI";
import { ProductForm } from "@/components/admin/ProductForm";
import { useAdminResource } from "@/hooks/useAdminResource";

export function NewProductView() {
  const categories = useAdminResource<CategoryDTO[]>("/admin/categories");
  return (
    <>
      <PageHeader title="Add product" description="Work through the steps below. You can change anything later." />
      {categories.loading ? (
        <LoadingBlock />
      ) : categories.error ? (
        <ErrorBlock message={categories.error} onRetry={categories.reload} />
      ) : (
        <ProductForm categories={categories.data ?? []} />
      )}
    </>
  );
}
