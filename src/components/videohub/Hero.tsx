import { Play, Bookmark } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Logo } from "./Logo";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#141416] text-white shadow-card">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Creator filming in a red-lit studio"
          width={1600}
          height={900}
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f] via-[#0d0d0f]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#b3121c]/35 via-transparent to-transparent" />
      </div>

      <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:p-14">
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
            <Logo size={20} showName={false} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              FaceTube Originals
            </span>
          </div>
          <h1 className="text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            Inside the studio: how modern creators ship a video a day
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
            A feature-length look at the workflows, gear and editing systems behind the
            fastest-growing channels on FaceTube.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-lift transition hover:bg-brand-dark active:scale-95">
              <Play className="h-4 w-4 fill-current" />
              Watch Now
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15">
              <Bookmark className="h-4 w-4" />
              Watch Later
            </button>
            <span className="text-xs text-white/55">48:12 · 2.4M views</span>
          </div>
        </div>

        <div className="group relative hidden overflow-hidden rounded-2xl border border-white/15 shadow-2xl lg:block">
          <img
            src={heroImg}
            alt="Featured video preview"
            width={1600}
            height={900}
            className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 grid place-items-center bg-black/25">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/95 shadow-lift transition group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-[2px] fill-current text-white" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
