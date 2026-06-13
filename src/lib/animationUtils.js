/* ── Animation utilities for consistent smooth effects ── */

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const getAnimationDelay = (index, baseDelay = 0.1) => ({
  animationDelay: `${index * baseDelay}s`,
})

export const addFadeUpAnimation = (element) => {
  if (element) {
    element.classList.add('animate-fadeUp')
  }
}

export const addScaleAnimation = (element) => {
  if (element) {
    element.classList.add('animate-scaleIn')
  }
}
