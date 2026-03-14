'use client'

import { Image } from '@tiptap/extension-image'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useCallback, useRef } from 'react'

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const startX = useRef(0)
  const startW = useRef(0)

  const width: number | string = node.attrs.width ?? '100%'

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      startX.current = e.clientX
      startW.current = imgRef.current?.offsetWidth ?? 400

      const onMove = (ev: MouseEvent) => {
        const next = Math.max(80, startW.current + (ev.clientX - startX.current))
        updateAttributes({ width: next })
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [updateAttributes],
  )

  return (
    <NodeViewWrapper className="relative inline-block max-w-full my-3 group/img">
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt ?? 'image'}
        style={{ width: typeof width === 'number' ? `${width}px` : width, display: 'block' }}
        className="rounded-lg border border-slate-200 dark:border-slate-700"
        draggable={false}
      />

      {selected && (
        <>
          {/* Preset size pills */}
          <div className="absolute top-2 left-2 flex gap-1 z-10">
            {(['25%', '50%', '75%', '100%'] as const).map((pct) => (
              <button
                key={pct}
                onMouseDown={(e) => { e.preventDefault(); updateAttributes({ width: pct }) }}
                className="px-1.5 py-0.5 text-xs font-medium bg-black/70 text-white rounded hover:bg-black/90 transition-colors"
              >
                {pct}
              </button>
            ))}
          </div>

          {/* Drag-to-resize handle (bottom-right) */}
          <div
            onMouseDown={onMouseDown}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10 flex items-center justify-center"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-white drop-shadow">
              <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 bg-primary-500 rounded-tl-sm opacity-80" />
          </div>

          {/* Selection border */}
          <div className="absolute inset-0 rounded-lg ring-2 ring-primary-500 pointer-events-none" />
        </>
      )}
    </NodeViewWrapper>
  )
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (el) => el.getAttribute('width') ?? el.style.width ?? '100%',
        renderHTML: (attrs) => ({ width: attrs.width }),
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})
