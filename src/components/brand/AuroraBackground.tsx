import { cn } from "../../utils/cn";

interface AuroraBackgroundProps {
  className?: string;
  /** Show the drifting grid overlay. */
  grid?: boolean;
  /** Show the grain overlay that keeps large gradients from banding. */
  noise?: boolean;
  /** Show the spectrum hairline pinned to the top of the viewport. */
  hairline?: boolean;
}

/**
 * Ambient page backdrop: three drifting spectrum blobs, a masked grid and a
 * grain pass. Fixed and non-interactive so it never affects layout or input.
 * Every piece is driven by the RGB utilities in index.css, so the Settings
 * kill switch and prefers-reduced-motion both neutralise it.
 */
export function AuroraBackground({
  className,
  grid = true,
  noise = true,
  hairline = true,
}: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
    >
      {/* Drifting spectrum blobs. The wrapper cycles hue slowly so the whole
          aurora changes colour over time, independently of the drift. */}
      <div className="rgb-spectrum absolute inset-0">
        <div
          className="rgb-blob rgb-blob-a -left-[15vw] -top-[22vh] h-[70vh] w-[70vw]"
          style={{
            background: "radial-gradient(circle at 35% 35%, var(--rgb-2), transparent 68%)",
            opacity: "calc(0.4 * var(--rgb-strength))",
          }}
        />
        <div
          className="rgb-blob rgb-blob-b -right-[18vw] top-[6vh] h-[62vh] w-[62vw]"
          style={{
            background: "radial-gradient(circle at 60% 40%, var(--rgb-3), transparent 66%)",
            opacity: "calc(0.34 * var(--rgb-strength))",
          }}
        />
        <div
          className="rgb-blob rgb-blob-c bottom-[-26vh] left-[24vw] h-[66vh] w-[72vw]"
          style={{
            background: "radial-gradient(circle at 50% 50%, var(--rgb-1), transparent 70%)",
            opacity: "calc(0.26 * var(--rgb-strength))",
          }}
        />
      </div>

      {grid && <div className="rgb-grid absolute inset-0" />}
      {noise && <div className="rgb-noise absolute inset-0 mix-blend-overlay" />}

      {/* Sweeping top hairline — reads as a live signal */}
      {hairline && (
        <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="rgb-hairline" />
        </div>
      )}
    </div>
  );
}