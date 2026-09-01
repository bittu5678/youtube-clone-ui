import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

export type Video = {
  id: string;
  title: string;
  channel: string;
  initials: string;
  views: string;
  age: string;
  duration: string;
  thumb: string;
  tint: string;
  category: string;
  description: string;
};

export const categories = [
  "All",
  "Music",
  "Coding",
  "AI",
  "JavaScript",
  "React",
  "Gaming",
  "News",
  "Study",
  "Design",
  "Podcasts",
];

export const recommended: Video[] = [
  {
    id: "v1",
    category: "React",
    description:
      "A full walkthrough of building a production-grade React dashboard: routing, data fetching, charts, and a design system that scales.",
    title: "Build a Production-Ready React Dashboard in One Sitting",
    channel: "CodeCanvas",
    initials: "CC",
    views: "842K views",
    age: "2 days ago",
    duration: "24:18",
    thumb: thumb1,
    tint: "oklch(0.45 0.15 27)",
  },
  {
    id: "v2",
    category: "AI",
    description:
      "A visual, math-light explainer of gradient descent, backpropagation and why neural networks generalise at all.",
    title: "How Neural Networks Actually Learn — Visual Explainer",
    channel: "Deep Signal",
    initials: "DS",
    views: "1.4M views",
    age: "5 days ago",
    duration: "18:02",
    thumb: thumb2,
    tint: "oklch(0.4 0.18 340)",
  },
  {
    id: "v3",
    category: "Music",
    description:
      "Watch a complete lo-fi track come together from a single piano loop — sampling, drums, mixing and mastering in real time.",
    title: "Lo-Fi Studio Session: Making a Track from Scratch",
    channel: "Redroom Audio",
    initials: "RA",
    views: "306K views",
    age: "1 week ago",
    duration: "42:55",
    thumb: thumb3,
    tint: "oklch(0.42 0.17 20)",
  },
  {
    id: "v4",
    category: "Gaming",
    description:
      "High-pressure ranked gameplay with commentary, plus a full tour of the streaming setup and peripherals.",
    title: "Ranked Grind: Clutch Plays and Setup Tour",
    channel: "NovaPlays",
    initials: "NP",
    views: "2.1M views",
    age: "3 hours ago",
    duration: "11:37",
    thumb: thumb4,
    tint: "oklch(0.4 0.16 300)",
  },
  {
    id: "v5",
    category: "Design",
    description:
      "How to turn a chaotic Figma file into a documented, token-driven design system your engineers will actually use.",
    title: "Design Systems: From Messy Figma to Shipped Product",
    channel: "Studio Grid",
    initials: "SG",
    views: "97K views",
    age: "4 days ago",
    duration: "32:09",
    thumb: thumb5,
    tint: "oklch(0.7 0.02 260)",
  },
  {
    id: "v6",
    category: "Podcasts",
    description:
      "A long-form conversation about platforms, payouts and what sustainable creative work looks like in 2026.",
    title: "The Creator Economy in 2026 — Full Podcast Episode",
    channel: "Signal & Noise",
    initials: "SN",
    views: "512K views",
    age: "6 days ago",
    duration: "1:04:22",
    thumb: thumb6,
    tint: "oklch(0.45 0.19 15)",
  },
  {
    id: "v7",
    category: "JavaScript",
    description:
      "Generics, discriminated unions, satisfies and the type-level tricks senior engineers reach for every day.",
    title: "TypeScript Patterns Every Senior Engineer Uses",
    channel: "CodeCanvas",
    initials: "CC",
    views: "428K views",
    age: "12 days ago",
    duration: "27:44",
    thumb: thumb1,
    tint: "oklch(0.45 0.15 27)",
  },
  {
    id: "v8",
    category: "AI",
    description:
      "Why prompt tinkering is fading and structured context engineering is taking over production AI systems.",
    title: "Prompt Engineering Is Dead — Here's What Replaced It",
    channel: "Deep Signal",
    initials: "DS",
    views: "1.1M views",
    age: "1 day ago",
    duration: "15:31",
    thumb: thumb2,
    tint: "oklch(0.4 0.18 340)",
  },
];

const pick = (indexes: number[]) => indexes.map((i) => recommended[i] as Video);

export const trending: Video[] = pick([3, 1, 5, 0]).map((v, i) => ({ ...v, id: `t${i}` }));

export const recent: Video[] = pick([4, 2, 6, 7]).map((v, i) => ({
  ...v,
  id: `r${i}`,
  age: `${i + 1} hours ago`,
}));

export const creators = [
  { name: "CodeCanvas", initials: "CC", subs: "1.2M subscribers", tag: "Coding" },
  { name: "Deep Signal", initials: "DS", subs: "890K subscribers", tag: "AI" },
  { name: "Redroom Audio", initials: "RA", subs: "460K subscribers", tag: "Music" },
  { name: "NovaPlays", initials: "NP", subs: "3.4M subscribers", tag: "Gaming" },
  { name: "Studio Grid", initials: "SG", subs: "212K subscribers", tag: "Design" },
  { name: "Signal & Noise", initials: "SN", subs: "775K subscribers", tag: "Podcasts" },
];

export const allVideos: Video[] = [...recommended, ...trending, ...recent];

export const findVideo = (id: string) => allVideos.find((v) => v.id === id);
