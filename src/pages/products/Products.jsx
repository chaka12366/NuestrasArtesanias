import { useState, useMemo, useRef, useEffect } from "react";
import { X, Image, Trash2, Edit } from "lucide-react";
import { fetchAllProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, fetchCategories, addProductImage, syncProductImages, fetchProductImages } from "../../lib/products.js";
import { toast } from "react-toastify";
import EmptyState from "../../components/EmptyState.jsx";
import "./AdminPages.css";

const STATUS_LABELS = { active:"Active", low:"Low Stock", out:"Out of Stock" };
const EMPTY_NEW = { name:"", categoryId:"", price:"", stock:"", description:"", tag:"", images:[] };
const EMPTY_EDIT = { id:null, name:"", categoryId:"", price:"", stock:"", description:"", tag:"", images:[], image:"", status:"", active:true, category:"", categoryName:"" };
const MAX_IMAGES = 5;

function ProductThumb({ img, name }) {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  if (img) return <img src={img} alt={name} className="ap-prod-thumb" />;
  return <div className="ap-prod-thumb ap-prod-thumb-placeholder">{initials}</div>;
}

export default function Products() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [catFilter, setCatFilter]   = useState("All");
  const [search, setSearch]         = useState("");
  const [editing, setEditing]       = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [newP, setNewP]             = useState(EMPTY_NEW);
  const [editModalP, setEditModalP] = useState(null);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [imgEditId, setImgEditId]   = useState(null);
  const addFileRef  = useRef(null);
  const editFileRef = useRef(null);
  const rowFileRefs = useRef({});

  // Fetch products and categories on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllProducts(), fetchCategories()]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories([{ id: null, name: "All", slug: "all" }, ...cats]);
      setLoading(false);
    }).catch(error => {
      console.error('Failed to fetch:', error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowLoading(true), 300);
    } else {
      setShowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const filtered = useMemo(()=>
    products.filter(p=>
      (catFilter==="All" || p.category===catFilter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    ), [products, catFilter, search]);

  const readFile = (file) => new Promise(res => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.readAsDataURL(file);
  });

  const handleNewImgMulti = async (files, isEdit = false) => {
    const fileArray = Array.from(files).filter(f => f && f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    // Check max limit
    const currentImages = isEdit ? (editModalP?.images || []) : (newP.images || []);
    const slotsRemaining = MAX_IMAGES - currentImages.length;
    if (slotsRemaining <= 0) {
      toast.warning(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const filesToProcess = fileArray.slice(0, slotsRemaining);
    if (filesToProcess.length < fileArray.length) {
      toast.info(`Only ${slotsRemaining} slot(s) remaining. ${fileArray.length - filesToProcess.length} image(s) skipped.`);
    }

    for (const file of filesToProcess) {
      const result = await uploadProductImage(file, `product-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
      if (result.success) {
        if (isEdit) setEditModalP(p => ({ ...p, images: [...(p.images || []), result.url] }));
        else setNewP(p => ({ ...p, images: [...(p.images || []), result.url] }));
      } else {
        console.warn("Storage upload failed, falling back to base64:", result.error);
        const base64 = await readFile(file);
        if (isEdit) setEditModalP(p => ({ ...p, images: [...(p.images || []), base64] }));
        else setNewP(p => ({ ...p, images: [...(p.images || []), base64] }));
      }
    }

    // Debug: confirm multiple images stored
    console.log(`[MultiUpload] ${isEdit ? 'Edit' : 'Add'} modal images after upload:`,
      isEdit ? editModalP?.images : newP.images, `(+${filesToProcess.length} new)`);
  };

  const handleRemoveImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditModalP(p => {
        const updated = p.images.filter((_, i) => i !== index);
        console.log('[MultiUpload] Edit modal images after remove:', updated);
        return { ...p, images: updated };
      });
    } else {
      setNewP(p => {
        const updated = p.images.filter((_, i) => i !== index);
        console.log('[MultiUpload] Add modal images after remove:', updated);
        return { ...p, images: updated };
      });
    }
  };

  const handleRowImg = async (id, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const result = await uploadProductImage(file, `product-${id}-${Date.now()}`);
    if (result.success) {
      await updateProduct(id, { image_url: result.url });
      
      const p = products.find(prod => prod.id === id);
      let newImages = [result.url];
      if (p && p.images && p.images.length > 1) {
         newImages = [result.url, ...p.images.slice(1)];
      }
      await syncProductImages(id, newImages);
      
      setProducts(ps => ps.map(p => p.id===id ? {...p, image: result.url, images: newImages} : p));
      setImgEditId(null);
    } else {
      console.warn("Storage upload failed, falling back to base64:", result.error);
      const base64 = await readFile(file);
      await updateProduct(id, { image_url: base64 });
      
      const p = products.find(prod => prod.id === id);
      let newImages = [base64];
      if (p && p.images && p.images.length > 1) {
         newImages = [base64, ...p.images.slice(1)];
      }
      await syncProductImages(id, newImages);
      
      setProducts(ps => ps.map(p => p.id===id ? {...p, image: base64, images: newImages} : p));
      setImgEditId(null);
    }
  };

  const commitEdit = async () => {
    if (!editing) return;
    const field = editing.field;
    const val = ["price","stock"].includes(field) ? Number(editing.val) : editing.val;
    
    const updateData = {};
    if (field === "price") updateData.price = val;
    if (field === "stock") updateData.stock = val;
    if (field === "name") updateData.name = val;
    if (field === "tag") updateData.tag = val || null;
    
    const success = await updateProduct(editing.id, updateData);
    if (success) {
      setProducts(ps => ps.map(p => p.id===editing.id
        ? { ...p, [field]: field === "price" || field === "stock" ? val : val }
        : p));
      toast.success("Product updated successfully");
    }
    setEditing(null);
  };

  const saveEditedProduct = async () => {
    if (!editModalP.name || !editModalP.price || !editModalP.categoryId) return;
    
    const primaryImage = editModalP.images?.length > 0 ? editModalP.images[0] : null;
    
    const success = await updateProduct(editModalP.id, {
      name: editModalP.name,
      category_id: editModalP.categoryId,
      price: Number(editModalP.price),
      stock: Number(editModalP.stock || 0),
      description: editModalP.description,
      image_url: primaryImage,
      tag: editModalP.tag || null,
    });
    
    if (success) {
      await syncProductImages(editModalP.id, editModalP.images || []);
      const updated = await fetchAllProducts();
      setProducts(updated);
      setEditModalP(null);
      toast.success("Product updated successfully");
    } else {
      toast.error("Failed to update product");
    }
  };

  const addProduct = async () => {
    if (!newP.name || !newP.price || !newP.categoryId) return;
    
    // Use first image as primary, or null if no images
    const primaryImage = newP.images?.length > 0 ? newP.images[0] : null;
    
    const result = await createProduct({
      name: newP.name,
      category_id: newP.categoryId,
      price: Number(newP.price),
      stock: Number(newP.stock || 0),
      description: newP.description,
      image_url: primaryImage,
      tag: newP.tag || null,
    });
    
    if (result.success) {
      const productId = result.productId;
      
      // Add all images to product_images table
      if (newP.images && newP.images.length > 0) {
        await syncProductImages(productId, newP.images);
      }
      
      // Refresh products list
      const updated = await fetchAllProducts();
      setProducts(updated);
      setNewP(EMPTY_NEW);
      setShowAdd(false);
      toast.success("Product added successfully with " + (newP.images?.length || 0) + " image(s)");
    } else {
      alert("Failed to add product: " + result.error);
    }
  };

  const deleteProductHandler = async () => {
    if (!deleteModalId) return;
    const success = await deleteProduct(deleteModalId);
    if (success) {
      setProducts(ps => ps.filter(p => p.id !== deleteModalId));
      toast.warning("Product deleted");
    }
    setDeleteModalId(null);
  };

  const handleEditClick = async (p) => {
    // Show a loading state if possible, or just fetch directly (usually very fast)
    const imagesData = await fetchProductImages(p.id);
    const images = imagesData && imagesData.length > 0 
      ? imagesData.sort((a,b) => a.display_order - b.display_order).map(img => img.image_url) 
      : (p.image ? [p.image] : []);
    
    // Ensure ALL fields are present and properly initialized
    setEditModalP({
      ...EMPTY_EDIT,  // Start with empty template
      ...p,           // Spread product data (overrides empties)
      images,         // Ensure images array is set
      id: p.id,       // Ensure id is set
      name: p.name || "",
      price: p.price || 0,
      stock: p.stock || 0,
      categoryId: p.categoryId || "",
      description: p.description || "",
      tag: p.tag || "",
    });
  };

  return (
    <div className="ap-root">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Products</h1>
          <p className="ap-page-sub">{products.length} items · {products.filter(p=>p.status==="out").length} out of stock</p>
        </div>
        <button className="ap-primary-btn" onClick={()=>setShowAdd(true)}>+ Add Product</button>
      </div>

      <div className="ap-filters">
        <input className="ap-search" placeholder="Search products…"
          value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="ap-cat-tabs">
          {categories.map(c=>(
            <button key={c.id || "all"} className={`ap-range-tab ${(catFilter===c.slug || (catFilter==="All" && c.id===null))?"active":""}`}
              onClick={()=>setCatFilter(c.slug || "All")}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="ap-stock-summary">
        {[
          { label:"Active",       count:products.filter(p=>p.status==="active").length, color:"#27ae60" },
          { label:"Low Stock",    count:products.filter(p=>p.status==="low").length,    color:"#e67e22" },
          { label:"Out of Stock", count:products.filter(p=>p.status==="out").length,    color:"#e74c3c" },
        ].map(s=>(
          <div key={s.label} className="ap-stock-pill" style={{"--sc":s.color}}>
            <span className="ap-stock-dot"/>
            <span>{s.label}: <strong>{s.count}</strong></span>
          </div>
        ))}
      </div>

      {/* PRODUCT LISTING */}
      {loading ? (
        <div className="ap-pgrid">
          {showLoading ? [1,2,3,4].map(i => (
            <div key={`skel-${i}`} className="ap-pcard ap-pcard-skeleton">
              <div className="skeleton" style={{ height: "100%", borderRadius: "14px" }}></div>
            </div>
          )) : <div style={{ height: "200px" }}></div>}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Products Yet"
          description={catFilter === "All" && search === ""
            ? "You haven't added any products yet. Create your first handcrafted artesanía product to get started!"
            : "No products match your filters. Try adjusting your search or category selection."}
          buttonText={catFilter === "All" && search === "" ? "Add Product" : "Clear Filters"}
          onClick={() => {
            if (catFilter === "All" && search === "") {
              setShowAdd(true);
            } else {
              setCatFilter("All");
              setSearch("");
            }
          }}
          type="products"
        />
      ) : (
        <div className="ap-ptable-wrap">
          {/* Desktop table header */}
          <div className="ap-ptable-header">
            <span>IMG</span>
            <span>PRODUCT</span>
            <span>CATEGORY</span>
            <span>PRICE</span>
            <span>STOCK</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>

          <div className="ap-pgrid">
            {filtered.map((p, i) => (
              <div key={p.id} className="ap-pcard" style={{"--i": i}}>
                {/* Col 1: Image */}
                <div className="ap-pcard-img">
                  <div className="ap-pcard-thumb"
                    onClick={() => { setImgEditId(p.id); setTimeout(() => rowFileRefs.current[p.id]?.click(), 10); }}>
                    <ProductThumb img={p.image} name={p.name} />
                    <span className="ap-pcard-cam">📷</span>
                  </div>
                  <input type="file" accept="image/*" className="ap-file-hidden"
                    ref={el => rowFileRefs.current[p.id] = el}
                    onChange={e => handleRowImg(p.id, e.target.files[0])} />
                </div>

                {/* Col 2: Product name + tag */}
                <div className="ap-pcard-product">
                  <span className="ap-pcard-name">{p.name}</span>
                  {p.tag && <span className="ap-pcard-tag">{p.tag}</span>}
                </div>

                {/* Col 3: Category */}
                <div className="ap-pcard-category">
                  <span className="ap-pcard-cat">{p.categoryName}</span>
                </div>

                {/* Col 4: Price */}
                <div className="ap-pcard-price">
                  <span className="ap-pcard-stat-label">Price</span>
                  {editing?.id === p.id && editing.field === "price" ? (
                    <input className="ap-inline-edit" type="number" value={editing.val} autoFocus
                      onChange={e => setEditing({ ...editing, val: e.target.value })}
                      onBlur={commitEdit} onKeyDown={e => e.key === "Enter" && commitEdit()} />
                  ) : (
                    <span className="ap-pcard-stat-val" onClick={() => setEditing({ id: p.id, field: "price", val: p.price })}>
                      ${p.price.toFixed(2)} <Edit size={11} style={{ opacity: 0.4, marginLeft: 3 }} />
                    </span>
                  )}
                </div>

                {/* Col 5: Stock */}
                <div className="ap-pcard-stock">
                  <span className="ap-pcard-stat-label">Stock</span>
                  {editing?.id === p.id && editing.field === "stock" ? (
                    <input className="ap-inline-edit" type="number" value={editing.val} autoFocus
                      onChange={e => setEditing({ ...editing, val: e.target.value })}
                      onBlur={commitEdit} onKeyDown={e => e.key === "Enter" && commitEdit()} />
                  ) : (
                    <span className={`ap-pcard-stat-val ${p.stock <= 3 ? "critical" : p.stock <= 8 ? "warn" : ""}`}
                      onClick={() => setEditing({ id: p.id, field: "stock", val: p.stock })}>
                      {p.stock} <Edit size={11} style={{ opacity: 0.4, marginLeft: 3 }} />
                    </span>
                  )}
                </div>

                {/* Col 6: Status */}
                <div className="ap-pcard-statuswrap">
                  <button className={`ap-pcard-status st-${p.status}`}
                    onClick={async () => {
                      const nextStatus = p.status === "active" ? "low" : p.status === "low" ? "out" : "active";
                      await updateProduct(p.id, { stock: p.stock });
                      setProducts(ps => ps.map(x => x.id === p.id ? { ...x, status: nextStatus } : x));
                    }}>
                    {STATUS_LABELS[p.status]}
                  </button>
                </div>

                {/* Col 7: Actions */}
                <div className="ap-pcard-actions">
                  <button className="ap-pcard-btn ap-pcard-btn-edit" onClick={() => handleEditClick(p)} title="Edit Product">
                    <Edit size={14} /> <span className="ap-pcard-btn-label">Edit</span>
                  </button>
                  <button className="ap-pcard-btn ap-pcard-btn-del" onClick={() => setDeleteModalId(p.id)} title="Delete Product">
                    <Trash2 size={14} /> <span className="ap-pcard-btn-label">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAdd && (
        <div className="ap-modal-overlay" onClick={()=>{setShowAdd(false);setNewP(EMPTY_NEW);}}>
          <div className="ap-modal ap-modal-wide" onClick={e=>e.stopPropagation()}>
            <h3 className="ap-modal-title">Add New Product</h3>

            {/* Image upload zone */}
            {(newP.images?.length || 0) < MAX_IMAGES && (
              <div
                className={`ap-img-upload-zone ${dragOver?"drag-over":""}`}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleNewImgMulti(e.dataTransfer.files, false);}}
                onClick={()=>addFileRef.current?.click()}
              >
                <div className="ap-upload-placeholder">
                  <Image size={32} className="ap-upload-icon" />
                  <p className="ap-upload-text"><strong>Tap to choose from gallery</strong></p>
                  <p className="ap-upload-hint">or drag &amp; drop · JPG, PNG, WebP</p>
                  <p className="ap-upload-slots">{MAX_IMAGES - (newP.images?.length || 0)} slot(s) remaining</p>
                </div>
                <input ref={addFileRef} type="file" accept="image/*" multiple
                  className="ap-file-hidden"
                  onChange={e=>{handleNewImgMulti(e.target.files, false); e.target.value='';}} />
              </div>
            )}

            {/* Display uploaded images grid */}
            {newP.images && newP.images.length > 0 && (
              <div className="ap-images-grid">
                <h4 className="ap-images-title">Images ({newP.images.length}/{MAX_IMAGES})</h4>
                <div className="ap-images-list">
                  {newP.images.map((img, idx) => (
                    <div key={idx} className="ap-image-item">
                      <img src={img} alt={`preview-${idx}`} />
                      <div className="ap-image-badge">{idx === 0 ? 'Primary' : `#${idx + 1}`}</div>
                      <button
                        className="ap-image-remove-btn"
                        onClick={() => handleRemoveImage(idx, false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ap-modal-fields">
              <div className="ap-field">
                <label className="ap-label">Product Name</label>
                <input className="ap-input" placeholder="e.g. Crystal Bracelet"
                  value={newP.name} onChange={e=>setNewP({...newP,name:e.target.value})}/>
              </div>
              <div className="ap-field">
                <label className="ap-label">Category</label>
                <select className="ap-input" value={newP.categoryId}
                  onChange={e=>setNewP({...newP,categoryId:e.target.value})}>
                  <option value="">-- Select Category --</option>
                  {categories.filter(c=>c.id!==null).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="ap-field-row">
                <div className="ap-field">
                  <label className="ap-label">Price (BZD)</label>
                  <input className="ap-input" type="number" placeholder="0.00"
                    value={newP.price} onChange={e=>setNewP({...newP,price:e.target.value})}/>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Stock Qty</label>
                  <input className="ap-input" type="number" placeholder="0"
                    value={newP.stock} onChange={e=>setNewP({...newP,stock:e.target.value})}/>
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label">Description (optional)</label>
                <textarea className="ap-input" placeholder="Product description…" rows="3"
                  value={newP.description} onChange={e=>setNewP({...newP,description:e.target.value})}/>
              </div>
              <div className="ap-field">
                <label className="ap-label">Tag (optional - e.g. New, Hot, Popular)</label>
                <input className="ap-input" placeholder="e.g. New"
                  value={newP.tag} onChange={e=>setNewP({...newP,tag:e.target.value})}/>
              </div>
            </div>

            <div className="ap-modal-actions">
              <button className="ap-ghost-btn" onClick={()=>{setShowAdd(false);setNewP(EMPTY_NEW);}}>Cancel</button>
              <button className="ap-primary-btn" onClick={addProduct}
                style={{opacity:(!newP.name||!newP.price)?0.5:1}}>
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalP && (
        <div className="ap-modal-overlay" onClick={()=>setEditModalP(null)}>
          <div className="ap-modal ap-modal-wide" onClick={e=>e.stopPropagation()}>
            <h3 className="ap-modal-title">Edit Product</h3>

            {/* Image upload zone */}
            {(editModalP.images?.length || 0) < MAX_IMAGES && (
              <div
                className={`ap-img-upload-zone ${dragOver?"drag-over":""}`}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false); handleNewImgMulti(e.dataTransfer.files, true);}}
                onClick={()=>editFileRef.current?.click()}
              >
                <div className="ap-upload-placeholder">
                  <Image size={32} className="ap-upload-icon" />
                  <p className="ap-upload-text"><strong>Tap to choose from gallery</strong></p>
                  <p className="ap-upload-hint">or drag &amp; drop · JPG, PNG, WebP</p>
                  <p className="ap-upload-slots">{MAX_IMAGES - (editModalP.images?.length || 0)} slot(s) remaining</p>
                </div>
                <input ref={editFileRef} type="file" accept="image/*" multiple
                  className="ap-file-hidden"
                  onChange={e=>{handleNewImgMulti(e.target.files, true); e.target.value='';}} />
              </div>
            )}

            {/* Display uploaded images grid */}
            {editModalP.images && editModalP.images.length > 0 && (
              <div className="ap-images-grid">
                <h4 className="ap-images-title">Images ({editModalP.images.length}/{MAX_IMAGES})</h4>
                <div className="ap-images-list">
                  {editModalP.images.map((img, idx) => (
                    <div key={idx} className="ap-image-item">
                      <img src={img} alt={`preview-${idx}`} />
                      <div className="ap-image-badge">{idx === 0 ? 'Primary' : `#${idx + 1}`}</div>
                      <button
                        className="ap-image-remove-btn"
                        onClick={() => handleRemoveImage(idx, true)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ap-modal-fields">
              <div className="ap-field">
                <label className="ap-label">Product Name</label>
                <input className="ap-input" placeholder="e.g. Crystal Bracelet"
                  value={editModalP.name || ''} onChange={e=>setEditModalP({...editModalP,name:e.target.value})}/>
              </div>
              <div className="ap-field">
                <label className="ap-label">Category</label>
                <select className="ap-input" value={editModalP.categoryId || ''}
                  onChange={e=>setEditModalP({...editModalP,categoryId:e.target.value})}>
                  <option value="">-- Select Category --</option>
                  {categories.filter(c=>c.id!==null).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="ap-field-row">
                <div className="ap-field">
                  <label className="ap-label">Price (BZD)</label>
                  <input className="ap-input" type="number" placeholder="0.00"
                    value={editModalP.price || ''} onChange={e=>setEditModalP({...editModalP,price:e.target.value})}/>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Stock Qty</label>
                  <input className="ap-input" type="number" placeholder="0"
                    value={editModalP.stock || 0} onChange={e=>setEditModalP({...editModalP,stock:e.target.value})}/>
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label">Description (optional)</label>
                <textarea className="ap-input" placeholder="Product description…" rows="3"
                  value={editModalP.description || ''} onChange={e=>setEditModalP({...editModalP,description:e.target.value})}/>
              </div>
              <div className="ap-field">
                <label className="ap-label">Tag (optional - e.g. New, Hot, Popular)</label>
                <input className="ap-input" placeholder="e.g. New"
                  value={editModalP.tag || ''} onChange={e=>setEditModalP({...editModalP,tag:e.target.value})}/>
              </div>
            </div>

            <div className="ap-modal-actions">
              <button className="ap-ghost-btn" onClick={()=>setEditModalP(null)}>Cancel</button>
              <button className="ap-primary-btn" onClick={saveEditedProduct}
                style={{opacity:(!editModalP.name||!editModalP.price||!editModalP.categoryId)?0.5:1}}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalId && (
        <div className="ap-modal-overlay" onClick={()=>setDeleteModalId(null)}>
          <div className="ap-modal" style={{ maxWidth: "400px" }} onClick={e=>e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ background: "#fef2f2", color: "#ef4444", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#1f2937", fontWeight: "600" }}>Delete Product</h3>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
            </div>
            <div className="ap-modal-actions" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button className="ap-ghost-btn" onClick={()=>setDeleteModalId(null)} style={{ flex: 1, display: "flex", justifyContent: "center" }}>Cancel</button>
              <button className="ap-primary-btn" onClick={deleteProductHandler} style={{ flex: 1, display: "flex", justifyContent: "center", background: "#ef4444", borderColor: "#ef4444" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}