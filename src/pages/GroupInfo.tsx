import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus, UserMinus, Crown, LogOut, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { groupApi, getCurrentUserId } from "@/services/group_apis";
import { User } from "@/types";

const mockFriends = [
  { id: "user1", name: "John Doe", email: "john@example.com", isOnline: true },
  { id: "user2", name: "Jane Smith", email: "jane@example.com", isOnline: false },
  { id: "user3", name: "Bob Johnson", email: "bob@example.com", isOnline: true },
  { id: "user4", name: "Alice Brown", email: "alice@example.com", isOnline: true },
  { id: "user5", name: "Charlie Adams", email: "charlie@example.com", isOnline: false },
];

const GroupInfo = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { toast } = useToast();
  const [group, setGroup] = useState<{
    name: string;
    description?: string;
    avatar?: string;
    adminIds: string[];
    members: (User & { isAdmin?: boolean })[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    if (groupId && currentUserId) {
      fetchGroupDetails();
    }
  }, [groupId, currentUserId]);

  const fetchGroupDetails = async () => {
    if (!groupId || !currentUserId) return;

    setIsLoading(true);
    try {
      const response = await groupApi.getGroupDetails(currentUserId, groupId);
      
      // Map API response to group state
      setGroup({
        name: response.name || response.group_name || "Unknown Group",
        description: response.description,
        avatar: response.avatar,
        adminIds: response.admin_ids || response.owner_id ? [response.owner_id] : [],
        members: response.members || response.member_ids?.map((id: string) => {
          // You might need to fetch user details separately or the API might return full user objects
          const mockUser = mockFriends.find(f => f.id === id);
          return {
            id,
            name: mockUser?.name || "Unknown User",
            email: mockUser?.email || "",
            isOnline: mockUser?.isOnline || false,
            isAdmin: response.admin_ids?.includes(id) || response.owner_id === id,
          };
        }) || [],
      });
    } catch (error: any) {
      console.error("Error fetching group details:", error);
      toast({
        title: "Failed to load group",
        description: error.response?.data?.detail || error.message || "An error occurred while loading the group.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!groupId || !currentUserId || selectedFriendIds.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select at least one member to add.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingMembers(true);
    try {
      await groupApi.addMembers({
        user_id: currentUserId,
        group_id: groupId,
        'user_ids to add': selectedFriendIds,
      });

      toast({
        title: "Members added",
        description: `Successfully added ${selectedFriendIds.length} member(s) to the group.`,
      });

      // Refresh group details
      await fetchGroupDetails();
      setIsAddMemberOpen(false);
      setSelectedFriendIds([]);
      setFriendQuery("");
    } catch (error: any) {
      console.error("Error adding members:", error);
      toast({
        title: "Failed to add members",
        description: error.response?.data?.detail || error.message || "An error occurred while adding members.",
        variant: "destructive",
      });
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberIdToRemove: string) => {
    if (!groupId || !currentUserId) return;

    setIsRemovingMember(memberIdToRemove);
    try {
      await groupApi.removeMember({
        user_id: currentUserId,
        group_id: groupId,
        'user_id to remove': memberIdToRemove,
      });

      toast({
        title: "Member removed",
        description: "The member has been removed from the group.",
      });

      // Refresh group details
      await fetchGroupDetails();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Failed to remove member",
        description: error.response?.data?.detail || error.message || "An error occurred while removing the member.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingMember(null);
    }
  };

  const filteredFriends = mockFriends.filter((friend) => {
    const query = friendQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      friend.name.toLowerCase().includes(query) ||
      friend.email.toLowerCase().includes(query)
    );
  }).filter((friend) => {
    // Filter out members who are already in the group
    return !group?.members.some((member) => member.id === friend.id);
  });

  const isAdmin = currentUserId && group?.adminIds.includes(currentUserId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading group details...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Group not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-4 bg-card pr-4 pl-16 py-4 md:p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Group Info</h2>
        </div>
      </div>

      <div className="p-6 bg-card border-b border-border">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {group.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {group.members.length} members
            </p>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground max-w-md">{group.description}</p>
          )}
        </div>

        {isAdmin && (
          <div className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Group
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Change Photo
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Members ({group.members.length})</h3>
            {isAdmin && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Members</DialogTitle>
                    <DialogDescription>
                      Search and select members to add to this group.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-search">Search friends</Label>
                      <Input
                        id="member-search"
                        placeholder="Search by name or email"
                        value={friendQuery}
                        onChange={(e) => setFriendQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                      {filteredFriends.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No friends found or all friends are already members.</p>
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
                                  onClick={() =>
                                    setSelectedFriendIds((prev) =>
                                      prev.includes(friend.id)
                                        ? prev.filter((id) => id !== friend.id)
                                        : [...prev, friend.id]
                                    )
                                  }
                                >
                                  {isSelected ? "Selected" : "Select"}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsAddMemberOpen(false)} disabled={isAddingMembers}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMembers} disabled={isAddingMembers || selectedFriendIds.length === 0}>
                      {isAddingMembers ? "Adding..." : "Add Members"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={member.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{member.name}</p>
                      {member.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                {isAdmin && !member.isAdmin && member.id !== currentUserId && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Crown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isRemovingMember === member.id}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="lg"
            onClick={() => navigate(`/groups/${groupId}/media`)}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Media, Links, and Docs
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="lg">
            <LogOut className="h-4 w-4 mr-2" />
            Exit Group
          </Button>
          {isAdmin && (
            <Button variant="outline" className="w-full justify-start text-destructive" size="lg">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Group
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfo;
