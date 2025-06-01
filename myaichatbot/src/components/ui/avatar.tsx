import type * as React from "react"

export function Avatar({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`} {...props}>
      {children}
    </div>
  )
}

export function AvatarImage({ className = "", src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img className={`aspect-square h-full w-full ${className}`} src={src || "/placeholder.svg"} alt={alt} {...props} />
  )
}

export function AvatarFallback({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
