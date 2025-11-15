import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chatApi, type GroupAttachment } from "@/services/chat_apis";
import { useToast } from "@/hooks/use-toast";

const mediaFileExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);

const GroupMedia = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { toast } = useToast();

  const [attachments, setAttachments] = useState<GroupAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadAttachments = async () => {
      if (!groupId) return;

      setIsLoading(true);
      try {
        const data = await chatApi.getGroupAttachments(groupId);
        setAttachments(data);
      } catch (error: any) {
        console.error("Failed to load group attachments", error);
        const message =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load group files.";
        toast({
          title: "Failed to load files",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAttachments();
  }, [groupId, toast]);

  const { mediaItems, fileItems } = useMemo(() => {
    const media: GroupAttachment[] = [];
    const files: GroupAttachment[] = [];

    attachments.forEach((attachment) => {
      const extension = attachment.fileType.toLowerCase();
      if (mediaFileExtensions.has(extension)) {
        media.push(attachment);
      } else {
        files.push(attachment);
      }
    });

    return { mediaItems: media, fileItems: files };
  }, [attachments]);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-4 bg-card pr-4 pl-16 py-4 md:p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Media, Links, and Docs</h2>
        </div>
      </div>

      <Tabs defaultValue="media" className="p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading media…</p>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No media files shared yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.map((item) => (
                <a
                  key={item.id}
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="mt-4 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading files…</p>
          ) : fileItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No documents shared yet.</p>
            </div>
          ) : (
            fileItems.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Shared {new Date(file.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  asChild
                >
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" title="Download file">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="links" className="mt-4 space-y-2">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <LinkIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              Links shared in the chat will appear here once link parsing is implemented.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupMedia;
