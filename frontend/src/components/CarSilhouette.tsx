type Shape = { roofStart: number; roofEnd: number; roofY: number }

// Rough profile per body type: where the roof begins/ends and how tall it is.
const SHAPES: Record<string, Shape> = {
  sedan: { roofStart: 80, roofEnd: 150, roofY: 30 },
  hatchback: { roofStart: 76, roofEnd: 168, roofY: 30 },
  suv: { roofStart: 70, roofEnd: 188, roofY: 20 },
  mpv: { roofStart: 62, roofEnd: 198, roofY: 20 },
}

/** Drawn stand-in used while a photo loads or when none can be found. */
export function CarSilhouette({ category, className = '' }: { category: string; className?: string }) {
  const { roofStart: rs, roofEnd: re, roofY: ry } = SHAPES[category.trim().toLowerCase()] ?? SHAPES.sedan
  const body = `M8 78 V66 Q8 58 24 56 L${rs - 24} 54 L${rs} ${ry} H${re} L${re + 26} 54 L212 56 Q232 58 232 68 V78 Z`
  const glass = `M${rs - 12} 52 L${rs + 6} ${ry + 6} H${re - 4} L${re + 14} 52 Z`

  return (
    <svg viewBox="0 0 240 100" className={className} role="img" aria-label={`${category} silhouette`}>
      <ellipse cx="120" cy="92" rx="104" ry="5" fill="currentColor" opacity="0.12" />
      <path d={body} fill="currentColor" opacity="0.85" />
      <path d={glass} fill="#fff" opacity="0.35" />
      {[62, 180].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="78" r="14" fill="#10141f" />
          <circle cx={cx} cy="78" r="6" fill="#9aa3b5" />
        </g>
      ))}
    </svg>
  )
}
