// frontend/src/components/forms/Select.js - Reusable select component
import React from "react";

export const Select = ({
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
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
    <select
      value={value}
      onChange={onChange}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options && options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
