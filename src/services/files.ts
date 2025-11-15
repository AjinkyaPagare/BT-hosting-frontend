import api from "./api";
 
export interface UploadResponse {
  filename: string;
  path: string;
  message: string;
  status: string;
}
 
const baseUrl = (api.defaults as any)?.baseURL || "";
 
const buildViewUrl = (storedFileName: string) => {
  const name = storedFileName.replace(/^.*[\\\/]/, "");
  return baseUrl ? `${baseUrl}/file_url/view/${name}` : `/file_url/view/${name}`;
};
 
export const filesService = {
  upload: async (file: File) => {
    const form = new FormData();
    form.append("file", file, file.name);
 
    const { data } = await api.post<UploadResponse>("/file_url/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
 
    const storedFileName = (data.path || data.filename || file.name).replace(/^.*[\\\/]/, "");
 
    return {
      originalFilename: data.filename || file.name,
      storedFilename: storedFileName,
      path: data.path,
      contentType: file.type,
      viewUrl: buildViewUrl(storedFileName),
      raw: data,
    };
  },
 
  viewUrl: (storedFileName: string) => buildViewUrl(storedFileName),
 
  delete: async (storedFileName: string) => {
    const name = storedFileName.replace(/^.*[\\\/]/, "");
    const { data } = await api.delete<{ message: string; filename: string; status: string }>(
      `/file_url/delete/${encodeURIComponent(name)}`
    );
    return data;
  },
};
 
 