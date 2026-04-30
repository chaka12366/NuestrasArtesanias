import { useState, useCallback } from "react";

export function useFormValidation(initialValues, validationFn) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setValues(v => ({ ...v, [name]: newValue }));

    setTouched(t => ({ ...t, [name]: true }));

    if (validationFn) {
      const error = validationFn(name, newValue, values);
      setErrors(err => ({
        ...err,
        [name]: error || null,
      }));
    }
  }, [validationFn, values]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
  }, []);

  const setFieldValue = useCallback((name, value) => {
    setValues(v => ({ ...v, [name]: value }));
    setTouched(t => ({ ...t, [name]: true }));

    if (validationFn) {
      const error = validationFn(name, value, values);
      setErrors(err => ({ ...err, [name]: error || null }));
    }
  }, [validationFn, values]);

  const setFieldError = useCallback((name, error) => {
    setErrors(err => ({ ...err, [name]: error }));
  }, []);

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

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : null;
  }, [errors, touched]);

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
