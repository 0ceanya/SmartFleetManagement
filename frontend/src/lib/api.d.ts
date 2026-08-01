declare module "@/lib/api" {
  export function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T>;
}
