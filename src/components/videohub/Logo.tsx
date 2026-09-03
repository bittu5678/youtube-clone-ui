import { Link } from "@tanstack/react-router";
import { FacetubeLogoIcon } from "./FacetubeLogoIcon";

export function Logo({
  size = 34,
  showName = true,
  className = "",
  asLink = true,
}: {
  size?: number;
  showName?: boolean;
  className?: string;
  asLink?: boolean;
}) {
  const content = (
    <>
      <FacetubeLogoIcon size={size} />
      {showName && (
        <span className="text-[1.18rem] font-extrabold tracking-tight text-foreground">
          Face<span className="text-brand">Tube</span>
        </span>
      )}
    </>
  );

  if (!asLink) {
    return <div className={`flex shrink-0 items-center gap-2.5 ${className}`}>{content}</div>;
  }

  return (
    <Link to="/" className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      {content}
    </Link>
  );
}
