export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  // AI provider keys + GitHub tokens live in the browser (localStorage), NOT here.
} as const;
