import { useState, useEffect } from 'react';
import { addProductImage, fetchProductImages, deleteProductImage } from '../../lib/products.js';
import { Trash2, Plus } from 'lucide-react';
import './ProductImageUpload.css';

export default function ProductImageUpload({ productId }) {
  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  // Load existing images
  useEffect(() => {
    loadImages();
  }, [productId]);

  async function loadImages() {
    setLoadingImages(true);
    const data = await fetchProductImages(productId);
    setImages(data);
    setLoadingImages(false);
  }

  async function handleAddImage(e) {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }

    setUploading(true);
    const result = await addProductImage(productId, imageUrl, isPrimary);
    
    if (result.success) {
      setImageUrl('');
      setIsPrimary(false);
      await loadImages();
      alert('✓ Image added successfully!');
    } else {
      alert('✗ Error: ' + (result.error || 'Failed to add image'));
    }
    setUploading(false);
  }

  async function handleDeleteImage(imageId) {
    if (!confirm('Delete this image?')) return;

    const success = await deleteProductImage(imageId);
    if (success) {
      await loadImages();
      alert('✓ Image deleted successfully!');
    } else {
      alert('✗ Error deleting image');
    }
  }

  return (
    <div className="piu-container">
      <h3>Product Images</h3>

      {/* Add New Image Form */}
      <form onSubmit={handleAddImage} className="piu-form">
        <div className="piu-form-group">
          <label htmlFor="image-url">Image URL</label>
          <input
            id="image-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
          />
        </div>

        <div className="piu-form-group checkbox">
          <label htmlFor="is-primary">
            <input
              id="is-primary"
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Set as primary thumbnail
          </label>
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className="piu-btn-add"
        >
          <Plus size={16} />
          {uploading ? 'Adding...' : 'Add Image'}
        </button>
      </form>

      {/* Images List */}
      <div className="piu-images-section">
        <h4>Current Images ({images.length})</h4>
        
        {loadingImages ? (
          <p className="piu-loading">Loading images...</p>
        ) : images.length === 0 ? (
          <p className="piu-empty">No images yet. Add one above!</p>
        ) : (
          <div className="piu-images-grid">
            {images.map((img) => (
              <div key={img.id} className="piu-image-card">
                <div className="piu-image-wrapper">
                  <img 
                    src={(img.image_url?.startsWith('http')) ? img.image_url : `/${img.image_url}`}
                    alt="Product"
                    onError={e => { e.target.src = '/logo.png'; }}
                  />
                  {img.is_primary && (
                    <span className="piu-badge-primary">Primary</span>
                  )}
                </div>
                
                <div className="piu-image-info">
                  <small>Order: {img.display_order}</small>
                </div>

                <button
                  type="button"
                  className="piu-btn-delete"
                  onClick={() => handleDeleteImage(img.id)}
                  aria-label="Delete image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
