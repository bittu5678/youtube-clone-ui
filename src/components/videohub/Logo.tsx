import logo from "@/assets/videohub-logo.png.asset.json";

export function Logo({
  size = 34,
  showName = true,
  className = "",
}: {
  size?: number;
  showName?: boolean;
  className?: string;
}) {
  return (
    <a href="/" className={`flex shrink-0 items-center gap-2 ${className}`}>
      <img
        src="/favicon.png"
        alt="Facetube"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {showName && (
        <span className="text-[1.15rem] font-extrabold tracking-tight text-foreground">
          Face<span className="text-brand">tube</span>
        </span>
      )}
    </a>
  );
}
