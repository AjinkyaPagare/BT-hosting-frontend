import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Chats from "./pages/Chats";
import ChatInfo from "./pages/ChatInfo";
import Groups from "./pages/Groups";
import GroupInfo from "./pages/GroupInfo";
import GroupMedia from "./pages/GroupMedia";
import Friends from "./pages/Friends";
import Calendar from "./pages/Calendar";
import Files from "./pages/Files";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/chats" replace />} />
            <Route path="chats" element={<Chats />} />
            <Route path="chats/:chatId/info" element={<ChatInfo />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:groupId/info" element={<GroupInfo />} />
            <Route path="groups/:groupId/media" element={<GroupMedia />} />
            <Route path="friends" element={<Friends />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="files" element={<Files />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
