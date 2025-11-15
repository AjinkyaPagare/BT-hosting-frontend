import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, Paperclip, Send, Smile, Info, Plus, ArrowLeft } from "lucide-react";
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
import type { Group, Message } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Search as SearchComponent } from "@/components/ui/Search";
import { useToast } from "@/hooks/use-toast";
import { groupApi } from "@/services/group_apis";
import { searchUsers } from "@/services/search";
import { useAuth } from "@/context/AuthContext";
import { friendsService } from "@/services/friends";

type Friend = {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
};

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [messageInput, setMessageInput] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friendQuery, setFriendQuery] = useState("");
  const [friendResults, setFriendResults] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const friendSearchInputRef = useRef<HTMLInputElement | null>(null);

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

  // Load groups list when component mounts
  useEffect(() => {
    const loadGroups = async () => {
      if (!user?.id) {
        setIsLoadingGroups(false);
        return;
      }

      setIsLoadingGroups(true);
      try {
        console.log("Loading groups for user:", user.id);
        const groupsList = await groupApi.getGroupsList(user.id);
        console.log(`Received ${groupsList.length} groups`);
        if (groupsList.length === 0) {
          console.warn("No groups returned from API. The user may have no memberships yet.");
        }
        setGroups(groupsList);
      } catch (error) {
        console.error("Error loading groups:", error);
        console.error("Full error details:", error);
        toast({
          title: "Failed to load groups",
          description: "Could not fetch your groups. Please check the console for details.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadGroups();
  }, [user?.id, toast]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsList = await friendsService.getFriendList();
        const filteredFriends = friendsList.filter((f) => f.id && f.name && f.email);
        const mapped: Friend[] = filteredFriends.map((f) => ({
          id: f.id!,
          name: f.name!,
          email: f.email!,
          isOnline: false, // Friends service doesn't provide online status
        }));
        setFriendResults(mapped);
      } catch (error) {
        console.error("Error loading friends:", error);
      }
    };

    loadFriends();
  }, []);

  useEffect(() => {
    const query = friendQuery.trim();

    if (!query) {
      setFriendResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      searchUsers(query, controller.signal)
        .then((results) => {
          const mapped: Friend[] = results.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            isOnline: u.isOnline,
          }));

          setFriendResults(mapped);
        })
        .catch((error) => {
          if ((error as any).name !== "AbortError") {
            console.error("Group create friend search error", error);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [friendQuery]);

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
    return friendResults;
  }, [friendResults]);

  const handleToggleFriend = (friend: Friend) => {
    setSelectedFriendIds((prev) => {
      const alreadySelected = prev.includes(friend.id);
      const next = alreadySelected ? prev.filter((id) => id !== friend.id) : [...prev, friend.id];

      // If this is a new selection, clear the search text so user can search next member
      if (!alreadySelected) {
        setFriendQuery("");
        if (friendSearchInputRef.current) {
          friendSearchInputRef.current.focus();
        }
      }

      return next;
    });

    setSelectedFriends((prev) => {
      const exists = prev.find((f) => f.id === friend.id);
      if (exists) {
        return prev.filter((f) => f.id !== friend.id);
      }
      return [...prev, friend];
    });
  };

  const handleFriendSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && friendQuery === "" && selectedFriends.length > 0) {
      // Remove last selected friend when input is empty
      setSelectedFriends((prev) => {
        const updated = [...prev];
        const removed = updated.pop();
        if (removed) {
          setSelectedFriendIds((ids) => ids.filter((id) => id !== removed.id));
        }
        return updated;
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please provide a name for your group.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a group.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingGroup(true);

    try {
      // Ensure owner is included in user_ids (API might require at least the owner)
      // Remove duplicates and ensure owner is first
      const userIdsSet = new Set([user.id, ...selectedFriendIds]);
      const userIds = Array.from(userIdsSet);

      // Validate that we have at least the owner
      if (userIds.length === 0) {
        toast({
          title: "Invalid request",
          description: "At least one member (owner) is required.",
          variant: "destructive",
        });
        setIsCreatingGroup(false);
        return;
      }

      // Validate user ID format (should be UUID)
      if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
        toast({
          title: "Invalid user ID",
          description: "User ID is missing or invalid. Please log in again.",
          variant: "destructive",
        });
        setIsCreatingGroup(false);
        return;
      }

      // Validate user_ids array contains valid UUIDs
      const validUserIds = userIds.filter(id => id && typeof id === 'string' && id.trim() !== '');
      if (validUserIds.length === 0) {
        toast({
          title: "Invalid members",
          description: "Please select at least one valid member.",
          variant: "destructive",
        });
        setIsCreatingGroup(false);
        return;
      }

      const requestPayload = {
        name: groupName.trim(),
        owner_id: user.id,
        user_ids: validUserIds,
        is_open: false,
      };

      console.log("Creating group with data:", requestPayload);

      const createdGroup = await groupApi.createGroup(requestPayload);

      console.log("Group created successfully:", createdGroup);

      setGroups((prev) => [createdGroup, ...prev.filter((group) => group.id !== createdGroup.id)]);
      setSelectedGroup(createdGroup);

      // Try to refresh groups list from API in the background
      // This ensures we have the latest data, but doesn't block the UI
      try {
        const refreshedGroups = await groupApi.getGroupsList(user.id);
        setGroups(refreshedGroups);
        const latestCreated = refreshedGroups.find((g) => g.id === createdGroup.id) || createdGroup;
        setSelectedGroup(latestCreated);
      } catch (error) {
        // If refresh fails, that's okay - we already added the group locally
        console.warn("Could not refresh groups list from API, using local group:", error);
      }

      toast({
        title: "Group created",
        description: `${groupName.trim()} is ready for conversations.`,
      });

      setGroupName("");
      setSelectedFriendIds([]);
      setSelectedFriends([]);
      setFriendQuery("");
      setIsCreateGroupOpen(false);
    } catch (error: any) {
      console.error("Error creating group:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Full error:", JSON.stringify(error.response?.data, null, 2));
      
      // Handle 422 validation errors specifically
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data;
        let errorMessage = "Validation error: ";
        
        if (validationErrors?.detail) {
          if (Array.isArray(validationErrors.detail)) {
            errorMessage += validationErrors.detail.map((err: any) => 
              `${err.loc?.join('.')}: ${err.msg}`
            ).join(', ');
          } else {
            errorMessage += validationErrors.detail;
          }
        } else if (validationErrors?.message) {
          errorMessage = validationErrors.message;
        } else {
          errorMessage = JSON.stringify(validationErrors);
        }
        
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message || 
                            (Array.isArray(error.response?.data) ? error.response?.data.join(", ") : JSON.stringify(error.response?.data)) ||
                            error.message || 
                            "An error occurred while creating the group.";
        
        toast({
          title: "Failed to create group",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessageInput("");
  };

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
                <div className="flex-1 overflow-y-auto space-y-6 pr-1 p-3">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group name</Label>
                    <Input
                      id="group-name"
                      placeholder="Product Launch"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="group-member-search">Add members</Label>
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                      {selectedFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs"
                        >
                          <span className="font-medium">{friend.name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleFriend(friend)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <input
                        id="group-member-search"
                        className="flex-1 bg-transparent outline-none text-sm min-w-[120px]"
                        placeholder="Search friends by name or email"
                        value={friendQuery}
                        onChange={(e) => setFriendQuery(e.target.value)}
                        onKeyDown={handleFriendSearchKeyDown}
                        ref={friendSearchInputRef}
                      />
                    </div>
                    <div className="rounded-md border border-border mt-2">
                      {filteredFriends.length === 0 && friendQuery.trim() ? (
                        <p className="p-3 text-sm text-muted-foreground">No users found.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {filteredFriends.map((friend) => {
                            const isSelected = selectedFriendIds.includes(friend.id);
                            return (
                              <li
                                key={friend.id}
                                onClick={() => handleToggleFriend(friend)}
                                className={cn(
                                  "flex items-center justify-between gap-3 p-3 cursor-pointer",
                                  isSelected && "bg-accent",
                                )}
                              >
                                <div>
                                  <p className="text-sm font-medium">{friend.name}</p>
                                  <p className="text-xs text-muted-foreground">{friend.email}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button variant="ghost" onClick={() => setIsCreateGroupOpen(false)} disabled={isCreatingGroup}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={isCreatingGroup}>
                    {isCreatingGroup ? "Creating..." : "Create group"}
                  </Button>
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
          {isLoadingGroups ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-lg font-semibold mb-2">No groups yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first group to start collaborating with your team.
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => (
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
                    {group.lastMessage?.content || `${group.members.length} members`}
                  </p>
                  {group.unreadCount > 0 && (
                    <Badge className="ml-2 shrink-0 bg-primary text-primary-foreground">
                      {group.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            ))
          )}
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
                  {selectedGroup.members.length > 0 ? selectedGroup.members.length : selectedGroup.memberIds.length} members
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
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSent={message.senderId === user?.id}
                />
              ))
            )}
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
