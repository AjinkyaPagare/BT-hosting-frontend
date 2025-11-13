import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Paperclip, Send, Smile, Info, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MessageBubble from "@/components/MessageBubble";
import { Group, Message } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const mockGroups: Group[] = [
  {
    id: "1",
    name: "Team Alpha",
    description: "Main project team",
    adminIds: ["admin1"],
    memberIds: ["user1", "user2", "user3"],
    members: [],
    lastMessage: {
      id: "msg1",
      chatId: "1",
      senderId: "user1",
      content: "Let's schedule a meeting tomorrow",
      type: "text",
      timestamp: new Date().toISOString(),
      isRead: false,
      isDelivered: true,
    },
    unreadCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Design Team",
    description: "UI/UX discussions",
    adminIds: ["admin2"],
    memberIds: ["user1", "user4", "user5"],
    members: [],
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    chatId: "1",
    senderId: "user1",
    content: "Hi everyone! Ready for the new sprint?",
    type: "text",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    isRead: true,
    isDelivered: true,
  },
  {
    id: "2",
    chatId: "1",
    senderId: "me",
    content: "Yes, excited to get started!",
    type: "text",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: true,
    isDelivered: true,
  },
];

const Groups = () => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(mockGroups[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [messageInput, setMessageInput] = useState("");
  const navigate = useNavigate();

  const filteredGroups = mockGroups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "unread" && group.unreadCount > 0);
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput("");
  };

  return (
    <div className="flex h-full">
      {/* Group List */}
      <div className="w-full md:w-96 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Groups</h2>
            <Button size="icon" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
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
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors border-b border-border",
                selectedGroup?.id === group.id && "bg-accent"
              )}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={group.avatar} alt={group.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {group.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                  {group.lastMessage && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {format(new Date(group.lastMessage.timestamp), "HH:mm")}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {group.lastMessage?.content || group.description || "No messages yet"}
                  </p>
                  {group.unreadCount > 0 && (
                    <Badge className="ml-2 shrink-0 bg-primary text-primary-foreground">
                      {group.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group Chat */}
      {selectedGroup ? (
        <div className="flex-1 flex flex-col bg-background">
          <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedGroup.avatar} alt={selectedGroup.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedGroup.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{selectedGroup.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedGroup.memberIds.length} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/groups/${selectedGroup.id}/info`)}
              >
                <Info className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {mockMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSent={message.senderId === "me"}
              />
            ))}
          </div>

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
            <h3 className="text-xl font-semibold mb-2">Select a group</h3>
            <p className="text-muted-foreground">Choose a group to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
