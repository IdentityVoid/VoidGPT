import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { ConvexClientProvider } from "@/lib/convexClient";
import { Landing } from "@/routes/Landing";
import { Chat } from "@/routes/Chat";
import { Navbar } from "@/components/Navbar";

export default function App(): ReactNode {
  return (
    <ConvexClientProvider>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <Navbar />
        <div className="min-h-0 flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
          </Routes>
        </div>
      </div>
    </ConvexClientProvider>
  );
}
