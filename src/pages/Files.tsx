import { useState } from "react";
import { Search, Upload, Download, Trash2, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockFiles = [
  { id: "1", name: "Project-Proposal.pdf", type: "pdf", size: "2.5 MB", date: "Jan 15, 2024" },
  { id: "2", name: "Design-Mockup.png", type: "image", size: "1.8 MB", date: "Jan 14, 2024" },
  { id: "3", name: "Meeting-Notes.docx", type: "document", size: "890 KB", date: "Jan 13, 2024" },
  { id: "4", name: "Budget-2024.xlsx", type: "spreadsheet", size: "650 KB", date: "Jan 12, 2024" },
  { id: "5", name: "Team-Photo.jpg", type: "image", size: "3.2 MB", date: "Jan 11, 2024" },
  { id: "6", name: "Report.pdf", type: "pdf", size: "1.5 MB", date: "Jan 10, 2024" },
];

const Files = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "images" | "documents">("all");

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-8 w-8 text-primary" />;
      case "pdf":
      case "document":
      case "spreadsheet":
        return <FileText className="h-8 w-8 text-primary" />;
      default:
        return <FileIcon className="h-8 w-8 text-primary" />;
    }
  };

  const filteredFiles = mockFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "images" && file.type === "image") ||
      (filter === "documents" && ["pdf", "document", "spreadsheet"].includes(file.type));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border bg-card pr-4 pl-16 py-4 md:p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Files</h2>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "images" | "documents")}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="images" className="flex-1">Images</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="p-4 rounded-lg bg-card border border-border hover:border-primary transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                {getFileIcon(file.type)}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate">{file.name}</h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{file.size}</span>
                <span>{file.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Files;
