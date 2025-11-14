import { Bell, Lock, Ban, Moon, Sun, Loader2, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/context/ThemeContext";
import {
  getGeneralSettings,
  updateGeneralSettings,
  getNotificationSettings,
  updateNotificationSettings,
  type GeneralSettings,
  type GeneralSettingsUpdatePayload,
  type NotificationSettings,
  type NotificationSettingsUpdatePayload,
} from "@/services/settings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { friendsService } from "@/services/friends";
import type { BlockedUser } from "@/types";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const isDarkMode = theme === "dark";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingGeneral, setPendingGeneral] = useState<GeneralSettingsUpdatePayload>({});
  const [pendingNotifications, setPendingNotifications] = useState<NotificationSettingsUpdatePayload>({});
  const [isLogoutPending, setIsLogoutPending] = useState(false);
  const [selectedBlockedUser, setSelectedBlockedUser] = useState<string | null>(null);

  const {
    data: generalSettings,
    isLoading: isGeneralLoading,
    isFetching: isGeneralFetching,
  } = useQuery({
    queryKey: ["settings", "general"],
    queryFn: getGeneralSettings,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: notificationSettings,
    isLoading: isNotificationLoading,
    isFetching: isNotificationFetching,
  } = useQuery({
    queryKey: ["settings", "notifications"],
    queryFn: getNotificationSettings,
    staleTime: 5 * 60 * 1000,
  });

  const generalMutation = useMutation({
    mutationFn: updateGeneralSettings,
    onSuccess: (data: GeneralSettings) => {
      queryClient.setQueryData(["settings", "general"], data);
      toast({ title: "General settings updated" });
    },
    onError: () => {
      toast({
        title: "Failed to update general settings",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const notificationMutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (data: NotificationSettings) => {
      queryClient.setQueryData(["settings", "notifications"], data);
      toast({ title: "Notification settings updated" });
    },
    onError: () => {
      toast({
        title: "Failed to update notification settings",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGeneralToggle = (field: keyof GeneralSettingsUpdatePayload, value: string) => {
    setPendingGeneral({ ...pendingGeneral, [field]: value });
    generalMutation.mutate({
      ...(generalSettings ?? {}),
      [field]: value,
    });
  };

  const handleNotificationToggle = (field: keyof NotificationSettingsUpdatePayload, value: boolean | string) => {
    setPendingNotifications({ ...pendingNotifications, [field]: value });
    notificationMutation.mutate({
      ...(notificationSettings ?? {}),
      [field]: value,
    });
  };

  const {
    data: blockedUsers = [],
    isLoading: isBlockedLoading,
    isError: isBlockedError,
  } = useQuery({
    queryKey: ["friends", "blocked"],
    queryFn: friendsService.getBlockedList,
    staleTime: 60 * 1000,
  });

  const blockedCount = blockedUsers.length;
  const selectedBlocked = useMemo<BlockedUser | null>(
    () => blockedUsers.find((user) => user.id === selectedBlockedUser) ?? null,
    [blockedUsers, selectedBlockedUser]
  );

  const isLoading =
    isGeneralLoading ||
    isGeneralFetching ||
    isNotificationLoading ||
    isNotificationFetching ||
    isBlockedLoading ||
    generalMutation.isPending ||
    notificationMutation.isPending;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="border-b border-border bg-card pr-4 pl-16 py-4 md:p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Settings</h2>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">General</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
                </div>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Date Format</Label>
                <p className="text-sm text-muted-foreground">
                  Current: {pendingGeneral.date_format ?? generalSettings?.date_format ?? "MM/DD/YYYY"}
                </p>
              </div>
              <div className="flex gap-2">
                {(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const).map((format) => (
                  <Button
                    key={format}
                    variant={(pendingGeneral.date_format ?? generalSettings?.date_format) === format ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleGeneralToggle("date_format", format)}
                    disabled={generalMutation.isPending}
                  >
                    {format}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Time Format</Label>
                <p className="text-sm text-muted-foreground">
                  Current: {(pendingGeneral.time_format ?? generalSettings?.time_format ?? "12")}h
                </p>
              </div>
              <div className="flex gap-2">
                {(["12", "24"] as const).map((format) => (
                  <Button
                    key={format}
                    variant={(pendingGeneral.time_format ?? generalSettings?.time_format) === format ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleGeneralToggle("time_format", format)}
                    disabled={generalMutation.isPending}
                  >
                    {format}-hour
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            <Bell className="h-5 w-5 inline mr-2" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified for all updates</p>
              </div>
              <Switch
                checked={pendingNotifications.notifications_enabled ?? notificationSettings?.notifications_enabled ?? true}
                onCheckedChange={(checked) => handleNotificationToggle("notifications_enabled", checked)}
                disabled={notificationMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Notification Preference</Label>
                <p className="text-sm text-muted-foreground">
                  Receive: {pendingNotifications.notification_preference ?? notificationSettings?.notification_preference ?? "all"}
                </p>
              </div>
              <div className="flex gap-2">
                {(["all", "important", "none"] as const).map((preference) => (
                  <Button
                    key={preference}
                    variant={(pendingNotifications.notification_preference ?? notificationSettings?.notification_preference) === preference ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleNotificationToggle("notification_preference", preference)}
                    disabled={notificationMutation.isPending}
                  >
                    {preference.charAt(0).toUpperCase() + preference.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Toggle notification sounds</p>
              </div>
              <Switch
                checked={pendingNotifications.sound_enabled ?? notificationSettings?.sound_enabled ?? true}
                onCheckedChange={(checked) => handleNotificationToggle("sound_enabled", checked)}
                disabled={notificationMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Message Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Current: {pendingNotifications.message_sound ?? notificationSettings?.message_sound ?? "default"}
                </p>
              </div>
              <div className="flex gap-2">
                {(["default", "custom", "none"] as const).map((sound) => (
                  <Button
                    key={sound}
                    variant={(pendingNotifications.message_sound ?? notificationSettings?.message_sound) === sound ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleNotificationToggle("message_sound", sound)}
                    disabled={notificationMutation.isPending}
                  >
                    {sound.charAt(0).toUpperCase() + sound.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Privacy Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            <Lock className="h-5 w-5 inline mr-2" />
            Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Online Status</Label>
                <p className="text-sm text-muted-foreground">Show when you're online</p>
              </div>
              <Switch defaultChecked disabled />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Read Receipts</Label>
                <p className="text-sm text-muted-foreground">Allow others to see when you've read messages</p>
              </div>
              <Switch defaultChecked disabled />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">Controls who can view your profile</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </div>
        </div>

        <Separator />

        {/* Blocked Users */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            <Ban className="h-5 w-5 inline mr-2" /> Blocked Users
          </h3>
          {isBlockedError ? (
            <p className="text-sm text-destructive">Unable to load blocked users.</p>
          ) : blockedCount === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't blocked anyone yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border">
                <div className="max-h-60 overflow-y-auto divide-y divide-border">
                  {blockedUsers.map((blocked) => (
                    <button
                      key={blocked.id}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-accent transition-colors"
                      onClick={() => setSelectedBlockedUser(blocked.id)}
                    >
                      <p className="text-sm font-medium">{blocked.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{blocked.email ?? "No email available"}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedBlocked && (
                <div className="rounded-lg border border-border p-4 bg-card">
                  <h4 className="text-sm font-semibold mb-2">Details</h4>
                  <p className="text-sm">Name: {selectedBlocked.name ?? "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    Email: {selectedBlocked.email ?? "Not provided"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Unblocking actions will be available soon.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Account Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Account</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled>
              Change Password
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive"
              onClick={async () => {
                if (isLogoutPending) {
                  return;
                }
                setIsLogoutPending(true);
                try {
                  await logout();
                } finally {
                  setIsLogoutPending(false);
                }
              }}
              disabled={isLogoutPending}
            >
              {isLogoutPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
