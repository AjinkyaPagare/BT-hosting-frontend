import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Paperclip, Send, Smile, Info, Plus, Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MessageBubble from "@/components/MessageBubble";
import { Group, Message } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Search as SearchComponent } from "@/components/ui/Search";
import { useToast } from "@/hooks/use-toast";

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

const mockFriends = [
  { id: "user1", name: "John Doe", email: "john@example.com", isOnline: true },
  { id: "user2", name: "Jane Smith", email: "jane@example.com", isOnline: false },
  { id: "user3", name: "Bob Johnson", email: "bob@example.com", isOnline: true },
  { id: "user4", name: "Alice Brown", email: "alice@example.com", isOnline: true },
  { id: "user5", name: "Charlie Adams", email: "charlie@example.com", isOnline: false },
];

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [messageInput, setMessageInput] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [friendQuery, setFriendQuery] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
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
    if (isDesktop && !selectedGroup && groups[0]) {
      setSelectedGroup(groups[0]);
    }
  }, [isDesktop, selectedGroup, groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && group.unreadCount > 0) ||
        (filter === "read" && group.unreadCount === 0);
      return matchesSearch && matchesFilter;
    });
  }, [groups, filter, searchQuery]);

  const filteredFriends = useMemo(() => {
    const query = friendQuery.trim().toLowerCase();
    if (!query) return mockFriends;
    return mockFriends.filter(
      (friend) =>
        friend.name.toLowerCase().includes(query) || friend.email.toLowerCase().includes(query),
    );
  }, [friendQuery]);

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId],
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please provide a name for your group.",
        variant: "destructive",
      });
      return;
    }

    const members = mockFriends.filter((friend) => selectedFriendIds.includes(friend.id));
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: groupName.trim(),
      description: groupDescription.trim() || undefined,
      avatar: undefined,
      adminIds: ["me"],
      memberIds: members.map((member) => member.id),
      members: members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        isOnline: member.isOnline,
      })),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroup(newGroup);
    toast({
      title: "Group created",
      description: `${groupName.trim()} is ready for conversations.`,
    });

    setGroupName("");
    setGroupDescription("");
    setSelectedFriendIds([]);
    setFriendQuery("");
    setInviteEmail("");
    setIsCreateGroupOpen(false);
  };

  const handleSendInvite = () => {
    const email = inviteEmail.trim();
    if (!email) {
      toast({
        title: "Enter an email",
        description: "Provide an email address to send a group invite.",
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
      description: `We've invited ${email} to join your groups.`,
    });
    setInviteEmail("");
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput("");
  };

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row md:gap-0 md:overflow-hidden">
      {/* Group List */}
      <div
        className={cn(
          "w-full md:w-96 bg-card border border-border rounded-lg md:rounded-none md:border-y-0 md:border-l-0 md:border-b-0 md:border-r md:h-full overflow-hidden",
          selectedGroup ? "hidden md:flex md:flex-col" : "flex flex-col"
        )}
      >
        <div className="border-b border-border space-y-3 pr-4 pl-16 py-4 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Groups</h2>
            <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Create a new group</DialogTitle>
                  <DialogDescription>
                    Give your group a name, add teammates, or invite them via email.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Group name</Label>
                      <Input
                        id="group-name"
                        placeholder="Product Launch"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-description">Description (optional)</Label>
                      <Input
                        id="group-description"
                        placeholder="Plan and track the product launch"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="group-member-search">Add members</Label>
                    <Input
                      id="group-member-search"
                      placeholder="Search friends by name or email"
                      value={friendQuery}
                      onChange={(e) => setFriendQuery(e.target.value)}
                    />
                    <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                      {filteredFriends.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No friends found.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {filteredFriends.map((friend) => {
                            const isSelected = selectedFriendIds.includes(friend.id);
                            return (
                              <li key={friend.id} className="flex items-center justify-between gap-3 p-3">
                                <div>
                                  <p className="text-sm font-medium">{friend.name}</p>
                                  <p className="text-xs text-muted-foreground">{friend.email}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  onClick={() => handleToggleFriend(friend.id)}
                                >
                                  {isSelected ? "Added" : "Add"}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="group-invite-email">Invite by email</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="group-invite-email"
                        type="email"
                        placeholder="teammate@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <Button type="button" variant="outline" className="gap-2" onClick={handleSendInvite}>
                        <Mail className="h-4 w-4" />
                        Send invite
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button variant="ghost" onClick={() => setIsCreateGroupOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup}>Create group</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <SearchComponent
            placeholder="Search groups..."
            value={searchQuery}
            onChange={setSearchQuery}
            leadingIcon={SearchIcon}
            selectedFilter={filter === "all" ? null : filter}
            onFilterChange={(next) => setFilter((next ? next : "all") as "all" | "unread" | "read")}
          />
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
        <div className="flex-1 flex flex-col bg-background border border-border rounded-lg md:border-none md:rounded-none">
          <div className="h-16 border-b border-border flex items-center justify-between bg-card pr-4 pl-16 md:px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedGroup(null)}
                aria-label="Back to group list"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
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
                onClick={() => navigate(`/app/groups/${selectedGroup.id}/info`)}
              >
                <Info className="h-5 w-5" />
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
            <h3 className="text-xl font-semibold mb-2">Select a group</h3>
            <p className="text-muted-foreground">Pick a group conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
