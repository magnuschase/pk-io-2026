import { useEffect, useRef, useState } from 'react'

export function useIntersectionObserver<T extends HTMLElement>(
  options?: IntersectionObserverInit,
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, ...options },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [options?.root, options?.rootMargin, options?.threshold])

  return [ref, visible]
}
