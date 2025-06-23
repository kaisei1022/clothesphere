
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';

interface ImageUploaderProps {
  onImageUpload: (base64Image: string | null) => void;
  currentImage?: string | null;
  id?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, currentImage, id = "image-upload" }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((file: File | null) => {
    setError(null);
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("ファイルサイズが大きすぎます。最大5MBです。");
        setPreviewUrl(currentImage || null);
        onImageUpload(currentImage || null);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setError("無効なファイルタイプです。JPG, PNG, GIF, WEBP形式の画像をアップロードしてください。");
        setPreviewUrl(currentImage || null);
        onImageUpload(currentImage || null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        onImageUpload(base64String);
      };
      reader.onerror = () => {
        setError("ファイルの読み込みに失敗しました。");
        onImageUpload(null);
      }
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
      onImageUpload(null);
    }
  }, [onImageUpload, currentImage]);

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
  };

  const onDrop = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [handleFileChange]);

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onImageUpload(null);
    const fileInput = document.getElementById(id) as HTMLInputElement;
    if (fileInput) fileInput.value = ""; // Clear the file input
  };


  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 cursor-pointer border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-primary transition-colors"
        onDrop={onDrop}
        onDragOver={onDragOver}
        aria-label="画像アップローダー"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="プレビュー" className="mx-auto h-32 w-auto object-contain rounded-md" />
        ) : (
          <div className="space-y-1">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-gray-500">ドラッグ＆ドロップまたは<span className="text-primary font-semibold">クリックしてアップロード</span></p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP 最大5MB</p>
          </div>
        )}
      </label>
      <input id={id} name="image" type="file" className="sr-only" onChange={onFileInputChange} accept="image/png, image/jpeg, image/gif, image/webp" />
      {previewUrl && (
         <button 
         type="button" 
         onClick={removeImage} 
         className="text-xs text-accent hover:text-red-700 transition-colors"
       >
         画像を削除
       </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ImageUploader;