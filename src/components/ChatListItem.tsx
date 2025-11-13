import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Chat } from "@/types";

interface ChatListItemProps {
  chat: Chat;
  onClick: () => void;
  isActive?: boolean;
}

const ChatListItem = ({ chat, onClick, isActive }: ChatListItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors border-b border-border",
        isActive && "bg-accent"
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={chat.user.avatar} alt={chat.user.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {chat.user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {chat.user.isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm truncate">{chat.user.name}</h3>
          {chat.lastMessage && (
            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {format(new Date(chat.lastMessage.timestamp), "HH:mm")}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate">
            {chat.lastMessage?.content || "No messages yet"}
          </p>
          {chat.unreadCount > 0 && (
            <Badge className="ml-2 shrink-0 bg-primary text-primary-foreground">
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
