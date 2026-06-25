import logoPng from "@/assets/logo.png";

export function Logo({ className = "h-10 w-auto", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logoPng} alt="Compssa Dues" className={className} />
      {showText && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-primary">Compssa Dues</div>
        </div>
      )}
    </div>
  );
}
