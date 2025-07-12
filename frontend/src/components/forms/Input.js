// frontend/src/components/forms/Input.js - Reusable input component
import React from "react";

export const Input = ({
  type = "text",
  value,
  onChange,
  placeholder = "",
  className = "",
  error = false,
  ...props
}) => {
  const baseClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
  const errorClasses = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
    : "border-gray-300 focus:border-blue-500";

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  );
};
