import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fieldFocusVariants } from '../../utils/animations';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
  custom?: (value: string) => string | null;
}

export interface FieldError {
  message: string;
  type: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'date' | 'datetime-local' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  validation?: ValidationRule;
  error?: string | null | undefined;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  rows?: number;
  autoComplete?: string;
  showCharacterCount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  validation,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  helpText,
  options = [],
  rows = 4,
  autoComplete,
  showCharacterCount = false,
  validateOnChange = false,
  validateOnBlur = true,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Validation function
  const validateValue = useCallback((val: string): string | null => {
    if (!validation) return null;

    // Required validation
    if (validation.required && !val.trim()) {
      return `${label} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!val.trim() && !validation.required) {
      return null;
    }

    // Length validations
    if (validation.minLength && val.length < validation.minLength) {
      return `${label} must be at least ${validation.minLength} characters`;
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return `${label} must be less than ${validation.maxLength} characters`;
    }

    // Email validation
    if (validation.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        return 'Please enter a valid email address';
      }
    }

    // URL validation
    if (validation.url) {
      try {
        new URL(val);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    // Number validation
    if (validation.number) {
      const num = parseFloat(val);
      if (isNaN(num)) {
        return 'Please enter a valid number';
      }

      if (validation.min !== undefined && num < validation.min) {
        return `${label} must be at least ${validation.min}`;
      }

      if (validation.max !== undefined && num > validation.max) {
        return `${label} must be at most ${validation.max}`;
      }
    }

    // Pattern validation
    if (validation.pattern && !validation.pattern.test(val)) {
      return `${label} format is invalid`;
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(val);
    }

    return null;
  }, [validation, label]);

  // Handle value change
  const handleChange = (newValue: string) => {
    onChange(newValue);

    if (validateOnChange) {
      const validationError = validateValue(newValue);
      setInternalError(validationError);
    } else if (touched && internalError) {
      // Clear error if user is typing and field was previously invalid
      const validationError = validateValue(newValue);
      if (!validationError) {
        setInternalError(null);
      }
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    setTouched(true);
    
    if (validateOnBlur) {
      const validationError = validateValue(value);
      setInternalError(validationError);
    }
    
    onBlur?.();
  };

  // Determine which error to show
  const displayError = error || (touched ? internalError : null);
  const hasError = !!displayError;

  // Base input classes
  const inputClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-1 sm:text-sm
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${hasError
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }
  `.trim();

  // Render input based on type
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <motion.textarea
            id={name}
            name={name}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={inputClasses}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            autoComplete={autoComplete}
            maxLength={validation?.maxLength}
            variants={fieldFocusVariants}
            animate={isFocused ? 'focus' : 'blur'}
          />
        );

      case 'select':
        return (
          <motion.select
            id={name}
            name={name}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={inputClasses}
            disabled={disabled}
            required={required}
            variants={fieldFocusVariants}
            animate={isFocused ? 'focus' : 'blur'}
          >
            {!required && <option value="">Select an option</option>}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </motion.select>
        );

      default:
        return (
          <motion.input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={inputClasses}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            maxLength={validation?.maxLength}
            min={validation?.min}
            max={validation?.max}
            variants={fieldFocusVariants}
            animate={isFocused ? 'focus' : 'blur'}
          />
        );
    }
  };

  return (
    <div className={className}>
      {/* Label */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      {renderInput()}

      {/* Character count */}
      {showCharacterCount && validation?.maxLength && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          {value.length}/{validation.maxLength} characters
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {displayError && (
          <motion.p 
            className="mt-1 text-sm text-red-600 flex items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-4 h-4 mr-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Help text */}
      {helpText && !displayError && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Hook for form validation
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rule = validationRules[name];
    if (!rule) return null;

    const stringValue = String(value || '');

    // Required validation
    if (rule.required && !stringValue.trim()) {
      return `${String(name)} is required`;
    }

    // Skip other validations if empty and not required
    if (!stringValue.trim() && !rule.required) {
      return null;
    }

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `${String(name)} must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `${String(name)} must be less than ${rule.maxLength} characters`;
    }

    // Email validation
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return 'Please enter a valid email address';
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(stringValue);
    }

    return null;
  }, [validationRules]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
    
    if (isTouched) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }
  }, [validateField, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateForm,
    validateField,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
};