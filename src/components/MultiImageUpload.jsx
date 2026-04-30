import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import './MultiImageUpload.css';

const MAX_IMAGES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MultiImageUpload({
  value = [],
  onChange = () => {},
  maxImages = MAX_IMAGES,
  disabled = false
}) {
  const [images, setImages] = useState(value);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    setError('');
    const fileArray = Array.from(files).filter(file => {

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.`);
        return false;
      }
      return true;
    });

    if (fileArray.length === 0) return;

    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`);
      return;
    }

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          file,
          previewUrl: e.target.result
        };

        setImages(prev => {
          const updated = [...prev, newImage];
          onChange(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveImage = (id) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      onChange(updated);
      return updated;
    });
    setError('');
  };

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleClickUpload = () => {
    if (!disabled && images.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  const remainingSlots = maxImages - images.length;
  const isFull = remainingSlots === 0;

  return (
    <div className="mui-container">
      <div className="mui-header">
        <label className="mui-label">Product Images</label>
        <span className="mui-count">
          {images.length}/{maxImages}
        </span>
      </div>

      {}
      {!isFull && (
        <div
          className={`mui-upload-box ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClickUpload();
            }
          }}
        >
          <Upload className="mui-upload-icon" size={32} />
          <p className="mui-upload-text">Upload Images</p>
          <p className="mui-upload-hint">
            Drag & drop or click to select (JPG, PNG, WebP)
          </p>
          <p className="mui-upload-limit">
            {remainingSlots === 1
              ? `1 slot remaining`
              : `${remainingSlots} slots remaining`}
          </p>
        </div>
      )}

      {}
      {error && (
        <div className="mui-error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {}
      {images.length > 0 && (
        <div className="mui-grid">
          {images.map((image, index) => (
            <div key={image.id} className="mui-grid-item">
              <img
                src={image.previewUrl}
                alt={`Preview ${index + 1}`}
                className="mui-image"
              />

              <button
                type="button"
                className="mui-delete-btn"
                onClick={() => handleRemoveImage(image.id)}
                title="Remove image"
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={18} />
              </button>

              <div className="mui-image-number">{index + 1}</div>
            </div>
          ))}
        </div>
      )}

      {}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="mui-file-input"
        aria-hidden="true"
        disabled={disabled}
      />

      {}
      <p className="mui-info-text">
        📝 <strong>Tip:</strong> Upload multiple images at once. Primary image will be selected during checkout.
      </p>
    </div>
  );
}
