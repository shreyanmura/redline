export default function PoweredBy() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center border-b border-line bg-ink/70 py-2 backdrop-blur-md">
      <span className="text-[12px] tracking-wide text-white/45">
        Powered by <span className="font-medium text-white/75">Vercel</span>
        <span className="mx-1.5 text-white/25">&amp;</span>
        <span className="font-medium text-white/75">Backboard.io</span>
      </span>
    </div>
  );
}
