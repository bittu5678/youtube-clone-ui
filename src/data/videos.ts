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

export const VIDEO_CATEGORIES = [
  "Motivational",
  "Comedy",
  "Blog",
  "Movie",
  "Entertainment",
  "Cooking",
  "Finance",
  "Share Market",
  "Business",
  "Crypto",
  "Coding",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const categories = ["All", ...VIDEO_CATEGORIES];

export const recommended: Video[] = [
  {
    id: "v1",
    category: "Coding",
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
    category: "Motivational",
    description:
      "The mindset shift and discipline needed to reach elite performance and master complex skills in 2026.",
    title: "How to Build Relentless Focus & Mental Stamina",
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
    category: "Entertainment",
    description:
      "Watch a complete cinematic soundtrack come together from a single melody loop — sampling, drums, mixing and mastering.",
    title: "Cinematic Sound Studio Session: Making a Score from Scratch",
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
    category: "Comedy",
    description:
      "Hilarious sketches and real-world reactions to modern developer problems and startup culture.",
    title: "Tech Startup Standup: Hilarious Realities of Modern Work",
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
    category: "Business",
    description:
      "How to scale an enterprise brand, optimize creator economics, and build enduring distribution moats.",
    title: "Creator Economy 2026: Scaling from Zero to Enterprise",
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
    category: "Finance",
    description:
      "Comprehensive breakdown of wealth compounding, index funds, cash flow management and early retirement planning.",
    title: "Smart Financial Freedom Blueprint: Compounding & Cash Flow",
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
    category: "Share Market",
    description:
      "Intraday price action, swing trading strategies, order book liquidity and risk mitigation rules.",
    title: "Mastering the Share Market: Technical Analysis & Risk Management",
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
    category: "Crypto",
    description:
      "DeFi primitives, liquidity pools, cross-chain bridges and decentralized infrastructure explained.",
    title: "Web3 & Crypto Architecture: What Every Builder Needs to Know",
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
