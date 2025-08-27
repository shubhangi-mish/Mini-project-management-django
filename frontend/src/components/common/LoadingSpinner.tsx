import React from 'react';
import { motion } from 'framer-motion';
import { pulseVariants, fadeIn } from '../../utils/animations';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  overlay?: boolean;
  color?: 'blue' | 'gray' | 'white';
  variant?: 'spinner' | 'dots' | 'pulse';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text,
  overlay = false,
  color = 'blue',
  variant = 'spinner'
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    blue: 'border-gray-300 border-t-blue-600',
    gray: 'border-gray-200 border-t-gray-600',
    white: 'border-gray-400 border-t-white',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`rounded-full bg-current ${sizeClasses[size]}`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <motion.div
            className={`rounded-full bg-current ${sizeClasses[size]}`}
            variants={pulseVariants}
            animate="animate"
          />
        );
      
      default:
        return (
          <motion.div
            className={`rounded-full border-2 ${colorClasses[color]} ${sizeClasses[size]}`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
            role="status"
            aria-label={text || "Loading"}
          >
            <span className="sr-only">{text || "Loading..."}</span>
          </motion.div>
        );
    }
  };

  const spinner = (
    <motion.div 
      className={`flex items-center justify-center ${className}`}
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <div className={variant === 'dots' ? `text-${color === 'blue' ? 'blue-600' : color === 'white' ? 'white' : 'gray-600'}` : ''}>
        {renderSpinner()}
      </div>
      {text && (
        <motion.span 
          className={`ml-2 ${textSizeClasses[size]} text-gray-600`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.span>
      )}
    </motion.div>
  );

  if (overlay) {
    return (
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div 
          className="bg-white rounded-lg p-6 shadow-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {spinner}
        </motion.div>
      </motion.div>
    );
  }

  return spinner;
};

// Specialized loading components for common use cases
export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="xl" text={text} />
  </div>
);

export const InlineLoadingSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <LoadingSpinner size="sm" text={text} className="py-4" />
);

export const ButtonLoadingSpinner: React.FC = () => (
  <LoadingSpinner size="sm" color="white" />
);

export const OverlayLoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <LoadingSpinner size="lg" text={text} overlay />
);