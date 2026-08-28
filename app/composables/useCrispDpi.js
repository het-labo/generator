import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Resolution to render a preview canvas at so it never looks soft.
 *
 * A canvas has two sizes: its pixel buffer and the CSS box it is stretched
 * into. Rendering a 101.6mm sticker at 96dpi gives a 407px buffer; shown 775
 * CSS px wide on a 2x display that is 1550 device pixels of demand against 407
 * of supply, and the browser interpolates the difference. Clients read that
 * blur as the quality of the artwork rather than of the preview.
 *
 * Deliberately measured at draw time rather than through a ResizeObserver: the
 * caller re-renders on every edit anyway, so measuring there covers every
 * cause of a size change — window, sidebar, tab switch — in one place, without
 * a second thing that can fall out of sync.
 *
 * @param elRef        wrapper element the canvas fills
 * @param totalWidthMm physical width including bleed
 * @param maxDpi       ceiling; past the export resolution there is nothing to gain
 */
export const useCrispDpi = (elRef, totalWidthMm, { minDpi = 96, maxDpi = 600 } = {}) => {
  const dpi = ref(minDpi)

  /** Recomputes from the element's current size. Returns the resolution to use. */
  const measure = () => {
    const width = elRef.value?.getBoundingClientRect().width
    if (!width) return dpi.value

    const devicePixels = width * (window.devicePixelRatio || 1)
    const inches = totalWidthMm / 25.4
    dpi.value = Math.min(Math.max(Math.ceil(devicePixels / inches), minDpi), maxDpi)
    return dpi.value
  }

  return { dpi, measure }
}

/**
 * Runs a redraw when the window resizes, debounced so dragging the window edge
 * does not queue a full-resolution render per pixel.
 *
 * Uses a timer rather than requestAnimationFrame on purpose: rAF is paused
 * while the page is not visible, which silently swallows a resize that
 * happened in a background tab.
 */
export const useRedrawOnResize = (redraw, delay = 150) => {
  let timer = null

  const onResize = () => {
    clearTimeout(timer)
    timer = setTimeout(redraw, delay)
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    clearTimeout(timer)
  })
}
