import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");
  return `${apiBase}${path}`;
}

export function gameStatusLabel(status: string) {
  switch (status) {
    case "WAITING":
      return "Waiting for opponent";
    case "IN_PROGRESS":
      return "In progress";
    case "X_WON":
      return "X won";
    case "O_WON":
      return "O won";
    case "DRAW":
      return "Draw";
    case "ABANDONED":
      return "Abandoned";
    default:
      return status;
  }
}
