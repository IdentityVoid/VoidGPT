import { ConvexReactClient, ConvexProvider } from "convex/react";
import type { ReactNode } from "react";

// Convex deployment URL is provided via VITE_CONVEX_URL.
// For local dev, run `bun convex dev` to authenticate and generate the deployment URL,
// then add it to the project keys / .env.local.
const convexUrl =
  import.meta.env.VITE_CONVEX_URL ?? "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(convexUrl, { unsavedChangesWarning: false });

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
