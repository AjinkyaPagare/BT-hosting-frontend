import { Camera, Edit, Mail, AtSign, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getProfile, updateProfile, type Profile as ProfileType, type ProfileUpdatePayload } from "@/services/profile";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ProfileUpdatePayload>({
    name: "",
    email: "",
    bio: "",
    avatar_url: "",
  });

  const {
    data: profile,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (profile) {
      setFormState({
        name: profile.name ?? "",
        email: profile.email ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (data: ProfileType) => {
      queryClient.setQueryData(["profile"], data);
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });
      setIsEditing(false);
      await refreshUser();
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const avatarFallback = useMemo(() => {
    const source = formState.name || user?.name || "User";
    return source.trim().slice(0, 2).toUpperCase();
  }, [formState.name, user?.name]);

  const handleChange = (field: keyof ProfileUpdatePayload) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    mutation.mutate(formState);
  };

  const isBusy = isAuthLoading || isLoading || isFetching;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-card pr-4 pl-16 py-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Profile</h2>
            {isBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isBusy || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            {isEditing ? "Save changes" : "Edit profile"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <Avatar className="h-32 w-32">
              <AvatarImage src={formState.avatar_url ?? undefined} alt={formState.name || "Profile avatar"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-8 w-8 text-white" />
                <input
                  type="url"
                  className="hidden"
                  value={formState.avatar_url ?? ""}
                  onChange={handleChange("avatar_url")}
                />
              </label>
            )}
          </div>
          {isEditing && (
            <p className="text-sm text-muted-foreground mt-2">Provide an image URL to update your avatar.</p>
          )}
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <AtSign className="h-4 w-4" />
              Name
            </Label>
            <Input
              id="name"
              value={formState.name}
              onChange={handleChange("name")}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={handleChange("email")}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formState.bio ?? ""}
              onChange={handleChange("bio")}
              disabled={!isEditing}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
