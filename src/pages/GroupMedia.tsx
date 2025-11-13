import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GroupMedia = () => {
  const navigate = useNavigate();

  const mediaItems = Array.from({ length: 12 }, (_, i) => ({
    id: `media-${i}`,
    type: "image",
    url: "",
    name: `image${i + 1}.jpg`,
  }));

  const fileItems = [
    { id: "file1", name: "Project-Proposal.pdf", size: "2.5 MB", date: "Jan 15, 2024" },
    { id: "file2", name: "Meeting-Notes.docx", size: "1.2 MB", date: "Jan 14, 2024" },
    { id: "file3", name: "Budget-2024.xlsx", size: "890 KB", date: "Jan 13, 2024" },
  ];

  const linkItems = [
    { id: "link1", url: "https://example.com", title: "Example Website", date: "Jan 15, 2024" },
    { id: "link2", url: "https://github.com", title: "GitHub Repository", date: "Jan 14, 2024" },
    { id: "link3", url: "https://docs.example.com", title: "Documentation", date: "Jan 13, 2024" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-4 p-4">
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
          <div className="grid grid-cols-3 gap-2">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="aspect-square rounded-lg bg-muted cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-4 space-y-2">
          {fileItems.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.size} • {file.date}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="links" className="mt-4 space-y-2">
          {linkItems.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
            >
              <LinkIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{link.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {link.url} • {link.date}
                </p>
              </div>
            </a>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupMedia;
