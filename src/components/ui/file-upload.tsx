import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { uploadsService } from '@/api/services/uploads.service';

interface FileUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value = [],
  onChange,
  maxFiles = 10,
  accept = 'image/*',
  label = 'Upload Files',
  required = false,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    if (previews.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await uploadsService.uploadMultiple(files);
      const newPreviews = [...previews, ...uploadedUrls];
      setPreviews(newPreviews);
      onChange(newPreviews);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (index: number) => {
    try {
      const urlToRemove = previews[index];
      const filename = uploadsService.extractFilename(urlToRemove);
      
      // Delete from server
      await uploadsService.deleteFile(filename);
      
      // Update state
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
      onChange(newPreviews);
      
      toast.success('File removed successfully');
    } catch (error) {
      toast.error('Failed to remove file');
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="space-y-4">
        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {previews.length < maxFiles && (
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple
              onChange={handleFileSelect}
              disabled={uploading || disabled}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload">
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {previews.length}/{maxFiles} files
                    </p>
                  </div>
                )}
              </div>
            </Label>
          </div>
        )}
      </div>
    </div>
  );
};
