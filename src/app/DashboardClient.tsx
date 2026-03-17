"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import ChromaGrid, { ChromaItem } from "@/components/ui/ChromaGrid";
import Dither from "@/components/Dither";
import { createWhiteboard, deleteWhiteboard, renameWhiteboard } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Whiteboard = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview?: string;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function DashboardClient({ initialWhiteboards }: { initialWhiteboards: Whiteboard[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticWhiteboards, setOptimistic] = useOptimistic(initialWhiteboards);
  const [renameTarget, setRenameTarget] = useState<Whiteboard | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = () => {
    startTransition(async () => {
      const board = await createWhiteboard();
      router.push(`/board/${board.id}`);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      setOptimistic((prev) => prev.filter((w) => w.id !== id));
      await deleteWhiteboard(id);
    });
  };

  const handleRename = (board: Whiteboard) => {
    setRenameTarget(board);
    setRenameValue(board.title);
  };

  const submitRename = () => {
    if (!renameTarget) return;
    startTransition(async () => {
      setOptimistic((prev) =>
        prev.map((w) => (w.id === renameTarget.id ? { ...w, title: renameValue } : w))
      );
      await renameWhiteboard(renameTarget.id, renameValue);
      setRenameTarget(null);
    });
  };

  const PALETTES = [
    { borderColor: 'rgba(139,92,246,0.5)',  gradient: 'linear-gradient(145deg,rgba(109,40,217,0.45),rgba(5,5,15,0.85))' },
    { borderColor: 'rgba(236,72,153,0.5)',  gradient: 'linear-gradient(210deg,rgba(190,24,93,0.45),rgba(5,5,15,0.85))' },
    { borderColor: 'rgba(99,102,241,0.5)',  gradient: 'linear-gradient(165deg,rgba(67,56,202,0.45),rgba(5,5,15,0.85))' },
    { borderColor: 'rgba(6,182,212,0.5)',   gradient: 'linear-gradient(195deg,rgba(8,145,178,0.45),rgba(5,5,15,0.85))' },
    { borderColor: 'rgba(167,139,250,0.5)', gradient: 'linear-gradient(225deg,rgba(124,58,237,0.45),rgba(5,5,15,0.85))' },
    { borderColor: 'rgba(232,121,249,0.5)', gradient: 'linear-gradient(180deg,rgba(168,85,247,0.45),rgba(5,5,15,0.85))' },
  ];

  const cards = optimisticWhiteboards.length > 0
    ? optimisticWhiteboards.slice(0, 12)
    : Array.from({ length: 12 }, (_, i) => ({ id: `placeholder-${i}`, title: "Untitled Canvas", created_at: "", updated_at: "", preview: undefined }));

  const chromaItems: ChromaItem[] = cards.map((board, i) => ({
    image: board.preview ?? '',
    title: board.title,
    subtitle: board.updated_at ? formatTime(board.updated_at) : 'New Canvas',
    ...PALETTES[i % PALETTES.length],
  }));

  return (
    <div className="h-screen overflow-hidden flex flex-col relative">
      {/* Dither background */}
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={[0.19607843137254902, 0.03529411764705882, 0.3058823529411765]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          pixelSize={2}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white rounded-md" />
          <span className="text-base font-semibold tracking-tight text-white">Studio</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-white">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">Canvases</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 grid flex-1 gap-x-16 px-8 md:px-16 pt-16 pb-0 overflow-hidden"
           style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Left: hero text */}
        <div className="flex flex-col justify-between pt-4 pb-8 h-full">
          <div className="flex flex-col gap-6">
            <h1
              className="font-black text-white leading-tight tracking-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              The AI-powered canvas.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Sketch, brainstorm, and build with an AI copilot that understands your canvas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="text-sm font-semibold bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Creating…" : "New Canvas"}
            </button>
          </div>
        </div>

        {/* Right: ChromaGrid */}
        <div className="absolute bottom-8 right-8 gap-3 overflow-hidden" style={{ left: '38%' }}>
          <ChromaGrid
            items={chromaItems}
            radius={280}
            damping={0.45}
            onItemClick={(_, i) => {
              const board = cards[i];
              if (board && !board.id.startsWith('placeholder')) router.push(`/board/${board.id}`);
            }}
            onRename={(i) => {
              const board = cards[i];
              if (board && !board.id.startsWith('placeholder')) handleRename(board);
            }}
            onDelete={(i) => {
              const board = cards[i];
              if (board && !board.id.startsWith('placeholder')) handleDelete(board.id);
            }}
          />
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Canvas</DialogTitle>
          </DialogHeader>
          <input
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            autoFocus
          />
          <DialogFooter>
            <button
              onClick={() => setRenameTarget(null)}
              className="text-sm text-neutral-500 hover:text-neutral-700 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={submitRename}
              className="text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
