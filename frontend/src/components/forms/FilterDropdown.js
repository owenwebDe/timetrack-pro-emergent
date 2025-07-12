// frontend/src/components/forms/FilterDropdown.js - Reusable filter dropdown
import React from "react";

export const FilterDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
