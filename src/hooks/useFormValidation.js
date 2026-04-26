import { useState, useCallback } from "react";

/**
 * useFormValidation - Reusable hook for form validation with real-time feedback
 * 
 * Usage:
 * const { values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldError } = useFormValidation(
 *   { email: '', password: '' },
 *   validateFn
 * );
 */
export function useFormValidation(initialValues, validationFn) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change with real-time validation
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setValues(v => ({ ...v, [name]: newValue }));
    
    // Mark field as touched
    setTouched(t => ({ ...t, [name]: true }));
    
    // Real-time validation
    if (validationFn) {
      const error = validationFn(name, newValue, values);
      setErrors(err => ({
        ...err,
        [name]: error || null,
      }));
    }
  }, [validationFn, values]);

  // Handle blur to mark field as touched
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  }, []);

  // Manually set field value
  const setFieldValue = useCallback((name, value) => {
    setValues(v => ({ ...v, [name]: value }));
    setTouched(t => ({ ...t, [name]: true }));
    
    if (validationFn) {
      const error = validationFn(name, value, values);
      setErrors(err => ({ ...err, [name]: error || null }));
    }
  }, [validationFn, values]);

  // Manually set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(err => ({ ...err, [name]: error }));
  }, []);

  // Validate all fields
  const validateAll = useCallback(() => {
    const newErrors = {};
    Object.keys(values).forEach(name => {
      if (validationFn) {
        const error = validationFn(name, values[name], values);
        if (error) {
          newErrors[name] = error;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationFn]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Get field error (only show if touched)
  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : null;
  }, [errors, touched]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return Object.values(errors).every(err => !err);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    validateAll,
    resetForm,
    getFieldError,
    isFormValid,
    setIsSubmitting,
    isSubmitting,
  };
}
