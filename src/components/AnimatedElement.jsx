/* ── Reusable animated wrapper for smooth effects ── */
export function AnimatedElement({ children, animation = 'fadeUp', delay = 0, className = '' }) {
  const animationClass = {
    fadeIn: 'animate-fadeIn',
    fadeUp: 'animate-fadeUp',
    fadeDown: 'animate-fadeDown',
    fadeLeft: 'animate-fadeLeft',
    fadeRight: 'animate-fadeRight',
    scaleIn: 'animate-scaleIn',
    bounceIn: 'animate-bounceIn',
    slideInLeft: 'animate-slideInLeft',
    slideInRight: 'animate-slideInRight',
  }[animation] || 'animate-fadeUp'

  const delayClass = delay > 0 ? `delay-${Math.min(Math.round(delay * 100) / 100 * 100, 500)}` : ''

  return (
    <div className={`${animationClass} ${delayClass} ${className}`}>
      {children}
    </div>
  )
}

/* ── Wrapper for list items with stagger animation ── */
export function AnimatedList({ children, itemAnimation = 'fadeUp', staggerDelay = 0.1 }) {
  return (
    <>
      {children && Array.isArray(children)
        ? children.map((child, i) => (
            <AnimatedElement key={child?.key || i} animation={itemAnimation} delay={i * staggerDelay}>
              {child}
            </AnimatedElement>
          ))
        : children}
    </>
  )
}
