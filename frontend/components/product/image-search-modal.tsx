"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Search, Sparkles } from "lucide-react";
import { searchByImage } from "@/services/product-service";
import { Product } from "@/types";
import { formatINR } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageSearchModal({ isOpen, onClose }: ImageSearchModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
      runSearch(selected);
    }
  };

  const runSearch = async (uploadedFile: File) => {
    setIsLoading(true);
    try {
      const items = await searchByImage(uploadedFile);
      setResults(items);
      if (items.length === 0) {
        toast("No visually matching products found. Try another image.");
      }
    } catch {
      toast.error("Visual search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResults([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-nova-600" />
            <h3 className="font-bold text-lg text-ink">Visual Product Search</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-graphite hover:text-ink hover:bg-mist transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-nova-300 hover:border-nova-500 bg-nova-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            >
              <div className="h-14 w-14 rounded-full bg-nova-100 flex items-center justify-center text-nova-600 mb-3">
                <Upload className="h-7 w-7" />
              </div>
              <p className="font-semibold text-ink text-sm">
                Drop your product photo here, or{" "}
                <span className="text-nova-600 underline">browse files</span>
              </p>
              <p className="text-xs text-graphite mt-1">
                Upload a photo or screenshot of shoes, phones, shirts, bags, or sports gear
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview header */}
              <div className="flex items-center justify-between bg-mist/50 p-3 rounded-lg border border-line">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-md overflow-hidden border border-line bg-white shrink-0">
                    <Image src={preview} alt="Uploaded product" fill className="object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-ink block line-clamp-1">
                      {file?.name}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Image analyzed successfully
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-nova-600 hover:text-nova-700 font-semibold px-2 py-1"
                >
                  Change Image
                </button>
              </div>

              {/* Search Results */}
              <div>
                <h4 className="text-xs font-bold text-graphite uppercase tracking-wider mb-3">
                  Visually & Semantically Matching Products
                </h4>

                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-graphite">
                    <div className="h-8 w-8 rounded-full border-2 border-nova-600 border-t-transparent animate-spin mb-3" />
                    <span className="text-xs font-medium">Analyzing image features...</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {results.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.id}`}
                        onClick={onClose}
                        className="group border border-line rounded-lg p-3 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-28 w-full mb-2">
                            <Image
                              src={
                                item.images?.[0] ||
                                "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
                              }
                              alt={item.name}
                              fill
                              className="object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-nova-600 block uppercase">
                            {item.categoryName}
                          </span>
                          <span className="text-xs font-medium text-ink group-hover:text-nova-600 line-clamp-2 leading-snug">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-ink mt-2">
                          {formatINR(item.effectivePrice || item.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-graphite text-xs">
                    No matching products found. Try uploading a clearer photo.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
