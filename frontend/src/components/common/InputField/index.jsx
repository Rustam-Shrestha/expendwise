/**
 * InputField Component — Memoized
 *
 * Wrapped in React.memo to prevent unnecessary re-renders.
 */
import React, { memo, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const InputField = memo(({
  hasAccess = true,
  id,
  label,
  value,
  type,
  placeholder,
  icon,
  onChange,
  onBlur,
  error,
  name,
  disabled = false,
  touched = undefined,
  className = "",
  ...props
}) => {
  const isDisabled = !hasAccess || disabled;
  const isReadOnly = !hasAccess || props.readOnly;
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const controlId = id || name || generatedId;
  const errorId = `${controlId}-error`;
  // Show error when touched (or when no touched tracking is used)
  const showError = error && (touched === undefined || touched);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`flex flex-col w-full ${className}`.trim()}>
      <label
        htmlFor={controlId}
        className={`text-sm font-normal mb-1 ${disabled ? "text-gray-400" : "text-primary"}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={controlId}
          name={name}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={isDisabled}
          readOnly={isReadOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={showError ? errorId : undefined}
          aria-disabled={isDisabled ? true : undefined}
          className={`${type === "date" ? "uppercase" : ""
            } w-full h-[42px] text-sm bg-[#F6F6F6] text-gray-500 px-3 py-2.5 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-sm ${
            error ? "border border-red-500" : "border border-transparent"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        />
        {type === "password" ? (
          <div
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
            onClick={togglePasswordVisibility}
            role="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        ) : (
          icon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )
        )}
        {showError && (
          <span id={errorId} role="alert" className="text-red text-sm block">
            {error}
          </span>
        )}
      </div>
    </div>
  );
});

export default InputField;
