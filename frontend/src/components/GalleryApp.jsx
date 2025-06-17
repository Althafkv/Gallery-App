import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  ImageIcon,
  Trash2,
  Eye,
  AlertCircle,
  Download,
} from "lucide-react";

const GalleryApp = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = "http://localhost:5000/api";

  // Fetch images on component mount
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/images`);
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      setImages(data);
    } catch (err) {
      setError(
        "Failed to load images. Make sure the backend server is running."
      );
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          formData.append("images", file);
        }
      });

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      const result = await response.json();

      // Refresh the image list
      await fetchImages();
    } catch (err) {
      setError("Failed to upload images. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const deleteImage = async (id) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/images/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Remove from local state
      setImages((prev) => prev.filter((img) => img._id !== id));

      // Close modal if deleted image was selected
      if (selectedImage && selectedImage._id === id) {
        setSelectedImage(null);
      }
    } catch (err) {
      setError("Failed to delete image. Please try again.");
      console.error("Delete error:", err);
    }
  };

  const downloadImage = async (image) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/download/${image._id}`);

      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download image. Please try again.");
      console.error("Download error:", err);
    }
  };

  const openModal = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Gallery App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchImages}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                Refresh
              </button>
              <div className="text-sm text-gray-300">
                {images.length} {images.length === 1 ? "image" : "images"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
          >
            <div className="bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-pink-400/50 hover:bg-white/10 transition-all duration-300">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isUploading ? "Uploading..." : "Upload Images"}
                  </h3>
                  <p className="text-gray-400">
                    Drag and drop or click to select images
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports JPG, PNG, GIF, WebP (Max 10MB each)
                  </p>
                </div>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No images yet
            </h3>
            <p className="text-gray-400">
              Upload your first image to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {images.map((image) => (
              <div
                key={image._id}
                className="group relative bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzExNi41NjkgMTMwIDEzMCAxMTYuNTY5IDEzMCAxMDBDMTMwIDgzLjQzMTUgMTE2LjU2OSA3MCAxMDAgNzBDODMuNDMxNSA3MCA3MCA4My40MzE1IDcwIDEwMEM3MCAxMTYuNTY5IDgzLjQzMTUgMTMwIDEwMCAxMzBaIiBmaWxsPSIjNjM2NTczIi8+CjxwYXRoIGQ9Ik0xNDAgNTBINjBDNTQuNDc3MiA1MCA1MCA1NC40NzcyIDUwIDYwVjE0MEM1MCAxNDUuNTIzIDU0LjQ3NzIgMTUwIDYwIDE1MEgxNDBDMTQ1LjUyMyAxNTAgMTUwIDE0NS41MjMgMTUwIDE0MFY2MEMxNTAgNTQuNDc3MiAxNDUuNTIzIDUwIDE0MCA1MFoiIHN0cm9rZT0iIzYzNjU3MyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjwvZz4KPC9zdmc+";
                    }}
                  />
                </div>

                {/* Overlay */}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openModal(image)}
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
                      title="View Image"
                    >
                      <Eye className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => downloadImage(image)}
                      className="w-10 h-10 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-green-500 transition-colors cursor-pointer"
                      title="Download Image"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => deleteImage(image._id)}
                      className="w-10 h-10 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
                      title="Delete Image"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-3 bg-black/20">
                  <p className="text-white text-sm font-medium truncate">
                    {image.originalName}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                    <span>{formatFileSize(image.size)}</span>
                    <span>{formatDate(image.uploadDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full mt-15">
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-10 cursor-pointer"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.originalName}
                className="max-w-full max-h-[70vh] object-contain"
              />
              <div className="p-6 bg-black/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {selectedImage.originalName}
                  </h3>
                  <button
                    onClick={() => downloadImage(selectedImage)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-medium">
                      Download
                    </span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <span className="text-gray-300">Size:</span>{" "}
                    {formatFileSize(selectedImage.size)}
                  </div>
                  <div>
                    <span className="text-gray-300">Type:</span>{" "}
                    {selectedImage.mimetype}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-300">Uploaded:</span>{" "}
                    {formatDate(selectedImage.uploadDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryApp;
