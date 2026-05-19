import React from 'react'
import { motion } from 'framer-motion'

const variants = {
  initial:  { opacity: 0, y: 14, scale: 0.995 },
  animate:  { opacity: 1, y: 0,  scale: 1     },
  exit:     { opacity: 0, y: -8, scale: 0.998 },
}

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
    >
      {children}
    </motion.div>
  )
}
