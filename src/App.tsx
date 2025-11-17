import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Chats from "./pages/Chats";
import ChatInfo from "./pages/ChatInfo";
import Groups from "./pages/Groups";
import GroupInfo from "./pages/GroupInfo";
import GroupMedia from "./pages/GroupMedia";
import Calendar from "./pages/Calendar";
import Files from "./pages/Files";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "@/pages/Signup";
import Landing from "@/pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to="chats" replace />} />
                <Route path="chats" element={<Chats />} />
                <Route path="chats/:chatId" element={<Chats />} />
                <Route path="chats/:chatId/info" element={<ChatInfo />} />
                <Route path="groups" element={<Groups />} />
                <Route path="groups/:groupId/info" element={<GroupInfo />} />
                <Route path="groups/:groupId/media" element={<GroupMedia />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="files" element={<Files />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
