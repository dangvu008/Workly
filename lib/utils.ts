import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to conditionally join classNames together
 * This is useful for React Native StyleSheet objects as well
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A React Native specific utility to merge style objects
 * @param styles Array of style objects to merge
 * @returns Merged style object
 */
export function mergeStyles(...styles: any[]) {
  return styles.filter(Boolean).reduce((merged, style) => {
    if (!style) return merged
    return { ...merged, ...style }
  }, {})
}
