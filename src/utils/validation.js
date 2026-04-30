

export const validateEmail = (value) => {
  if (!value || !value.trim()) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(value.trim())) {
    return "Please enter a valid email address";
  }
  return null;
};

export const validatePassword = (value, minLength = 8) => {
  if (!value) {
    return "Password is required";
  }
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return null;
};

export const calculatePasswordStrength = (value) => {
  let strength = 0;
  if (value.length >= 8) strength++;
  if (value.length >= 12) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;
  return strength;
};

export const getPasswordStrengthLabel = (strength) => {
  const labels = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
  return labels[strength] || "Unknown";
};

export const getPasswordStrengthColor = (strength) => {
  const colors = ["#e74c3c", "#e67e22", "#f1c40f", "#27ae60", "#1e8449"];
  return colors[strength] || "#e74c3c";
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return "Please confirm your password";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
};

export const validatePhone = (value) => {
  if (!value || !value.trim()) {
    return "Phone number is required";
  }
  const phoneRegex = /^\+?[\d\s()-]{7,15}$/;
  if (!phoneRegex.test(value.trim())) {
    return "Please enter a valid phone number (e.g. +501 600-0000)";
  }
  return null;
};

export const validateName = (value, fieldName = "Name") => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  if (value.trim().length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }
  if (value.trim().length > 50) {
    return `${fieldName} must be less than 50 characters`;
  }
  return null;
};

export const validateAddress = (value) => {
  if (!value || !value.trim()) {
    return "Address is required";
  }
  if (value.trim().length < 5) {
    return "Please enter a complete address";
  }
  return null;
};

export const validateCity = (value) => {
  if (!value || !value.trim()) {
    return "City is required";
  }
  return null;
};

export const validateDistrict = (value) => {
  if (!value) {
    return "District is required";
  }
  return null;
};

export const validateTerms = (isChecked) => {
  if (!isChecked) {
    return "You must agree to the terms and conditions";
  }
  return null;
};

export const validateRequired = (value, fieldName = "This field") => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateForm = (formData, validationRules) => {
  const errors = {};
  Object.entries(validationRules).forEach(([fieldName, validationFn]) => {
    const error = validationFn(formData[fieldName]);
    if (error) {
      errors[fieldName] = error;
    }
  });
  return errors;
};

export const trimValue = (value) => {
  return typeof value === "string" ? value.trim() : value;
};

export const isFormValid = (errors) => {
  return Object.values(errors).every(error => !error);
};

export const hasErrors = (errors) => {
  return Object.values(errors).some(error => error);
};
