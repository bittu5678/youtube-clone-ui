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
  views: string;
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
    views: "1.4M views",
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
    views: "890K views",
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
    views: "2.1M views",
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
    views: "520K views",
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
    views: "1.8M views",
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
    views: "340K views",
    likes: "19.8K",
    comments: "520",
    shares: "2.4K",
    soundTrack: "Crisp Vocals · Audio Lab",
    tags: ["audio", "podcasting", "gear"],
    thumb: thumb6,
    aspectColor: "from-rose-900/60 to-orange-900/80",
  },
  {
    id: "s7",
    title: "CSS Grid Subgrid is finally here and it changes responsive design! 🎨",
    creator: "Design Foundry",
    creatorHandle: "@designfoundry",
    initials: "DF",
    views: "720K views",
    likes: "45.1K",
    comments: "1,105",
    shares: "9.2K",
    soundTrack: "Modern Lo-Fi · Minimal Groove",
    tags: ["css", "design", "frontend"],
    thumb:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
    aspectColor: "from-pink-900/60 to-rose-900/80",
  },
  {
    id: "s8",
    title: "Secret underground cyber cafe in Shibuya, Tokyo ☕🤖 #travel",
    creator: "Neon Nomad",
    creatorHandle: "@neonnomad",
    initials: "NN",
    views: "3.4M views",
    likes: "210K",
    comments: "5,430",
    shares: "48K",
    soundTrack: "Tokyo Night Synth · City Lights",
    tags: ["tokyo", "japan", "cyberpunk"],
    thumb:
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80",
    aspectColor: "from-indigo-900/60 to-purple-900/80",
  },
  {
    id: "s9",
    title: "TypeScript Generics visualized so simply a 5-year-old gets it 💡",
    creator: "DevPulse",
    creatorHandle: "@devpulse",
    initials: "DP",
    views: "950K views",
    likes: "64.3K",
    comments: "2,030",
    shares: "12.4K",
    soundTrack: "Code Flow Beats · Deep Focus",
    tags: ["typescript", "coding", "software"],
    thumb:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
    aspectColor: "from-sky-900/60 to-blue-900/80",
  },
  {
    id: "s10",
    title: "Restoring an abandoned 1984 Macintosh classic from scratch 🖥️",
    creator: "Retro Tech Lab",
    creatorHandle: "@retrotechlab",
    initials: "RL",
    views: "1.1M views",
    likes: "92.8K",
    comments: "3,120",
    shares: "16.5K",
    soundTrack: "Analog Waveforms · Synth Heritage",
    tags: ["retro", "hardware", "vintage"],
    thumb:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    aspectColor: "from-amber-900/60 to-orange-900/80",
  },
];
