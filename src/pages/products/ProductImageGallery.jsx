import { useState, useRef } from "react";
import { Trash2, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { uploadProductImage, addProductImage, deleteProductImage, setImageAsPrimary, reorderProductImages } from "../../lib/products.js";
import { toast } from "react-toastify";
import "./AdminPages.css";

export default function ProductImageGallery({ productId, images = [], onImagesChange }) {
  const [localImages, setLocalImages] = useState(images);
  const [uploading, setUploading] = useState(false);
  const [draggedOver, setDraggedOver] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    if (!files.length) return;

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      try {
        const uploadResult = await uploadProductImage(file, `product-${productId}-${Date.now()}`);
        if (uploadResult.success) {
          const addResult = await addProductImage(
            productId,
            uploadResult.url,
            localImages.length === 0
          );
          if (addResult.success) {
            setLocalImages(prev => [...prev, {
              id: addResult.imageId,
              image_url: uploadResult.url,
              is_primary: localImages.length === 0,
              display_order: localImages.length,
            }]);
            successCount++;
          }
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`✓ ${successCount} image(s) uploaded`);
      onImagesChange?.(localImages);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm("Delete this image?")) return;

    const success = await deleteProductImage(imageId);
    if (success) {
      setLocalImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("✓ Image deleted");
      onImagesChange?.(localImages.filter(img => img.id !== imageId));
    }
  };

  const handleSetPrimary = async (imageId, imageUrl) => {
    const success = await setImageAsPrimary(productId, imageId);
    if (success) {
      setLocalImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      })));
      toast.success("✓ Primary image set");
      onImagesChange?.(localImages);
    }
  };

  const handleDragStart = (imageId) => {
    setDraggedImageId(imageId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDraggedOver(true);
  };

  const handleDragLeave = () => {
    setDraggedOver(false);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    setDraggedOver(false);

    if (draggedImageId === targetId) return;

    const draggedIndex = localImages.findIndex(img => img.id === draggedImageId);
    const targetIndex = localImages.findIndex(img => img.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newImages = [...localImages];
    [newImages[draggedIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[draggedIndex]];

    const reordered = newImages.map((img, idx) => ({
      ...img,
      display_order: idx,
    }));

    setLocalImages(reordered);
    setDraggedImageId(null);

    const imageIds = reordered.map(img => img.id);
    await reorderProductImages(productId, imageIds);
    toast.success("✓ Images reordered");
    onImagesChange?.(reordered);
  };

  return (
    <div className="pga-container">
      <h4 className="pga-title">Product Images (Drag to reorder)</h4>

      {}
      <div
        className={`pga-upload-zone ${draggedOver ? "dragged-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          setDraggedOver(false);
          handleFileSelect(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image
}
}
      <div className="pga-gallery">
        {localImages.map((image) => (
          <div
            key={image.id}
            className={`pga-image-card ${image.is_primary ? "primary" : ""}`}
            draggable
            onDragStart={() => handleDragStart(image.id)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, image.id)}
          >
            <img src={image.image_url} alt="Product" className="pga-image" />

            {}
            {image.is_primary && (
              <div className="pga-primary-badge">
                <Star size={14} fill="currentColor" /> Primary
              </div>
            )}

            {}
            <div className="pga-actions">
              {!image.is_primary && (
                <button
                  className="pga-btn pga-btn-primary"
                  onClick={() => handleSetPrimary(image.id, image.image_url)}
                  title="Set as primary image"
                >
                  <Star size={16} />
                </button>
              )}
              <button
                className="pga-btn pga-btn-delete"
                onClick={() => handleDelete(image.id)}
                title="Delete image"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {}
            <div className="pga-drag-hint">⋮⋮</div>
          </div>
        ))}
      </div>

      {}
      <p className="pga-count">{localImages.length} image(s)</p>
    </div>
  );
}
