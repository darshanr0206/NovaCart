"use client";

import { ChangeEvent } from "react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "discount", label: "Discount" },
];

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    e.target.form?.submit();
  };

  return (
    <select
      name="sortBy"
      defaultValue={defaultValue}
      onChange={handleChange}
      className="border border-line rounded bg-white px-3 py-1.5 text-sm font-medium text-nova-600 outline-none cursor-pointer hover:border-nova-300 transition-colors"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
