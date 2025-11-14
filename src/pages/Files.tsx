import { useEffect, useState } from "react";
import {
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Actual file type
interface FileItem {
  name: string;
  size: string;
  type: string;
  date: string;
}

const Files = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "images" | "documents">("all");

  // FETCH FILES FROM BACKEND
  const loadFiles = async () => {
    try {
      const res = await fetch("http://localhost:8000/file_url/list");
      const data = await res.json();
      if (data?.files) {
        setFiles(
          data.files.map((f: any) => ({
            name: f.filename,
            type: f.type,
            size: f.size,
            date: f.date,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading files:", err);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // ICONS FOR FILE TYPE
  const getFileIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="h-8 w-8 text-primary" />;
    if (["pdf", "document", "spreadsheet"].includes(type))
      return <FileText className="h-8 w-8 text-primary" />;
    return <FileIcon className="h-8 w-8 text-primary" />;
  };

  // FILTER + SEARCH
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "images" && file.type === "image") ||
      (filter === "documents" && ["pdf", "document", "spreadsheet"].includes(file.type));

    return matchesSearch && matchesFilter;
  });

  // UPLOAD FILE
  const handleUpload = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";

    fileInput.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8000/file_url/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("Uploaded:", data);

        if (response.ok) {
          alert("File uploaded successfully!");
          loadFiles(); // reload file list
        } else {
          alert("Upload failed: " + data.detail);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file.");
      }
    });

    fileInput.click();
  };

  // DOWNLOAD FILE
  const handleDownload = (filename: string) => {
    window.open(`http://localhost:8000/file_url/download/${filename}`, "_blank");
  };

  // DELETE FILE
  const handleDelete = async (filename: string) => {
    if (!confirm("Do you want to delete this file?")) return;

    try {
      const res = await fetch(`http://localhost:8000/file_url/delete/${filename}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        alert("File deleted successfully!");
        loadFiles();
      } else {
        alert("Delete failed: " + data.detail);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      
      {/* HEADER SECTION */}
      <div className="border-b border-border bg-card pr-4 pl-16 py-4 md:p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Files</h2>
          <Button onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" /> Upload File
          </Button>
        </div>

        {/* SEARCH + FILTERS */}
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

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="images" className="flex-1">Images</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* FILE GRID */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFiles.length === 0 ? (
          <p className="text-center text-muted-foreground pt-5">No files found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-card border border-border hover:border-primary transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  {getFileIcon(file.type)}

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => handleDownload(file.name)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(file.name)}>
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
        )}
      </div>

    </div>
  );
};

export default Files;
