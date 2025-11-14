import api from "@/services/api";

const BASE_URL = "/file_url"; // backend prefix

// ---------------- LIST FILES ----------------
export const listFiles = async () => {
  const response = await api.get(`${BASE_URL}/list`);
  return response.data;
};

// ---------------- UPLOAD FILE ----------------
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`${BASE_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

// ---------------- DELETE FILE ----------------
export const deleteFile = async (fileName: string) => {
  const response = await api.delete(`${BASE_URL}/delete/${fileName}`);
  return response.data;
};

// ---------------- DOWNLOAD FILE (FIXED) ----------------
export const downloadFile = async (fileName: string) => {
  try {
    const response = await api.get(`${BASE_URL}/download/${fileName}`, {
      responseType: "blob", // IMPORTANT
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Download failed:", err);
    alert("Download failed.");
  }
};
