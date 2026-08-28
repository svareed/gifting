import type { Ornament as OrnamentId } from "@/lib/themes";

const PATHS: Record<OrnamentId, React.ReactNode> = {
  diamond: (
    <>
      <path d="M11 2 L20 11 L11 20 L2 11 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M11 6.5 L15.5 11 L11 15.5 L6.5 11 Z" fill="currentColor" opacity=".55" />
    </>
  ),
  tile: (
    <>
      <path d="M11 1.5 L14 8 L20.5 11 L14 14 L11 20.5 L8 14 L1.5 11 L8 8 Z" fill="currentColor" opacity=".75" />
      <circle cx="11" cy="11" r="2.2" fill="none" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 2 C6 7 6 15 11 20 C16 15 16 7 11 2 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M11 3.5 V18.5" stroke="currentColor" strokeWidth=".7" />
    </>
  ),
  deco: (
    <>
      <path d="M2 11 H20" stroke="currentColor" strokeWidth=".8" />
      <path d="M11 4 L15 11 L11 18 L7 11 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="11" cy="11" r="1.4" fill="currentColor" />
    </>
  ),
  weave: (
    <>
      <path d="M2 8 H20 M2 14 H20" stroke="currentColor" strokeWidth=".8" />
      <path d="M8 5 L14 17 M14 5 L8 17" stroke="currentColor" strokeWidth=".8" />
    </>
  ),
};

export function Ornament({ id, size = 22 }: { id: OrnamentId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      {PATHS[id]}
    </svg>
  );
}

export function Rule({ id }: { id: OrnamentId }) {
  return (
    <div className="rule" aria-hidden="true">
      <Ornament id={id} />
    </div>
  );
}
