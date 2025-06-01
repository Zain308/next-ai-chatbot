import type React from "react"

interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export default function SimpleButton({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}: SimpleButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline:
      "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700",
    ghost: "hover:bg-gray-100 text-gray-900 dark:hover:bg-gray-700 dark:text-white",
  }

  const sizeClasses = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 py-1 text-sm",
    lg: "h-12 px-6 py-3 text-base",
    icon: "h-10 w-10",
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
