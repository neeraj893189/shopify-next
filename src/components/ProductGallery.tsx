"use client";

import Image from "next/image";
import { useState } from "react";
import type { ShopifyImage } from "@/lib/shopify/types";

export function ProductGallery({ images, title }: { images: ShopifyImage[]; title: string }) {
  const [origin, setOrigin] = useState("50% 50%");

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map((image, index) => (
        <div
          key={`${image.url}-${index}`}
          className={`group relative aspect-[4/5] overflow-hidden bg-secondary ${index === 0 ? "col-span-2" : ""}`}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            setOrigin(`${x}% ${y}%`);
          }}
          onMouseLeave={() => setOrigin("50% 50%")}
        >
          <Image
            src={image.url}
            alt={image.altText ?? title}
            fill
            priority={index === 0}
            className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-150"
            sizes={index === 0 ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 27vw, 50vw"}
            style={{ transformOrigin: origin }}
          />
        </div>
      ))}
    </div>
  );
}
