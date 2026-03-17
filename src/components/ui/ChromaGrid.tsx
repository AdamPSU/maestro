"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface ChromaItem {
  image: string;
  title: string;
  subtitle: string;
  borderColor?: string;
  gradient?: string;
}

interface ChromaGridProps {
  items?: ChromaItem[];
  radius?: number;
  damping?: number;
  onItemClick?: (item: ChromaItem, index: number) => void;
  onRename?: (index: number) => void;
  onDelete?: (index: number) => void;
}

export default function ChromaGrid({
  items = [],
  radius = 300,
  damping = 0.45,
  onItemClick,
  onRename,
  onDelete,
}: ChromaGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -9999, y: -9999 });
  const smoothPos = useRef({ x: -9999, y: -9999 });
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const updateCards = useCallback(() => {
    smoothPos.current.x += (mousePos.current.x - smoothPos.current.x) * damping;
    smoothPos.current.y += (mousePos.current.y - smoothPos.current.y) * damping;

    cardRefs.current.forEach((card) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((smoothPos.current.x - cx) ** 2 + (smoothPos.current.y - cy) ** 2);
      const t = Math.max(0, 1 - dist / radius);
      card.style.filter = `saturate(${0.15 + 0.85 * t}) brightness(${0.6 + 0.5 * t})`;
      card.style.opacity = `${0.72 + 0.28 * t}`;
    });

    rafRef.current = requestAnimationFrame(updateCards);
  }, [radius, damping]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateCards);
    return () => cancelAnimationFrame(rafRef.current);
  }, [updateCards]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePos.current = { x: -9999, y: -9999 };
  }, []);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-4 gap-2 w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => { cardRefs.current[i] = el; }}
          onClick={() => onItemClick?.(item, i)}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="relative rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
          style={{
            border: `1px solid ${item.borderColor ?? 'rgba(58,58,58,0.5)'}`,
            background: item.gradient ?? 'rgba(26,26,29,0.6)',
            aspectRatio: '4/3',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {item.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-black/20">
            <p className="text-xs font-bold text-white truncate drop-shadow-sm">{item.title}</p>
            <p className="text-[10px] text-white/70 truncate">{item.subtitle}</p>
          </div>
          {hoveredIndex === i && (onRename || onDelete) && (
            <div
              className="absolute top-1.5 right-1.5 flex gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {onRename && (
                <button
                  onClick={() => onRename(i)}
                  className="text-[10px] font-medium bg-black/60 text-white/80 px-2 py-0.5 rounded hover:bg-black/80 transition-colors"
                >
                  Rename
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(i)}
                  className="text-[10px] font-medium bg-black/60 text-red-400 px-2 py-0.5 rounded hover:bg-black/80 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
