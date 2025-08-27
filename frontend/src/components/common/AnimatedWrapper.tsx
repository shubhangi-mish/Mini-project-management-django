import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, fadeIn, scaleIn, staggerContainer, staggerItem } from '../../utils/animations';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: 'fadeInUp' | 'fadeIn' | 'scaleIn' | 'stagger';
  className?: string;
  delay?: number;
  duration?: number;
}

const animationVariants = {
  fadeInUp,
  fadeIn,
  scaleIn,
  stagger: staggerContainer,
};

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeInUp',
  className = '',
  delay = 0,
  duration,
}) => {
  const variants = animationVariants[animation];
  
  // Custom duration override
  const customVariants = duration ? {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate?.transition,
        duration,
        delay,
      },
    },
  } : variants;

  return (
    <motion.div
      className={className}
      variants={customVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ delay }}
    >
      {children}
    </motion.div>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  className = '',
  itemClassName = '',
}) => {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          variants={staggerItem}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface AnimatedPresenceWrapperProps {
  children: React.ReactNode;
  show: boolean;
  animation?: 'fadeInUp' | 'fadeIn' | 'scaleIn';
  className?: string;
}

export const AnimatedPresenceWrapper: React.FC<AnimatedPresenceWrapperProps> = ({
  children,
  show,
  animation = 'fadeInUp',
  className = '',
}) => {
  const variants = animationVariants[animation];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};