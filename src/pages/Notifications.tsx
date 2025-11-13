import { MessageSquare, UserPlus, Users, Calendar as CalendarIcon, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockNotifications = [
  {
    id: "1",
    type: "message",
    title: "New message from John Doe",
    message: "Hey! How are you doing?",
    isRead: false,
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    type: "friend_request",
    title: "Friend request from Jane Smith",
    message: "Jane wants to connect with you",
    isRead: false,
    timestamp: "1 hour ago",
  },
  {
    id: "3",
    type: "group_invite",
    title: "Invited to Team Alpha",
    message: "You've been added to Team Alpha group",
    isRead: true,
    timestamp: "3 hours ago",
  },
  {
    id: "4",
    type: "event",
    title: "Upcoming meeting reminder",
    message: "Team meeting starts in 30 minutes",
    isRead: true,
    timestamp: "5 hours ago",
  },
];

const Notifications = () => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5" />;
      case "friend_request":
        return <UserPlus className="h-5 w-5" />;
      case "group_invite":
        return <Users className="h-5 w-5" />;
      case "event":
        return <CalendarIcon className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card pr-4 pl-16 py-4 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>
            )}
          </div>
          <Button variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-accent ${
              !notification.isRead ? "bg-accent/50" : ""
            }`}
          >
            <div className="flex gap-3">
              <div className="shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getNotificationIcon(notification.type)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {notification.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              </div>

              {!notification.isRead && (
                <div className="shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
