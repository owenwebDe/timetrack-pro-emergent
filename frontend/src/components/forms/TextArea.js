// frontend/src/components/forms/TextArea.js - Reusable textarea component
import React from "react";

export const TextArea = ({
  value,
  onChange,
  placeholder = "",
  rows = 3,
  className = "",
  ...props
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${className}`}
      {...props}
    />
  );
};
