import { format } from "date-fns";
import { Check, CheckCheck, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Button } from "./ui/button";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

const MessageBubble = ({ message, isSent }: MessageBubbleProps) => {
  return (
    <div className={cn("flex gap-2 mb-3", isSent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isSent
            ? "bg-message-sent text-message-sent-foreground rounded-br-none"
            : "bg-message-received text-message-received-foreground rounded-bl-none"
        )}
      >
        {message.type === "text" && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        
        {message.type === "image" && message.fileUrl && (
          <div className="space-y-2">
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="rounded-lg max-w-full h-auto"
            />
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        )}

        {message.type === "file" && message.fileUrl && (
          <div className="flex items-center gap-3 p-2 bg-background/20 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              {message.content && (
                <p className="text-xs text-muted-foreground mt-1">{message.content}</p>
              )}
            </div>
            <Button size="icon" variant="ghost" className="shrink-0">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">
            {format(new Date(message.timestamp), "HH:mm")}
          </span>
          {isSent && (
            <span className="text-xs opacity-70">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : message.isDelivered ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
