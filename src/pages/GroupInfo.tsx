import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserPlus, UserMinus, Crown, LogOut, Trash2, Image as ImageIcon } from "lucide-react";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { groupApi } from "@/services/group_apis";
import type { Group } from "@/types";

import { useAuth } from "@/context/AuthContext";
import { friendsService } from "@/services/friends";

const GroupInfo = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { toast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [availableFriends, setAvailableFriends] = useState<Array<{ id: string; name: string; email: string; isOnline: boolean }>>([]);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const { user } = useAuth();
  const currentUserId = user?.id;

  useEffect(() => {
    if (groupId && currentUserId) {
      fetchGroupDetails();
    }
  }, [groupId, currentUserId]);

  // Load friends list for adding members
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsList = await friendsService.getFriendList();
        const mapped = friendsList
          .filter((f) => f.id && f.name && f.email)
          .map((f) => ({
            id: f.id!,
            name: f.name!,
            email: f.email!,
            isOnline: false, // Friends service doesn't provide online status
          }));
        setAvailableFriends(mapped);
      } catch (error) {
        console.error("Error loading friends:", error);
      }
    };

    loadFriends();
  }, []);

  const fetchGroupDetails = async () => {
    if (!groupId || !currentUserId) return;

    setIsLoading(true);
    try {
      console.log("Fetching group details for:", { userId: currentUserId, groupId });
      const response = await groupApi.getGroupDetails(currentUserId, groupId);
      console.log("Group details response:", response);

      setGroup(response);
    } catch (error: any) {
      console.error("Error fetching group details:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          "An error occurred while loading the group.";
      
      toast({
        title: "Failed to load group",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !currentUserId) return;

    setIsLeavingGroup(true);
    try {
      await groupApi.leaveGroup({ user_id: currentUserId, group_id: groupId });

      toast({
        title: "Left group",
        description: "You have left the group.",
      });

      navigate(-1);
    } catch (error: any) {
      console.error("Error leaving group:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (Array.isArray(error.response?.data) ? error.response?.data.join(", ") : JSON.stringify(error.response?.data)) ||
        error.message ||
        "An error occurred while leaving the group.";

      toast({
        title: "Failed to leave group",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId || !currentUserId || !group) return;

    setIsDeletingGroup(true);
    try {
      await groupApi.deleteGroup({
        group_id: groupId,
        requested_by: user?.email ?? "",
        reason: `Deleted by owner ${user?.name || ""}`,
      });

      toast({
        title: "Group deleted",
        description: `${group.name} has been deleted.`,
      });

      navigate(-1);
    } catch (error: any) {
      console.error("Error deleting group:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (Array.isArray(error.response?.data) ? error.response?.data.join(", ") : JSON.stringify(error.response?.data)) ||
        error.message ||
        "An error occurred while deleting the group.";

      toast({
        title: "Failed to delete group",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeletingGroup(false);
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
      const requestPayload = {
        user_id: currentUserId,
        group_id: groupId,
        'user_ids to add': selectedFriendIds,
      };

      console.log("Adding members with payload:", requestPayload);
      const response = await groupApi.addMembers(requestPayload);
      console.log("Add members response:", response);

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
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          (Array.isArray(error.response?.data) ? error.response?.data.join(", ") : JSON.stringify(error.response?.data)) ||
                          error.message || 
                          "An error occurred while adding members.";
      
      toast({
        title: "Failed to add members",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberIdToRemove: string) => {
    if (!groupId || !currentUserId) return;

    // Prevent removing yourself if you're the only admin
    if (
      group &&
      memberIdToRemove === currentUserId &&
      group.adminIds.length === 1 &&
      group.adminIds[0] === currentUserId
    ) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove yourself as you are the only admin. Please promote another member to admin first.",
        variant: "destructive",
      });
      return;
    }

    setIsRemovingMember(memberIdToRemove);
    try {
      const requestPayload = {
        user_id: currentUserId,
        group_id: groupId,
        'user_id to remove': memberIdToRemove,
      };

      console.log("Removing member with payload:", requestPayload);
      const response = await groupApi.removeMember(requestPayload);
      console.log("Remove member response:", response);

      toast({
        title: "Member removed",
        description: "The member has been removed from the group.",
      });

      // Refresh group details
      await fetchGroupDetails();
    } catch (error: any) {
      console.error("Error removing member:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          (Array.isArray(error.response?.data) ? error.response?.data.join(", ") : JSON.stringify(error.response?.data)) ||
                          error.message || 
                          "An error occurred while removing the member.";
      
      toast({
        title: "Failed to remove member",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRemovingMember(null);
    }
  };

  const handleUpdateMemberRole = async (targetUserId: string, newRole: string) => {
    if (!groupId || !currentUserId || !group) return;

    if (group.ownerId !== currentUserId) {
      toast({
        title: "Only owners can change roles",
        description: "Ask the group owner to update member permissions.",
        variant: "destructive",
      });
      return;
    }

    const currentMember = group.members.find((m) => m.userId === targetUserId);
    if (!currentMember || currentMember.role === newRole) return;

    const previousRole = currentMember.role ?? "member";

    // Optimistic update
    setGroup((prev) => {
      if (!prev) return prev;
      const isBecomingAdmin = newRole === "admin";
      const nextMembers = prev.members.map((member) =>
        member.userId === targetUserId ? { ...member, role: newRole } : member
      );
      const prevAdminIds = Array.isArray(prev.adminIds) ? prev.adminIds : [];
      const wasAdmin = prevAdminIds.includes(targetUserId);
      const nextAdminIds = isBecomingAdmin
        ? wasAdmin
          ? prevAdminIds
          : [...prevAdminIds, targetUserId]
        : prevAdminIds.filter((id) => id !== targetUserId);

      return {
        ...prev,
        members: nextMembers,
        adminIds: nextAdminIds,
      };
    });

    setIsUpdatingRole(targetUserId);
    try {
      const requestPayload = {
        user_id: currentUserId,
        group_id: groupId,
        target_user_id: targetUserId,
        role: newRole,
      };

      console.log("Updating member role with payload:", requestPayload);
      const response = await groupApi.updateMemberRole(requestPayload);
      console.log("Update member role response:", response);

      toast({
        title: "Role updated",
        description: `Member role has been updated to ${newRole}.`,
      });

      // Ensure data is fully in sync with backend
      await fetchGroupDetails();
    } catch (error: any) {
      console.error("Error updating member role:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Rollback optimistic update
      setGroup((prev) => {
        if (!prev) return prev;
        const shouldBeAdmin = previousRole === "admin";
        const prevAdminIds = Array.isArray(prev.adminIds) ? prev.adminIds : [];
        const hasAdmin = prevAdminIds.includes(targetUserId);
        const nextAdminIds = shouldBeAdmin
          ? hasAdmin
            ? prevAdminIds
            : [...prevAdminIds, targetUserId]
          : prevAdminIds.filter((id) => id !== targetUserId);

        return {
          ...prev,
          members: prev.members.map((member) =>
            member.userId === targetUserId ? { ...member, role: previousRole } : member
          ),
          adminIds: nextAdminIds,
        };
      });

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (Array.isArray(error.response?.data)
          ? error.response?.data.join(", ")
          : JSON.stringify(error.response?.data)) ||
        error.message ||
        "An error occurred while updating the member role.";

      toast({
        title: "Failed to update role",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const filteredFriends = availableFriends
    .filter((friend) => {
      const query = friendQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        friend.name.toLowerCase().includes(query) ||
        friend.email.toLowerCase().includes(query)
      );
    })
    .filter((friend) => {
      // Filter out members who are already in the group
      return !(group?.members?.some((member) => member.userId === friend.id));
    });

  const isOwner = !!(group && currentUserId && group.ownerId === currentUserId);
  const canManageMembers = !!(currentUserId && group?.adminIds?.includes(currentUserId));

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
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Members ({group.members.length})</h3>
            {canManageMembers && (
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
                        <p className="p-4 text-sm text-muted-foreground">
                          No friends found or all friends are already members.
                        </p>
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
            {group.members.map((member) => {
              const roleLabel =
                member.userId === group.ownerId
                  ? "Owner"
                  : member.role === "admin"
                  ? "Admin"
                  : null;
              const showRoleSelect =
                isOwner &&
                member.userId !== group.ownerId &&
                member.userId !== currentUserId;
              const canRemoveMember =
                canManageMembers &&
                member.userId !== group.ownerId &&
                member.userId !== currentUserId;
              const selectValue = member.role === "admin" ? "admin" : "member";

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar || undefined} alt={member.name} />
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
                        {roleLabel && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            {roleLabel}
                          </Badge>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                  </div>

                  {(showRoleSelect || canRemoveMember) && (
                    <div className="flex items-center gap-1">
                      {showRoleSelect && (
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          value={selectValue}
                          onChange={(e) => handleUpdateMemberRole(member.userId, e.target.value)}
                          disabled={isUpdatingRole === member.userId}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                      {canRemoveMember && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={isRemovingMember === member.userId}
                          title="Remove member"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="lg"
            onClick={() => navigate(`/app/groups/${groupId}/media`)}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Media, Links, and Docs
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <LogOut className="h-4 w-4 mr-2" />
                Exit Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave group?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose access to the conversations and media shared in this group.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveGroup} disabled={isLeavingGroup}>
                  {isLeavingGroup ? "Leaving..." : "Leave group"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-destructive" size="lg">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete group?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the group for all members. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup} disabled={isDeletingGroup}>
                    {isDeletingGroup ? "Deleting..." : "Delete group"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfo;
