import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize a search query string for use in Prisma `contains` filters.
 * Strips control characters and truncates to a safe length.
 */
export function sanitizeSearch(input: string, maxLength = 200): string {
  return input
    .replace(/[\x00-\x1f\x7f]/g, '') // strip control characters
    .trim()
    .slice(0, maxLength);
}
