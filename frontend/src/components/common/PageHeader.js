// frontend/src/components/common/PageHeader.js
import React from "react";

export const PageHeader = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="mb-4 sm:mb-0">
        {breadcrumbs && (
          <nav className="flex space-x-2 text-sm text-gray-500 mb-2">
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-gray-700 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    className={
                      index === breadcrumbs.length - 1 ? "text-gray-900" : ""
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center space-x-3">
          {Array.isArray(actions)
            ? actions.map((action, index) => <div key={index}>{action}</div>)
            : actions}
        </div>
      )}
    </div>
  );
};
