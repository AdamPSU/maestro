"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import CardSwap, { Card } from "@/components/ui/CardSwap";
import Dither from "@/components/Dither";
import Aurora from "@/components/Aurora";
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

  const cards = optimisticWhiteboards.length > 0
    ? optimisticWhiteboards.slice(0, 5)
    : Array.from({ length: 3 }, (_, i) => ({ id: `placeholder-${i}`, title: "Untitled Canvas", created_at: "", updated_at: "", preview: undefined }));

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
      <div className="relative z-10 overflow-hidden flex flex-col flex-1 px-8 md:px-16 pt-16 pb-0">
        {/* Hero — single-column left stack */}
        <div className="flex flex-col gap-6 mb-16 max-w-2xl">
          <span className="text-xs font-semibold tracking-widest uppercase text-white/40">
            Canvas + AI Studio
          </span>
          <h1
            className="font-black text-white leading-tight tracking-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            The AI-powered canvas.
            <br />
            One infinite cosmos for thoughtful art.
          </h1>
          <p className="text-xl text-white leading-relaxed">
            Sketch, brainstorm, and build — with an AI copilot that understands your canvas.
            Infinite space, zero limits.
          </p>
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

        {/* CardSwap — absolutely positioned, right edge clipped by parent overflow-hidden */}
        <div
          className="absolute"
          style={{ right: -70, bottom: -186 }}
        >
          <CardSwap
            width={950}
            height={620}
            cardDistance={85}
            verticalDistance={95}
            delay={5000}
            pauseOnHover
            easing="elastic"
          >
            {cards.map((board) => (
              <Card
                key={board.id}
                customClass="group"
                style={{ cursor: "pointer" }}
                onClick={() => !board.id.startsWith("placeholder") && router.push(`/board/${board.id}`)}
              >
                <div className="absolute inset-0">
                  <Aurora
                    colorStops={["#000000", "#2c273f"]}
                    amplitude={1}
                    blend={0.5}
                  />
                </div>
                <div className="w-full h-full flex flex-col p-6 text-white hover:scale-[1.02] transition-transform duration-300 relative z-10">
                  {board.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={board.preview} alt={board.title} className="w-full h-full object-cover absolute inset-0 rounded-3xl" />
                  ) : (
                    <div className="flex-1 flex items-center justify-center opacity-20">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                    </div>
                  )}
                  {/* Top overlay — title, date, actions */}
                  <div className="absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/70 to-transparent rounded-t-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{board.title}</p>
                      {!board.id.startsWith("placeholder") && (
                        <>
                          <span className="text-white/30 text-xs">•</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRename(board); }}
                            className="text-xs text-neutral-300 hover:text-white transition-colors"
                          >
                            Rename
                          </button>
                          <span className="text-white/30 text-xs">•</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(board.id); }}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    {board.updated_at && (
                      <p className="text-xs text-neutral-400 mt-0.5">{formatTime(board.updated_at)}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </CardSwap>
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
