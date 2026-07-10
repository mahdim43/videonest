interface SubtitleOverlayProps {
  activeCues: string[]
  showSubtitles: boolean
  prefs: {
    font_size?: number
    color?: string
    background_opacity?: number
    outline?: boolean
    outline_width?: number
    outline_color?: string
    shadow?: boolean
    shadow_offset?: number
    shadow_color?: string
    position?: number
  } | null
}

export default function SubtitleOverlay({ activeCues, showSubtitles, prefs }: SubtitleOverlayProps) {
  if (activeCues.length === 0 || !showSubtitles) return null

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1"
      style={{ bottom: `${prefs?.position ?? 60}px` }}
    >
      {activeCues.map((text, i) => (
        <div
          key={i}
          className="px-3 py-1 rounded-md text-center max-w-[80%]"
          style={{
            fontSize: `${prefs?.font_size || 24}px`,
            color: prefs?.color || '#FFFFFF',
            backgroundColor: (prefs?.background_opacity ?? 0.5) > 0
              ? `rgba(0, 0, 0, ${prefs?.background_opacity ?? 0.5})`
              : 'transparent',
            textShadow: prefs?.outline
              ? (() => {
                  const w = prefs?.outline_width || 2
                  const c = prefs?.outline_color || '#000000'
                  return `-${w}px -${w}px 0 ${c}, ${w}px -${w}px 0 ${c}, -${w}px ${w}px 0 ${c}, ${w}px ${w}px 0 ${c}`
                })()
              : prefs?.shadow
                ? `${prefs?.shadow_offset || 2}px ${prefs?.shadow_offset || 2}px 2px ${prefs?.shadow_color || '#000000'}`
                : 'none',
            lineHeight: 1.4,
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ))}
    </div>
  )
}
