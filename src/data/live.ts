import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

export interface LiveStream {
  id: string;
  title: string;
  streamer: string;
  streamerHandle: string;
  initials: string;
  viewers: string;
  category: string;
  tags: string[];
  thumb: string;
  isLive: boolean;
  startedTime: string;
  chatMessages: { user: string; text: string; isMod?: boolean; color: string }[];
}

export const LIVE_STREAMS: LiveStream[] = [
  {
    id: "live-1",
    title: "🔴 LIVE: 24-Hour Lo-Fi Coding & System Architecture Sprint (Q&A)",
    streamer: "DevForge Live",
    streamerHandle: "@devforge",
    initials: "DF",
    viewers: "12,450",
    category: "Coding & Tech",
    tags: ["typescript", "fullstack", "react"],
    thumb: thumb1,
    isLive: true,
    startedTime: "Started 2 hours ago",
    chatMessages: [
      { user: "Sarah_Code", text: "Loving the clean Tailwind setup!", color: "text-purple-400" },
      { user: "ByteMaster", text: "Are you deploying this on Cloud Run?", color: "text-blue-400" },
      { user: "AlexDev", text: "What font are you using in VS Code?", color: "text-emerald-400" },
      {
        user: "ModeratorBot",
        text: "Welcome to FaceTube Live! Keep chat friendly 🎉",
        isMod: true,
        color: "text-brand",
      },
      {
        user: "Kiran_99",
        text: "The bottom navigation feels so smooth on mobile!",
        color: "text-amber-400",
      },
    ],
  },
  {
    id: "live-2",
    title: "🔴 World Championship Grand Finals — Live Commentary & Analysis",
    streamer: "Apex Arena Esports",
    streamerHandle: "@apexarena",
    initials: "AA",
    viewers: "45,820",
    category: "Gaming",
    tags: ["esports", "fps", "finals"],
    thumb: thumb5,
    isLive: true,
    startedTime: "Started 45 mins ago",
    chatMessages: [
      { user: "SniperPro", text: "THAT CLUTCH WAS INSANE", color: "text-red-400" },
      { user: "GamerGirl9", text: "Team Blue is dominating map 3", color: "text-pink-400" },
      { user: "Vortex", text: "1v3 defuse incoming?!", color: "text-cyan-400" },
    ],
  },
  {
    id: "live-3",
    title: "🔴 Ambient Electronic Live Jam Session: Modular Synthesizers",
    streamer: "SubHarmonic",
    streamerHandle: "@subharmonic",
    initials: "SH",
    viewers: "3,890",
    category: "Music",
    tags: ["ambient", "synth", "modular"],
    thumb: thumb6,
    isLive: true,
    startedTime: "Started 1 hour ago",
    chatMessages: [
      { user: "AudioPhile", text: "Those analog filters sound pristine", color: "text-teal-400" },
      {
        user: "Echo_Dave",
        text: "Perfect soundtrack for working right now",
        color: "text-indigo-400",
      },
    ],
  },
  {
    id: "live-4",
    title: "🔴 Global Space Mission Launch Live Coverage & Multi-cam Feed",
    streamer: "AeroSpace Now",
    streamerHandle: "@aerospacenow",
    initials: "AN",
    viewers: "94,100",
    category: "Science & Tech",
    tags: ["space", "rocket", "live"],
    thumb: thumb3,
    isLive: true,
    startedTime: "Started 3 hours ago",
    chatMessages: [
      {
        user: "CosmoFan",
        text: "T-minus 10 minutes to main booster separation!",
        color: "text-yellow-400",
      },
      {
        user: "Dr_Orbit",
        text: "Telemetry looking nominal across all vectors",
        color: "text-green-400",
      },
    ],
  },
];
