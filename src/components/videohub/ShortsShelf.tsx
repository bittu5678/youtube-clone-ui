import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { SHORTS_LIST, type ShortItem } from "@/data/shorts";
import { ShortsIcon } from "./ShortsIcon";

interface ShortsShelfProps {
  title?: string;
  items?: ShortItem[];
  className?: string;
}

export function ShortsShelf({
  title = "Shorts",
  items = SHORTS_LIST,
  className = "",
}: ShortsShelfProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse drag-to-scroll state
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Mouse drag handlers for desktop smooth dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDownRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleCardClick = (e: React.MouseEvent, shortId: string) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate({ to: "/shorts", search: { id: shortId } });
  };

  return (
    <section className={`relative my-10 sm:my-12 ${className}`}>
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* YouTube-style Red Shorts Icon Badge */}
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-600 text-white shadow-sm ring-2 ring-red-600/20">
            <ShortsIcon className="h-5 w-5 fill-white text-white" active />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {title}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Trending quick vertical videos
            </p>
          </div>
        </div>

        {/* Carousel Navigation Buttons & View All link */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/shorts"
            className="hidden sm:inline-flex text-xs font-semibold text-brand hover:underline mr-2"
          >
            Explore all
          </Link>

          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll Shorts left"
            className={`grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground transition-all shadow-sm ${
              canScrollLeft
                ? "hover:bg-secondary hover:scale-105 active:scale-95 cursor-pointer"
                : "opacity-35 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll Shorts right"
            className={`grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground transition-all shadow-sm ${
              canScrollRight
                ? "hover:bg-secondary hover:scale-105 active:scale-95 cursor-pointer"
                : "opacity-35 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Row */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-1 px-0.5 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{
          scrollSnapType: isDragging ? "none" : "x proximity",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((short) => (
          <article
            key={short.id}
            onClick={(e) => handleCardClick(e, short.id)}
            style={{ scrollSnapAlign: "start" }}
            className="group relative w-[160px] sm:w-[185px] md:w-[210px] shrink-0 aspect-[9/16] rounded-2xl overflow-hidden bg-muted border border-border/80 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-brand/40 cursor-pointer"
          >
            {/* Short Thumbnail image */}
            <img
              src={short.thumb}
              alt={short.title}
              draggable={false}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
            />

            {/* Gradient Overlay for high text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

            {/* Top Shorts Indicator Badge */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md opacity-90 group-hover:opacity-100 transition-opacity">
              <ShortsIcon className="h-3 w-3 text-red-500 fill-red-500" active />
              <span>Shorts</span>
            </div>

            {/* Hover Play Button Overlay */}
            <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-red-600/90 text-white shadow-xl backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform duration-200">
                <Play className="h-5 w-5 fill-white translate-x-0.5" />
              </div>
            </div>

            {/* Bottom Content: Title & Views */}
            <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col justify-end pointer-events-none">
              <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow-md group-hover:text-red-300 transition-colors">
                {short.title}
              </h3>

              <div className="mt-1.5 flex items-center justify-between text-[11px] sm:text-xs text-white/80 font-medium">
                <span className="drop-shadow-sm font-semibold text-white/90">{short.views}</span>
                <span className="text-[10px] text-white/60">{short.creator}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
