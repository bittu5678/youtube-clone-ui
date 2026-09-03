import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

export interface ShortItem {
  id: string;
  title: string;
  creator: string;
  creatorHandle: string;
  initials: string;
  likes: string;
  comments: string;
  shares: string;
  soundTrack: string;
  tags: string[];
  thumb: string;
  aspectColor: string;
}

export const SHORTS_LIST: ShortItem[] = [
  {
    id: "s1",
    title: "10 React Performance Tricks in 60 seconds! 🔥 #webdev #react",
    creator: "CodeCanvas",
    creatorHandle: "@codecanvas",
    initials: "CC",
    likes: "48.2K",
    comments: "1,240",
    shares: "8.5K",
    soundTrack: "CodeCanvas · Original Synth Beats",
    tags: ["react", "programming", "webdev"],
    thumb: thumb1,
    aspectColor: "from-blue-900/60 to-purple-900/80",
  },
  {
    id: "s2",
    title: "How GPU Shaders actually render light rays in real-time ⚡",
    creator: "Deep Signal",
    creatorHandle: "@deepsignal",
    initials: "DS",
    likes: "89.1K",
    comments: "3,892",
    shares: "14.2K",
    soundTrack: "Cybernetic Waves · Lofi Drive",
    tags: ["graphics", "ai", "tech"],
    thumb: thumb2,
    aspectColor: "from-purple-900/60 to-pink-900/80",
  },
  {
    id: "s3",
    title: "Cinematic drone dive over misty Norwegian Fjords 🏔️ #nature",
    creator: "Aero Lens",
    creatorHandle: "@aerolens",
    initials: "AL",
    likes: "124K",
    comments: "4,120",
    shares: "32K",
    soundTrack: "Ambient Piano · Northern Echoes",
    tags: ["cinematic", "drone", "travel"],
    thumb: thumb3,
    aspectColor: "from-emerald-900/60 to-teal-900/80",
  },
  {
    id: "s4",
    title: "Building an iOS app with Swift and Metal in 10 lines of code 📱",
    creator: "Syntax Studio",
    creatorHandle: "@syntaxstudio",
    initials: "SS",
    likes: "31.5K",
    comments: "840",
    shares: "5.1K",
    soundTrack: "Chill Coding Beats · Session 4",
    tags: ["ios", "swift", "apple"],
    thumb: thumb4,
    aspectColor: "from-cyan-900/60 to-blue-900/80",
  },
  {
    id: "s5",
    title: "Can AI actually generate a 3D video game yet? Let's find out! 🤖",
    creator: "Pixel Forge",
    creatorHandle: "@pixelforge",
    initials: "PF",
    likes: "73.4K",
    comments: "2,410",
    shares: "11.8K",
    soundTrack: "Chiptune Electro · High Score",
    tags: ["gamedev", "ai", "indiedev"],
    thumb: thumb5,
    aspectColor: "from-amber-900/60 to-red-900/80",
  },
  {
    id: "s6",
    title: "Microphone setup secrets top podcasters never tell you 🎙️",
    creator: "Acoustic Craft",
    creatorHandle: "@acousticcraft",
    initials: "AC",
    likes: "19.8K",
    comments: "520",
    shares: "2.4K",
    soundTrack: "Crisp Vocals · Audio Lab",
    tags: ["audio", "podcasting", "gear"],
    thumb: thumb6,
    aspectColor: "from-rose-900/60 to-orange-900/80",
  },
];
