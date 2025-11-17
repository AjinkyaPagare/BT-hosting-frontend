import { format } from "date-fns";
import {
  Check,
  CheckCheck,
  Download,
  Image,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Smile,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onUndoDelete?: (message: Message) => void;
  isEditing?: boolean;
  editingValue?: string;
  onEditingChange?: (value: string) => void;
  onConfirmEdit?: () => void;
  onCancelEdit?: () => void;
  isUpdating?: boolean;
}

const MessageBubble = ({
  message,
  isSent,
  onEdit,
  onDelete,
  onUndoDelete,
  isEditing,
  editingValue,
  onEditingChange,
  onConfirmEdit,
  onCancelEdit,
  isUpdating,
}: MessageBubbleProps) => {
  const canEdit =
    Boolean(onEdit) && message.type === "text" && !message.isPendingDelete;

  const canDelete = Boolean(onDelete);

  const showActions =
    isSent && (canEdit || canDelete) && !message.isPendingDelete;

  const showInlineEditor =
    isEditing &&
    isSent &&
    typeof editingValue === "string" &&
    onEditingChange &&
    onConfirmEdit &&
    onCancelEdit;

  const showUndoBanner =
    message.isPendingDelete && isSent && onUndoDelete;

  return (
    <div
      className={cn(
        "w-full flex mb-3 px-3",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div className="relative group max-w-[90%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]">
        {/* Action Menu */}
        {showActions && (
          <div className="absolute -top-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  aria-label="Message actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit?.(message)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit message
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(message)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete message
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-xl px-4 py-3 shadow-sm border",
            "break-words break-all whitespace-pre-wrap", // IMPORTANT FIX
            isSent
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-muted text-foreground border-border",
            message.isPendingDelete && "opacity-70"
          )}
        >
          {/* Undo Delete */}
          {showUndoBanner ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate">This message has been deleted.</span>
              <button
                className="font-semibold underline"
                onClick={() => onUndoDelete?.(message)}
              >
                Undo
              </button>
            </div>
          ) : showInlineEditor ? (
            <>
              <Textarea
                value={editingValue}
                onChange={(e) => onEditingChange?.(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />

              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2 text-muted-foreground">
                  <Button size="icon" variant="ghost">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={onCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={onConfirmEdit}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* TEXT */}
              {message.type === "text" && (
                <p className="text-sm leading-relaxed break-all whitespace-pre-wrap">
                  {message.content}
                </p>
              )}

              {/* IMAGE */}
              {message.type === "image" && message.fileUrl && (
                <div className="space-y-2">
                  <img
                    src={message.fileUrl}
                    alt="Shared"
                    className="rounded-lg w-full max-h-[350px] object-cover"
                  />
                  {message.content && (
                    <p className="text-sm break-all whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </div>
              )}

              {/* FILE */}
              {message.type === "file" && message.fileUrl && (
                <div className="flex items-center gap-3 bg-background/30 p-2 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{message.fileName}</p>
                  </div>

                  <a href={message.fileUrl} target="_blank">
                    <Button size="icon" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              )}
            </>
          )}

          {/* Time + Status */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs opacity-75">
              {format(new Date(message.timestamp), "HH:mm")}
            </span>

            {isSent && (
              <span className="text-xs opacity-75">
                {message.isRead ? (
                  <CheckCheck className="h-3 w-3 text-primary-foreground" />
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
    </div>
  );
};

export default MessageBubble;