// Input validation shared by client and server — API Part 6 §3.1 rules.
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 255;
export const isValidUsername = (v: string) => /^[A-Za-z0-9_]{3,32}$/.test(v);
export const isValidPassword = (v: string) => v.length >= 8 && v.length <= 128 && /[A-Za-z]/.test(v) && /\d/.test(v);
export const isValidDisplayName = (v: string) => v.trim().length >= 3 && v.trim().length <= 32 && !/[<>{}[\]\\]/.test(v);
export function fieldError(field: string, message: string) { return { field, message }; }
