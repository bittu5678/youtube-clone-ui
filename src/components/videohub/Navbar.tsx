import {
  Menu,
  Search,
  Mic,
  Plus,
  Bell,
  ShieldCheck,
  LogOut,
  User,
  ArrowLeft,
  UserPlus,
  MessageSquare,
  ThumbsUp,
  DollarSign,
  Sparkles,
  CheckCheck,
  Video as VideoIcon,
  Settings as SettingsIcon,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { allVideos } from "@/data/videos";

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface NotificationItem {
  id: string;
  type: "subscriber" | "comment" | "like" | "earnings" | "update";
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "subscriber",
    title: "New Subscriber",
    description: "Alex Rivera subscribed to your channel",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "notif-2",
    type: "comment",
    title: "New Comment",
    description: "Marcus Bell commented: 'Brilliant explanation on state management!'",
    time: "15 min ago",
    unread: true,
  },
  {
    id: "notif-3",
    type: "like",
    title: "New Like",
    description: "Elena Rostova and 28 others liked your video",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "notif-4",
    type: "earnings",
    title: "Premium Earnings",
    description: "$142.50 earned from ad placements and creator revenue",
    time: "3 hours ago",
    unread: true,
  },
  {
    id: "notif-5",
    type: "update",
    title: "System Update",
    description: "FaceTube 2.4 update: 4K 60fps streaming & creator tools are now live",
    time: "1 day ago",
    unread: true,
  },
];

export function Navbar({
  onToggleSidebar,
  query,
  onQueryChange,
}: {
  onToggleSidebar: () => void;
  query?: string;
  onQueryChange?: (value: string) => void;
}) {
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(query ?? "");
  const [isListening, setIsListening] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => n.unread).length;

  const popularSuggestions = useMemo(
    () => [
      "React Dashboard",
      "Neural Networks Explainer",
      "TypeScript 5.5",
      "CSS Grid & Flexbox",
      "System Design Interview",
      "Vite Performance",
      "Next.js vs Remix",
      "AI Agents Full Course",
    ],
    [],
  );

  const filteredSuggestions = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return popularSuggestions.slice(0, 6);
    const set = new Set<string>();
    for (const v of allVideos) {
      if (v.title.toLowerCase().includes(q)) set.add(v.title);
      if (v.category.toLowerCase().includes(q)) set.add(v.category);
      if (v.channel.toLowerCase().includes(q)) set.add(v.channel);
    }
    for (const p of popularSuggestions) {
      if (p.toLowerCase().includes(q)) set.add(p);
    }
    const list = Array.from(set);
    return list.length > 0 ? list.slice(0, 7) : popularSuggestions.slice(0, 5);
  }, [searchInput, popularSuggestions]);

  useEffect(() => {
    if (query !== undefined) {
      setSearchInput(query);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
      if (
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(e.target as Node)
      ) {
        // keep mobile search open if user taps inside
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up recognition instance on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSearchSubmit = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      onQueryChange?.(trimmed);
      navigate({
        to: "/",
        search: { q: trimmed || undefined },
      });
      setMobileSearchOpen(false);
    },
    [navigate, onQueryChange],
  );

  const startListening = async () => {
    const SpeechRecognition =
      (
        window as unknown as {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Voice search is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Apple Safari.",
      );
      return;
    }

    // Direct call to browser's native microphone permission
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast.error("Microphone permission denied");
          return;
        }
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";
      recognition.maxAlternatives = 1;

      let recognizedText = "";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          recognizedText = currentText;
          setSearchInput(currentText);
          onQueryChange?.(currentText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast.error("Microphone permission denied");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recognizedText.trim()) {
          const finalQuery = recognizedText.trim();
          setSearchInput(finalQuery);

          // Automatically insert recognized text and simulate Enter keypress
          const activeInput = inputRef.current || mobileInputRef.current;
          if (activeInput) {
            activeInput.value = finalQuery;
            activeInput.dispatchEvent(new Event("input", { bubbles: true }));
            activeInput.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
              }),
            );
          }

          handleSearchSubmit(finalQuery);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleToggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
    } else {
      void startListening();
    }
  };

  const initials = profile?.username
    ? profile.username.substring(0, 2).toUpperCase()
    : user?.email
      ? user.email.substring(0, 2).toUpperCase()
      : "AK";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      {/* Mobile Search Overlay */}
      {mobileSearchOpen ? (
        <div
          ref={mobileSearchContainerRef}
          className="relative flex h-16 w-full items-center gap-2 px-2 md:hidden"
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={() => {
              setMobileSearchOpen(false);
              setSuggestionsOpen(false);
            }}
            className="rounded-full p-2 text-foreground/80 transition hover:bg-secondary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative flex-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSuggestionsOpen(false);
                handleSearchSubmit(searchInput);
              }}
              className="group flex h-10 w-full items-center rounded-full border border-border bg-secondary/60 pl-4 pr-1 transition focus-within:border-brand/50 focus-within:bg-background focus-within:shadow-lift"
            >
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={mobileInputRef}
                type="search"
                placeholder={isListening ? "Listening…" : "Search videos, creators, topics…"}
                value={searchInput}
                onFocus={() => setSuggestionsOpen(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSuggestionsOpen(true);
                  onQueryChange?.(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setSuggestionsOpen(false);
                    handleSearchSubmit(searchInput);
                  }
                }}
                autoFocus
                className="h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid h-8 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand-dark"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Mobile Search Suggestions Dropdown */}
            {suggestionsOpen && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Search suggestions
                </div>
                <div className="py-1">
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchInput(item);
                        setSuggestionsOpen(false);
                        handleSearchSubmit(item);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-medium text-foreground transition hover:bg-secondary"
                    >
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Search with voice"
            onClick={handleToggleVoiceSearch}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground/80 transition hover:bg-brand/10 hover:text-brand"
          >
            <Mic className="h-4 w-4" />
          </button>

          {/* Small Listening indicator below the search bar */}
          {isListening && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute -bottom-2.5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-0.5 text-xs font-semibold text-red-500 shadow-md backdrop-blur-sm animate-in fade-in"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span>Listening...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-16 items-center gap-2 px-3 sm:gap-4 sm:px-5">
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={onToggleSidebar}
            className="rounded-full p-2 text-foreground/80 transition hover:bg-secondary active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Logo />

          {/* Desktop Search Bar with Live Filtering and Suggestions */}
          <div
            ref={searchContainerRef}
            className="relative mx-auto hidden w-full max-w-xl items-center gap-2 md:flex"
          >
            <div className="relative w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSuggestionsOpen(false);
                  handleSearchSubmit(searchInput);
                }}
                className="group flex h-10 w-full items-center rounded-full border border-border bg-secondary/60 pl-4 pr-1 transition focus-within:border-brand/50 focus-within:bg-background focus-within:shadow-lift"
              >
                <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="search"
                  placeholder={isListening ? "Listening…" : "Search videos, creators, topics…"}
                  value={searchInput}
                  onFocus={() => setSuggestionsOpen(true)}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSuggestionsOpen(true);
                    onQueryChange?.(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setSuggestionsOpen(false);
                      handleSearchSubmit(searchInput);
                    }
                  }}
                  className="h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="grid h-8 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition hover:bg-brand-dark"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {suggestionsOpen && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-border/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-brand" />
                      Search Suggestions
                    </span>
                    <span>Press Enter to search</span>
                  </div>
                  <div className="py-1">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchInput(item);
                          setSuggestionsOpen(false);
                          handleSearchSubmit(item);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-medium text-foreground transition hover:bg-secondary group"
                      >
                        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-brand" />
                        <span className="truncate">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              aria-label="Search with voice"
              onClick={handleToggleVoiceSearch}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground/80 transition hover:bg-brand/10 hover:text-brand"
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* Small Listening indicator below the search bar */}
            {isListening && (
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-none absolute -bottom-7 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-0.5 text-xs font-semibold text-red-500 shadow-md backdrop-blur-sm animate-in fade-in"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span>Listening...</span>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setMobileSearchOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-secondary md:hidden"
            >
              <Search className="h-5 w-5" />
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-brand-foreground sm:flex"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}

            <Link
              to="/upload"
              className="hidden items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lift transition hover:bg-brand-dark active:scale-95 sm:flex"
            >
              <Plus className="h-4 w-4" />
              Create
            </Link>

            {/* Theme Toggle Switch */}
            <ThemeToggle />

            {/* Bell Notifications Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-secondary active:scale-95"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-background">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-border/70 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                        }
                        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition hover:text-brand"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40 py-1">
                    {notifications.map((n) => {
                      const Icon =
                        n.type === "subscriber"
                          ? UserPlus
                          : n.type === "comment"
                            ? MessageSquare
                            : n.type === "like"
                              ? ThumbsUp
                              : n.type === "earnings"
                                ? DollarSign
                                : Sparkles;

                      const iconColor =
                        n.type === "subscriber"
                          ? "bg-brand/15 text-brand"
                          : n.type === "comment"
                            ? "bg-blue-500/15 text-blue-500"
                            : n.type === "like"
                              ? "bg-amber-500/15 text-amber-500"
                              : n.type === "earnings"
                                ? "bg-emerald-500/15 text-emerald-500"
                                : "bg-purple-500/15 text-purple-500";

                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() =>
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === n.id ? { ...item, unread: false } : item,
                              ),
                            )
                          }
                          className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-secondary ${
                            n.unread ? "bg-secondary/40 font-medium" : "opacity-80"
                          }`}
                        >
                          <div
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${iconColor}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground">{n.title}</p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                              {n.description}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground/75">{n.time}</p>
                          </div>
                          {n.unread && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand ring-2 ring-background" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Profile / Auth Button & YouTube-style Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label="Your profile"
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotificationsOpen(false);
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-bold text-brand-foreground ring-2 ring-transparent transition hover:ring-brand/30"
                >
                  {initials}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="border-b border-border/70 px-3 py-2.5">
                      <p className="truncate text-xs font-bold text-foreground">
                        {profile?.full_name || `@${profile?.username || user.email?.split("@")[0]}`}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? "bg-brand/15 text-brand"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          Role: {role}
                        </span>
                      </div>
                    </div>

                    {/* Menu items as required */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        My Profile
                      </Link>

                      <Link
                        to="/your-videos"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                      >
                        <VideoIcon className="h-4 w-4 text-muted-foreground" />
                        Your Videos
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                      >
                        <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                        Settings
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                        >
                          <ShieldCheck className="h-4 w-4 text-brand" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border/70 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setProfileOpen(false);
                          await signOut();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:text-brand"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
