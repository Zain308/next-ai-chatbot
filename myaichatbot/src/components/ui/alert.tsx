import type * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

export function Alert({ className = "", variant = "default", children, ...props }: AlertProps) {
  const variantClasses = {
    default: "bg-white border-gray-200 text-gray-950 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50",
    destructive: "border-red-200 text-red-800 dark:border-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950/20",
  }

  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function AlertDescription({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
      {children}
    </div>
  )
}
