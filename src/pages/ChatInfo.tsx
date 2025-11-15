import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, FileText, Link as LinkIcon, Trash2, Ban, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { fetchUserById, type PublicUserProfile } from "@/services/user";
 
const ChatInfo = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!chatId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserById(chatId);
        if (active) setProfile(data);
      } catch (e: any) {
        if (active) setError(e?.response?.data?.detail || e?.message || "Failed to load user");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [chatId]);
 
  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center gap-4 bg-card pr-4 pl-16 py-4 md:p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Chat Info</h2>
          </div>
        </div>
        <div className="p-6 bg-card border-b border-border">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 bg-muted rounded-full" />
            <div>
              <h2 className="text-2xl font-bold">Loading...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center gap-4 bg-card pr-4 pl-16 py-4 md:p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Chat Info</h2>
          </div>
        </div>
        <div className="p-6 bg-card border-b border-border">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 bg-muted rounded-full" />
            <div>
              <h2 className="text-2xl font-bold">Error</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  if (!profile) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center gap-4 bg-card pr-4 pl-16 py-4 md:p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Chat Info</h2>
          </div>
        </div>
        <div className="p-6 bg-card border-b border-border">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 bg-muted rounded-full" />
            <div>
              <h2 className="text-2xl font-bold">User not found</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }
 
  // Derive display fields from fetched profile
  const displayName = profile?.name || "User";
  const displayEmail = profile?.email || "";
  const displayAvatar = profile?.avatar || "";
  const isOnline = (profile?.status || "offline") === "online";
  const media: { id: string }[] = [];
  const files: { id: string; name: string; size: string }[] = [];
  const links: { id: string; url: string; title: string }[] = [];
 
  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-4 bg-card pr-4 pl-16 py-4 md:p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Chat Info</h2>
        </div>
      </div>
 
      {/* User Info */}
      <div className="p-6 bg-card border-b border-border">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {(displayName || displayEmail || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
 
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{displayEmail}</span>
          </div>
        </div>
      </div>
 
      {/* Media, Links, and Docs */}
      <div className="p-4 space-y-6">
        {/* Media */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Media</h3>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="aspect-square rounded-lg bg-muted cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </div>
        </div>
 
        <Separator />
 
        {/* Files */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Files</h3>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        <Separator />
 
        {/* Links */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Links</h3>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-2">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
              >
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{link.title}</p>
                  <p className="text-xs text-muted-foreground">{link.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
 
        <Separator />
 
        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Ban className="h-4 w-4 mr-2" />
            Block User
          </Button>
          <Button variant="outline" className="w-full justify-start text-destructive" size="lg">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report User
          </Button>
        </div>
      </div>
    </div>
  );
};
 
export default ChatInfo;
 
 