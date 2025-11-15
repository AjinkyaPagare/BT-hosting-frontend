import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Paperclip, Send, Smile, Info, Phone, Video, Plus, ArrowLeft, Loader2, Ban } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ChatListItem from "@/components/ChatListItem";
import MessageBubble from "@/components/MessageBubble";
import { Chat, Message, FriendRequest as FriendRequestType, FriendListItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { friendsService } from "@/services/friends";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { chatService, mapBackendToUi } from "@/services/chat";
import { filesService } from "@/services/files";
import { wsService } from "@/services/ws";
 
type Friend = {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
};
 
// messages are loaded from API
 
const Chats = () => {
  const queryClient = useQueryClient();
 
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [friendResults, setFriendResults] = useState<Friend[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
 
  const {
    data: pendingRequests = [],
    isLoading: isPendingLoading,
    isFetching: isPendingFetching,
    isError: isPendingError,
  } = useQuery({
    queryKey: ["friends", "pending"],
    queryFn: friendsService.getPendingRequests,
  });
 
  const {
    data: friendList = [],
    isLoading: isFriendsLoading,
    isFetching: isFriendsFetching,
    isError: isFriendsError,
  } = useQuery({
    queryKey: ["friends", "list"],
    queryFn: friendsService.getFriendList,
  });
 
  const {
    data: sentRequests = [],
    isLoading: isSentLoading,
    isFetching: isSentFetching,
    isError: isSentError,
  } = useQuery({
    queryKey: ["friends", "sent"],
    queryFn: friendsService.getSentRequests,
  });
 
  const chats = useMemo<Chat[]>(
    () =>
      friendList.map((friend: FriendListItem) => ({
        id: friend.id,
        userId: friend.id,
        user: {
          id: friend.id,
          name: friend.name ?? "Unknown",
          email: friend.email ?? "",
          isOnline: false,
        },
        unreadCount: 0,
        isPinned: false,
      })),
    [friendList]
  );
 
  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );
 
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
 
  useEffect(() => {
    if (isDesktop && !selectedChatId && chats[0]) {
      setSelectedChatId(chats[0].id);
    }
  }, [isDesktop, selectedChatId, chats]);
 
  useEffect(() => {
    if (selectedChatId && !chats.some((chat) => chat.id === selectedChatId)) {
      setSelectedChatId(chats[0]?.id ?? null);
    }
    if (!selectedChatId && chats[0]) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);
 
  // Load direct messages when chat changes
  useEffect(() => {
    const load = async () => {
      if (!selectedChat?.user.id) {
        setMessages([]);
        seenMessageIdsRef.current = new Set();
        return;
      }
      try {
        const history = await chatService.listDirectMessages(selectedChat.user.id, 200, 0);
        const seen = new Set<string>();
        const unique = history.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setMessages(unique);
        seenMessageIdsRef.current = seen;
      } catch (error: any) {
        console.error("Error loading direct messages:", error);
        toast({
          title: "Failed to load messages",
          description: error?.response?.data?.detail || error?.message || "Unable to load messages",
          variant: "destructive",
        });
      }
    };
    load();
  }, [selectedChat?.user.id, toast]);
 
  // Real-time: connect to direct chat WebSocket using current user id
  useEffect(() => {
    if (!user?.id) return;
 
    const conn = wsService.connectDirect(user.id, {
      onMessage: (data) => {
        if (!data || typeof data !== "object") return;
        if (data.type === "direct_message" && data.payload) {
          try {
            const p: any = data.payload;
            const peerId = p.sender_id === user.id ? p.receiver_id : p.sender_id;
            // only append if the message belongs to the currently selected chat
            if (!selectedChat?.user.id || peerId !== selectedChat.user.id) return;
            const ui = mapBackendToUi(p);
            // ensure chatId matches our chat model (peer id)
            ui.chatId = String(peerId);
            if (seenMessageIdsRef.current.has(ui.id)) return;
            seenMessageIdsRef.current.add(ui.id);
            setMessages((prev) => [...prev, ui]);
          } catch (e) {
            // ignore malformed frames
          }
        }
      },
    });
 
    return () => {
      conn.close();
    };
  }, [user?.id, selectedChat?.user.id]);
 
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
 
  const pendingChatItems = useMemo(
    () =>
      sentRequests.map((request) => ({
        id: request.id,
        name: request.receiverName ?? request.receiverEmail ?? "Unknown",
        email: request.receiverEmail ?? "",
        createdAt: request.createdAt,
      })),
    [sentRequests]
  );
 
  const filteredPendingChats = useMemo(() => {
    if (filter !== "all") return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pendingChatItems;
    return pendingChatItems.filter((item) =>
      item.name.toLowerCase().includes(query) || item.email.toLowerCase().includes(query)
    );
  }, [filter, pendingChatItems, searchQuery]);
 
  const filteredIncomingRequests = useMemo(() => {
    if (filter !== "all") return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pendingRequests;
    return pendingRequests.filter((request) => {
      const name = (request.requesterName ?? "").toLowerCase();
      const email = (request.requesterEmail ?? "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [filter, pendingRequests, searchQuery]);
 
  const shouldShowPendingSections = filter === "all";
 
  useEffect(() => {
    const query = friendQuery.trim();
 
    if (!query) {
      setFriendResults([]);
      return;
    }
 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      api
        .get("/search", {
          params: { q: query },
          signal: controller.signal,
        })
        .then((response) => {
          const users = Array.isArray(response.data) ? response.data : response.data?.results ?? [];
          const mapped: Friend[] = users
            .map((u: any) => ({
              id: String(u.id ?? u.userId ?? ""),
              name: String(u.name ?? u.full_name ?? ""),
              email: String(u.email ?? ""),
              isOnline: Boolean(u.isOnline ?? false),
            }))
            .filter((u) => u.id && u.name);
 
          setFriendResults(mapped);
        })
        .catch((error) => {
          if ((error as any).name !== "CanceledError") {
            console.error("Friend search error", error);
          }
        });
    }, 300);
 
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [friendQuery]);
 
  const invalidateFriendQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["friends", "pending"] });
    queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    queryClient.invalidateQueries({ queryKey: ["friends", "sent"] });
    queryClient.invalidateQueries({ queryKey: ["friends", "blocked"] });
  };
 
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
 
  const acceptMutation = useMutation({
    mutationFn: friendsService.acceptRequest,
    onMutate: (requestId: string) => {
      setActingRequestId(requestId);
    },
    onSuccess: () => {
      toast({ title: "Friend request accepted" });
      invalidateFriendQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept request",
        description: error?.response?.data?.detail || error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setActingRequestId(null);
    },
  });
 
  const rejectMutation = useMutation({
    mutationFn: friendsService.rejectRequest,
    onMutate: (requestId: string) => {
      setActingRequestId(requestId);
    },
    onSuccess: () => {
      toast({ title: "Friend request rejected" });
      invalidateFriendQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject request",
        description: error?.response?.data?.detail || error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setActingRequestId(null);
    },
  });
 
  const sendRequestMutation = useMutation({
    mutationFn: friendsService.sendRequest,
    onSuccess: (data) => {
      toast({
        title: "Friend request sent",
        description: `Request sent to ${data.receiverName ?? data.receiverEmail ?? data.receiverId}.`,
      });
      invalidateFriendQueries();
      setIsCreateChatOpen(false);
      setFriendQuery("");
      setFriendResults([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error?.response?.data?.detail || error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
 
  const blockFriendMutation = useMutation({
    mutationFn: friendsService.blockFriend,
    onSuccess: (data) => {
      toast({
        title: "Friend blocked",
        description: `${data.receiverName ?? data.receiverEmail ?? "User"} has been blocked.`,
      });
      invalidateFriendQueries();
      setSelectedChatId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to block friend",
        description: error?.response?.data?.detail || error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
 
  const handleSendFriendRequest = (friendId: string) => {
    if (!friendId) return;
 
    const existingChat = chats.find((chat) => chat.userId === friendId);
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      toast({
        title: "Already connected",
        description: `Opening conversation with ${existingChat.user.name}.`,
      });
      setIsCreateChatOpen(false);
      return;
    }
 
    const alreadySent = sentRequests.some(
      (request) => request.receiverId === friendId && request.status === "pending"
    );
    if (alreadySent) {
      toast({
        title: "Request already sent",
        description: "You have already sent a friend request to this user.",
      });
      return;
    }
 
    sendRequestMutation.mutate(friendId);
  };
 
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat?.user.id || !user?.id) return;
 
    const temp: Message = {
      id: `temp-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: user.id,
      content: messageInput,
      type: "text",
      timestamp: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
    };
    setMessages((prev) => [...prev, temp]);
    setMessageInput("");
 
    try {
      const sent = await chatService.sendDirectMessage({
        user_id: user.id,
        receiver_id: selectedChat.user.id,
        content: temp.content,
      });
      // Mark final ID to avoid WS duplicate
      seenMessageIdsRef.current.add(sent.id);
      setMessages((prev) => {
        const already = prev.some((m) => m.id === sent.id);
        if (already) {
          // WS delivered first -> drop temp
          return prev.filter((m) => m.id !== temp.id);
        }
        return prev.map((m) => (m.id === temp.id ? sent : m));
      });
    } catch (error: any) {
      console.error("Error sending direct message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      toast({
        title: "Failed to send",
        description: error?.response?.data?.detail || error?.message || "Message not sent",
        variant: "destructive",
      });
    }
  };
 
  const openFilePicker = () => fileInputRef.current?.click();
 
  const handleFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat?.user.id || !user?.id) return;
 
    const tempId = `temp-file-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      chatId: selectedChat.id,
      senderId: user.id,
      content: messageInput || "",
      type: file.type.startsWith("image/") ? "image" : "file",
      fileUrl: undefined,
      fileName: file.name,
      timestamp: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
    };
    setMessages((prev) => [...prev, optimistic]);
 
    try {
      const uploaded = await filesService.upload(file);
      const sent = await chatService.sendDirectMessage({
        user_id: user.id,
        receiver_id: selectedChat.user.id,
        content: messageInput || undefined,
        file_url: uploaded.path,
        file_name: uploaded.originalFilename,
        file_type: file.type || undefined,
      });
      seenMessageIdsRef.current.add(sent.id);
      setMessages((prev) => {
        const already = prev.some((m) => m.id === sent.id);
        if (already) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? sent : m));
      });
    } catch (error: any) {
      console.error("Error uploading/sending file:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast({
        title: "File send failed",
        description: error?.response?.data?.detail || error?.message || "Could not send the file",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessageInput("");
    }
  };
 
  const handleBlockFriend = (friendId: string) => {
    if (!friendId || blockFriendMutation.isPending) {
      return;
    }
    blockFriendMutation.mutate(friendId);
  };
  const formatRequestDate = (request: FriendRequestType) => {
    try {
      return new Date(request.createdAt).toLocaleString();
    } catch (error) {
      return "";
    }
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
                <div className="flex-1 min-h-0 flex flex-col space-y-2 pr-1 p-1">
                  <div className="space-y-2">
                    <Label htmlFor="friend-search">Search friends</Label>
                    <Input
                      id="friend-search"
                      placeholder="Search by name or email"
                      value={friendQuery}
                      onChange={(e) => setFriendQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 mt-4 overflow-y-auto flex-1 min-h-0 pr-1">
                    {friendResults.length === 0 && friendQuery.trim() && (
                      <p className="text-sm text-muted-foreground">No users found.</p>
                    )}
                    {friendResults.map((friend) => {
                      const alreadyFriend = chats.some((chat) => chat.userId === friend.id);
                      const alreadyRequested = sentRequests.some(
                        (request) => request.receiverId === friend.id && request.status === "pending"
                      );
                      return (
                        <div
                          key={friend.id}
                          className="w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                friend.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40",
                              )}
                            />
                            <div>
                              <p className="font-medium">{friend.name}</p>
                              <p className="text-xs text-muted-foreground">{friend.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={alreadyFriend ? "secondary" : "default"}
                            onClick={() => handleSendFriendRequest(friend.id)}
                            disabled={alreadyFriend || alreadyRequested || sendRequestMutation.isPending}
                          >
                            {alreadyFriend
                              ? "Open chat"
                              : alreadyRequested
                              ? "Requested"
                              : "Send request"}
                          </Button>
                        </div>
                      );
                    })}
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
 
        <div className="flex-1 overflow-y-auto space-y-4 p-4 pt-0">
          {shouldShowPendingSections && (
            <div className="space-y-6">
              <div className="space-y-2">
                {(isPendingLoading || isPendingFetching) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading requests...
                  </div>
                )}
                {isPendingError && (
                  <p className="text-sm text-destructive">Unable to load friend requests.</p>
                )}
                {!isPendingLoading && !isPendingFetching && filteredIncomingRequests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Friend requests</h3>
                    {filteredIncomingRequests.map((request) => {
                      const name = request.requesterName ?? request.requesterEmail ?? "Unknown";
                      const isActing = actingRequestId === request.id;
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card/60 p-3"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{name}</span>
                            <span className="text-xs text-muted-foreground">
                              Requested on {formatRequestDate(request)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => acceptMutation.mutate(request.id)}
                              disabled={
                                isActing || acceptMutation.isPending || rejectMutation.isPending
                              }
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMutation.mutate(request.id)}
                              disabled={
                                isActing || acceptMutation.isPending || rejectMutation.isPending
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
 
              <div className="space-y-2">
                {(isSentLoading || isSentFetching) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading pending chats...
                  </div>
                )}
                {isSentError && (
                  <p className="text-sm text-destructive">Unable to load pending chats.</p>
                )}
                {!isSentLoading && !isSentFetching && filteredPendingChats.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">Pending chats</h3>
                    {filteredPendingChats.map((pending) => (
                      <div
                        key={pending.id}
                        className="flex items-center justify-between rounded-lg border border-dashed border-border bg-card/40 p-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{pending.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Request sent {new Date(pending.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs uppercase">
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
 
          {(isFriendsLoading || isFriendsFetching) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading friends...
            </div>
          )}
          {isFriendsError && (
            <p className="text-sm text-destructive">Unable to load friends list.</p>
          )}
          {!isFriendsLoading && !isFriendsFetching && filteredChats.length === 0 && (
            <p className="text-sm text-muted-foreground">No friends to show. Try adding new connections.</p>
          )}
          {filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              onClick={() => setSelectedChatId(chat.id)}
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
                onClick={() => setSelectedChatId(null)}
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
                onClick={() => handleBlockFriend(selectedChat.user.id)}
                disabled={blockFriendMutation.isPending}
                aria-label="Block friend"
              >
                <Ban className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/app/chats/${selectedChat.user.id}/info`)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          </div>
 
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSent={message.senderId === user?.id}
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
              <Button variant="ghost" size="icon" className="order-2 md:order-1" onClick={openFilePicker}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
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
 
 