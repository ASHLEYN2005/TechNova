import logpng from "@/assets/log.png";

export function Logo({ className = "h-25 w-auto", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logpng} alt="Compssa Dues" className={className} />
      {showText && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-primary"></div>
        </div>
      )}
    </div>
  );
}
