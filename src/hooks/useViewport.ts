import { useEffect, useState } from 'react'

/** Largura da janela reativa, para breakpoints de layout.
 *  `narrow` (< 900px) também vive no estado global; `mid` (< 1280px) é só
 *  presentacional e fica aqui. */
export function useViewport() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return { width, narrow: width < 900, mid: width < 1280 }
}
