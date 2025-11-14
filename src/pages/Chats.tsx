import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, Send, Smile, Info, Phone, Video, Plus, Mail, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search as SearchComponent } from "@/components/ui/Search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ChatListItem from "@/components/ChatListItem";
import MessageBubble from "@/components/MessageBubble";
import { Chat, Message } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockChats: Chat[] = [
  {
    id: "1",
    userId: "user1",
    user: {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      isOnline: true,
    },
    lastMessage: {
      id: "msg1",
      chatId: "1",
      senderId: "user1",
      content: "Hey! How are you doing?",
      type: "text",
      timestamp: new Date().toISOString(),
      isRead: false,
      isDelivered: true,
    },
    unreadCount: 2,
    isPinned: false,
  },
  {
    id: "2",
    userId: "user2",
    user: {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
    },
    lastMessage: {
      id: "msg2",
      chatId: "2",
      senderId: "me",
      content: "Thanks for the update!",
      type: "text",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: true,
      isDelivered: true,
    },
    unreadCount: 0,
    isPinned: false,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    chatId: "1",
    senderId: "user1",
    content: "Hi there! How's your day going?",
    type: "text",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: true,
    isDelivered: true,
  },
  {
    id: "2",
    chatId: "1",
    senderId: "me",
    content: "Hey! It's going great, thanks for asking!",
    type: "text",
    timestamp: new Date(Date.now() - 7100000).toISOString(),
    isRead: true,
    isDelivered: true,
  },
  {
    id: "3",
    chatId: "1",
    senderId: "user1",
    content: "That's wonderful to hear!",
    type: "text",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    isDelivered: true,
  },
];

const mockFriends = [
  { id: "user1", name: "John Doe", email: "john@example.com", isOnline: true },
  { id: "user2", name: "Jane Smith", email: "jane@example.com", isOnline: false },
  { id: "user3", name: "Bob Johnson", email: "bob@example.com", isOnline: true },
  { id: "user4", name: "Alice Brown", email: "alice@example.com", isOnline: true },
];

const Chats = () => {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop && !selectedChat && chats[0]) {
      setSelectedChat(chats[0]);
    }
  }, [isDesktop, selectedChat, chats]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const matchesSearch = chat.user.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && chat.unreadCount > 0) ||
        (filter === "read" && chat.unreadCount === 0);
      return matchesSearch && matchesFilter;
    });
  }, [chats, filter, searchQuery]);

  const filteredFriends = useMemo(() => {
    const query = friendQuery.trim().toLowerCase();
    if (!query) return mockFriends;
    return mockFriends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) || friend.email.toLowerCase().includes(query),
    );
  }, [friendQuery]);

  const handleStartChat = (friendId: string) => {
    const existingChat = chats.find((chat) => chat.userId === friendId);
    if (existingChat) {
      setSelectedChat(existingChat);
      toast({
        title: "Chat already exists",
        description: `Resuming conversation with ${existingChat.user.name}.`,
      });
      setIsCreateChatOpen(false);
      return;
    }

    const friend = mockFriends.find((f) => f.id === friendId);
    if (!friend) return;

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      userId: friend.id,
      user: {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        isOnline: friend.isOnline,
      },
      unreadCount: 0,
      isPinned: false,
    };

    setChats((prev) => [newChat, ...prev]);
    setSelectedChat(newChat);
    toast({
      title: "New chat created",
      description: `You can now message ${friend.name}.`,
    });
    setIsCreateChatOpen(false);
  };

  const handleSendInvite = () => {
    const email = inviteEmail.trim();
    if (!email) {
      toast({
        title: "Enter an email",
        description: "Provide an email address to send an invite.",
        variant: "destructive",
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Invite sent",
      description: `We've sent a chat invitation to ${email}.`,
    });
    setInviteEmail("");
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // Handle message send
    setMessageInput("");
  };

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row md:gap-0 md:overflow-hidden">
      {/* Chat List */}
      <div
        className={cn(
          "w-full md:w-96 bg-card border border-border rounded-lg md:rounded-none md:border-y-0 md:border-l-0 md:border-b-0 md:border-r md:h-full overflow-hidden",
          selectedChat ? "hidden md:flex md:flex-col" : "flex flex-col"
        )}
      >
        <div className="border-b border-border space-y-3 pr-4 pl-16 py-4 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Chats</h2>
            <Dialog open={isCreateChatOpen} onOpenChange={setIsCreateChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New chat
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Start a new chat</DialogTitle>
                  <DialogDescription>
                    Search your friends to begin a conversation or send an invite by email.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-6 pr-1 p-1">
                  <div className="space-y-2">
                    <Label htmlFor="friend-search">Search friends</Label>
                    <Input
                      id="friend-search"
                      placeholder="Search by name or email"
                      value={friendQuery}
                      onChange={(e) => setFriendQuery(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button variant="ghost" onClick={() => setIsCreateChatOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <SearchComponent
            placeholder="Search chats..."
            value={searchQuery}
            onChange={setSearchQuery}
            selectedFilter={filter === "all" ? null : filter}
            onFilterChange={(next) =>
              setFilter((next ? next : "all") as "all" | "unread" | "read")
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              onClick={() => setSelectedChat(chat)}
              isActive={selectedChat?.id === chat.id}
            />
          ))}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-background border border-border rounded-lg md:border-none md:rounded-none">
          {/* Chat Header */}
          <div className="h-16 border-b border-border flex items-center justify-between bg-card pr-4 pl-16 md:px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedChat(null)}
                aria-label="Back to chat list"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedChat.user.avatar} alt={selectedChat.user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedChat.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedChat.user.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedChat.user.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/app/chats/${selectedChat.id}/info`)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {mockMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSent={message.senderId === "me"}
              />
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="bg-message-received text-message-received-foreground rounded-2xl rounded-bl-none px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4 bg-card">
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              <Button variant="ghost" size="icon" className="order-2 md:order-1">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 order-1 md:order-2"
              />
              <Button variant="ghost" size="icon" className="order-3 md:order-3">
                <Smile className="h-5 w-5" />
              </Button>
              <Button onClick={handleSendMessage} size="icon" className="order-4 md:order-4">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-background border border-border md:border-none md:rounded-none rounded-lg">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Select a chat</h3>
            <p className="text-muted-foreground">Choose a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chats;
