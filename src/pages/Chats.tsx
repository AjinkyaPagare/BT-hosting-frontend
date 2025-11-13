import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Paperclip, Send, Smile, Info, Phone, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatListItem from "@/components/ChatListItem";
import MessageBubble from "@/components/MessageBubble";
import { Chat, Message } from "@/types";

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

const Chats = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(mockChats[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();

  const filteredChats = mockChats.filter((chat) => {
    const matchesSearch = chat.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "unread" && chat.unreadCount > 0);
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // Handle message send
    setMessageInput("");
  };

  return (
    <div className="flex h-full">
      {/* Chat List */}
      <div className="w-full md:w-96 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border space-y-3">
          <h2 className="text-2xl font-bold">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
            </TabsList>
          </Tabs>
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
        <div className="flex-1 flex flex-col bg-background">
          {/* Chat Header */}
          <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-3">
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
                onClick={() => navigate(`/chats/${selectedChat.id}/info`)}
              >
                <Info className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
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
