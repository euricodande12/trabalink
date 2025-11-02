import { motion } from "motion/react";

export function LoaderSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <motion.div
        className="w-3 h-3 bg-primary rounded-full"
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="w-3 h-3 bg-primary rounded-full"
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="w-3 h-3 bg-primary rounded-full"
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
    </div>
  );
}
