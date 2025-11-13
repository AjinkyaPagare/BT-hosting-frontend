import { Bell, Lock, Eye, Ban, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-6 border-b border-border bg-card">
        <h2 className="text-2xl font-bold">Settings</h2>
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
              <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
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
                <Label>Message Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified for new messages</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Friend Requests</Label>
                <p className="text-sm text-muted-foreground">Get notified for friend requests</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Group Invites</Label>
                <p className="text-sm text-muted-foreground">Get notified for group invitations</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Event Reminders</Label>
                <p className="text-sm text-muted-foreground">Get notified for upcoming events</p>
              </div>
              <Switch defaultChecked />
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
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Read Receipts</Label>
                <p className="text-sm text-muted-foreground">Let others see when you've read messages</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <Separator />

        {/* Blocked Users */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            <Ban className="h-5 w-5 inline mr-2" />
            Blocked Users
          </h3>
          <Button variant="outline" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Blocked Users
          </Button>
        </div>

        <Separator />

        {/* Account Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Account</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive">
              Delete Account
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
