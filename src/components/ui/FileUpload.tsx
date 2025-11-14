import { useEffect, useState } from "react";
import { Upload, Trash2, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/services/api";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const BASE_URL = "/files"; // your FastAPI file route prefix

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const response = await api.get(`${BASE_URL}/list`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  // Upload files to backend
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    try {
      await api.post(`${BASE_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFiles([]);
      fetchFiles(); // refresh file list
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // Delete a file
  const handleDelete = async (fileName) => {
    try {
      await api.delete(`${BASE_URL}/delete/${fileName}`);
      fetchFiles();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Categorize files
  const images = files.filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f.name));
  const documents = files.filter((f) => /\.(pdf|doc|docx|txt)$/i.test(f.name));

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input type="file" multiple onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={selectedFiles.length === 0}>
          <Upload size={16} /> Upload
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <div className="p-4 border rounded">
          {/* All Files */}
          {files.length === 0 && <p>No files uploaded yet.</p>}
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {/\.(jpg|jpeg|png|gif)$/i.test(file.name) ? <ImageIcon /> : <FileText />}
                <span>{file.name}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleDelete(file.name)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Images Tab */}
        <div className="p-4 border rounded">
          {images.length === 0 && <p>No images uploaded yet.</p>}
          {images.map((file) => (
            <div key={file.id} className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ImageIcon /> <span>{file.name}</span>
              </div>
              <Button size="sm" onClick={() => handleDelete(file.name)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>

        {/* Documents Tab */}
        <div className="p-4 border rounded">
          {documents.length === 0 && <p>No documents uploaded yet.</p>}
          {documents.map((file) => (
            <div key={file.id} className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText /> <span>{file.name}</span>
              </div>
              <Button size="sm" onClick={() => handleDelete(file.name)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default FileUpload;
