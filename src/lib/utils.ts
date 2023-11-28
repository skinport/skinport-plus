import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseNumberFromString(string: string) {
  return parseFloat(string.replace(/[^\d.]/g, ""));
}

export function getPercentageDecrease(oldNumber: number, newNumber: number) {
  const percentageDecrease = Math.round(
    ((newNumber - oldNumber) / oldNumber) * 100,
  );

  return percentageDecrease < 0 ? `${percentageDecrease}%` : null;
}
