import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface InteractiveButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  animation?: 'scale' | 'lift' | 'bounce' | 'pulse';
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
};

const sizeVariants = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const animationVariants = {
  scale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
  lift: {
    whileHover: { 
      y: -2,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    whileTap: { y: 0 },
  },
  bounce: {
    whileHover: { 
      scale: 1.05,
      transition: { type: 'spring', stiffness: 400, damping: 10 }
    },
    whileTap: { scale: 0.95 },
  },
  pulse: {
    whileHover: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.3, repeat: Infinity, repeatType: 'reverse' as const }
    },
  },
};

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  animation = 'scale',
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md border border-transparent
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const variantClasses = buttonVariants[variant];
  const sizeClasses = sizeVariants[size];
  const motionProps = animationVariants[animation];

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={isDisabled}
      {...(isDisabled ? {} : motionProps)}
      {...props}
    >
      {loading && (
        <motion.div
          className="mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.div>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      <span>{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </motion.button>
  );
};

// Specialized button components
export const PrimaryButton: React.FC<Omit<InteractiveButtonProps, 'variant'>> = (props) => (
  <InteractiveButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<InteractiveButtonProps, 'variant'>> = (props) => (
  <InteractiveButton variant="secondary" {...props} />
);

export const DangerButton: React.FC<Omit<InteractiveButtonProps, 'variant'>> = (props) => (
  <InteractiveButton variant="danger" {...props} />
);

export const GhostButton: React.FC<Omit<InteractiveButtonProps, 'variant'>> = (props) => (
  <InteractiveButton variant="ghost" {...props} />
);