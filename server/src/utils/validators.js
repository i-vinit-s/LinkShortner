function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("one number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("one special character");

  return {
    valid: errors.length === 0,
    message:
      errors.length > 0 ? "Password must contain " + errors.join(", ") : null,
  };
}

module.exports = { validatePasswordStrength };
