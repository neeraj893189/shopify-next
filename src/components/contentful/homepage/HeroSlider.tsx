"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type HeroImage = {
  sys: {
    id: string;
  };
  fields: {
    title?: string;
    file: {
      url: string;
    };
  };
};

type HeroSliderProps = {
  images: HeroImage[];
};

export default function HeroSlider({ images }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const previousSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  // Auto slide every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (!images.length) return null;

  return (
    <section className="relative h-[500px] w-full overflow-hidden">
      {images.map((image, index) => {
        const url = image.fields.file.url;

        const imageUrl = url.startsWith("//")
          ? `https:${url}`
          : url;

        return (
          <div
            key={image.sys.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === current
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={imageUrl}
              alt={image.fields.title ?? "Hero banner"}
              fill
              priority={index === 0}
              className="object-cover"
            />
          </div>
        );
      })}

      {/* Previous */}
      <button
        onClick={previousSlide}
        aria-label="Previous slide"
        className="absolute left-5 top-1/2 z-10 -translate-y-1/2
                   rounded-full bg-black/50 px-4 py-2 text-2xl text-white"
      >
        ‹
      </button>

      {/* Next */}
      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-5 top-1/2 z-10 -translate-y-1/2
                   rounded-full bg-black/50 px-4 py-2 text-2xl text-white"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {images.map((image, index) => (
          <button
            key={image.sys.id}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-3 w-3 rounded-full ${
              current === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}