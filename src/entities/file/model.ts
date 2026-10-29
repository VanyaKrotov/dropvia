/** Authorized API representation. `path` is logical; relative URLs use the file server origin. */
export interface FileResource {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  publicUrl: string | null;
  downloadUrl: string;
  createdAt: string;
  modifiedAt: string;
}
