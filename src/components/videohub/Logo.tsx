import { FacetubeLogoIcon } from "./FacetubeLogoIcon";

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
    <a href="/" className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <FacetubeLogoIcon size={size} />
      {showName && (
        <span className="text-[1.18rem] font-extrabold tracking-tight text-foreground">
          Face<span className="text-brand">Tube</span>
        </span>
      )}
    </a>
  );
}
