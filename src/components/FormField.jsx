
import { memo } from "react";

export const FormField = memo(function FormField({
  label,
  error,
  touched,
  value,
  children,
  required = false,
  hint = null,
  half = false,
}) {
  const hasValue = value && value.toString().trim().length > 0;
  const isValid = touched && hasValue && !error;

  return (
    <div className={`form-field ${half ? "form-field-half" : ""}`}>
      {label && (
        <label className="form-field-label">
          {label}
          {required && <span className="form-field-required">*</span>}
        </label>
      )}
      {hint && <span className="form-field-hint">{hint}</span>}
      {children}
      {touched && error && (
        <span className="form-error">{error}</span>
      )}
      {isValid && (
        <span className="form-valid-feedback">Looks good!</span>
      )}
    </div>
  );
});

export default FormField;
