"use client";

import React, { useState, useEffect } from "react";
import { MockProduct } from "@/lib/mock-store";
import { X, Save, Image as ImageIcon, Tag as TagIcon, Globe, Box, Plus, Minus } from "lucide-react";
import { generateChannelListing } from "@/lib/channel-manager";
import PriceAdvisor from "./PriceAdvisor";
import DescriptionEngine from "./DescriptionEngine";

interface ProductEditorProps {
  product?: MockProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: MockProduct) => void;
  storeName: string;
}

const CATEGORIES = [
  "Abbigliamento", "Abbigliamento Vintage", "Scarpe & Sneakers", 
  "Borse & Zaini", "Accessori", "Orologi & Gioielli", 
  "Elettronica & Audio", "Casa & Benessere", "Sport & Outdoor", "Altro"
];

const CONDITIONS = [
  { value: "NUOVO", label: "Nuovo" },
  { value: "COME_NUOVO", label: "Come Nuovo" },
  { value: "OTTIMO", label: "Ottimo Stato" },
  { value: "BUONO", label: "Buono Stato" }
];

export default function ProductEditor({ product, isOpen, onClose, onSave, storeName }: ProductEditorProps) {
  const [activeTab, setActiveTab] = useState("dati");
  const [formData, setFormData] = useState<Partial<MockProduct>>({});
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setTags(product.tags ? JSON.parse(product.tags) : []);
      setImages(product.images ? JSON.parse(product.images) : []);
    } else {
      setFormData({
        title: "",
        description: "",
        brand: "",
        category: CATEGORIES[0],
        sku: `SKU-${Math.floor(Math.random() * 10000)}`,
        condition: "NUOVO",
        conditionNotes: "",
        size: "",
        color: "",
        material: "",
        weight: 0,
        price: 0,
        comparePrice: null,
        stock: 1,
        syncSubito: true,
        syncVinted: true,
        syncEbay: false,
        syncFacebook: true,
        isActive: true,
      });
      setTags([]);
      setImages([]);
    }
    setActiveTab("dati");
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof MockProduct, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const finalProduct = {
      ...formData,
      id: product?.id || `prod-${Date.now()}`,
      tags: JSON.stringify(tags),
      images: JSON.stringify(images),
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MockProduct;
    
    onSave(finalProduct);
  };

  const TABS = [
    { id: "dati", label: "Dati Articolo", icon: TagIcon },
    { id: "immagini", label: "Galleria", icon: ImageIcon },
    { id: "prezzi", label: "Prezzi & Giacenza", icon: Box },
    { id: "canali", label: "Marketplace", icon: Globe },
  ];

  const productForListing = {
    id: formData.id || "",
    name: formData.title || "",
    sku: formData.sku || "",
    description: formData.description,
    price: formData.price || 0,
    condition: formData.condition,
    category: { name: formData.category || "" },
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {product ? "Modifica Articolo" : "Nuovo Articolo"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col p-4 gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? "bg-emerald-100 text-emerald-800 shadow-sm" 
                    : "text-slate-600 hover:bg-slate-200/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {activeTab === "dati" && (
              <div className="max-w-3xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Titolo Articolo</label>
                    <input 
                      type="text" 
                      value={formData.title || ""} 
                      onChange={e => handleChange("title", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                    <input 
                      type="text" 
                      value={formData.brand || ""} 
                      onChange={e => handleChange("brand", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <select 
                      value={formData.category || ""} 
                      onChange={e => handleChange("category", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                    <input 
                      type="text" 
                      value={formData.sku || ""} 
                      onChange={e => handleChange("sku", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Condizione</label>
                    <select 
                      value={formData.condition || "NUOVO"} 
                      onChange={e => handleChange("condition", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                {formData.condition !== "NUOVO" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Note Difetti</label>
                    <textarea 
                      value={formData.conditionNotes || ""} 
                      onChange={e => handleChange("conditionNotes", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 h-20"
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Taglia</label>
                    <input type="text" value={formData.size || ""} onChange={e => handleChange("size", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Colore</label>
                    <input type="text" value={formData.color || ""} onChange={e => handleChange("color", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Materiale</label>
                    <input type="text" value={formData.material || ""} onChange={e => handleChange("material", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Peso (g)</label>
                    <input type="number" value={formData.weight || ""} onChange={e => handleChange("weight", Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={tagInput} 
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" 
                      placeholder="Aggiungi tag..."
                    />
                    <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200">
                      Aggiungi
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)}><X className="w-3 h-3 hover:text-emerald-900" /></button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione</label>
                  <textarea 
                    value={formData.description || ""} 
                    onChange={e => handleChange("description", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 h-40"
                  />
                  <DescriptionEngine 
                    product={{
                      title: formData.title || "",
                      brand: formData.brand,
                      category: formData.category || "",
                      condition: formData.condition || "NUOVO",
                      conditionNotes: formData.conditionNotes,
                      size: formData.size,
                      color: formData.color,
                      material: formData.material,
                      price: formData.price || 0,
                      comparePrice: formData.comparePrice,
                      sku: formData.sku
                    }}
                    onDescriptionSelect={(desc) => handleChange("description", desc)}
                  />
                </div>
              </div>
            )}

            {activeTab === "immagini" && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aggiungi URL Immagine</label>
                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      value={imageUrlInput} 
                      onChange={e => setImageUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md" 
                      placeholder="https://..."
                    />
                    <button type="button" onClick={handleAddImage} className="taaaac-btn-primary flex items-center gap-2 px-4 py-2">
                      <Plus className="w-4 h-4" /> Aggiungi
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleRemoveImage(idx)} className="p-2 bg-white rounded-full text-rose-500 hover:bg-rose-50">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded shadow-sm">
                            Copertina
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "prezzi" && (
              <div className="max-w-3xl space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prezzo Base (€)*</label>
                    <input 
                      type="number" 
                      value={formData.price || 0} 
                      onChange={e => handleChange("price", Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prezzo Confronto (€)</label>
                    <input 
                      type="number" 
                      value={formData.comparePrice || ""} 
                      onChange={e => handleChange("comparePrice", e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-500 line-through"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giacenza</label>
                    <div className="flex items-center">
                      <button type="button" onClick={() => handleChange("stock", Math.max(0, (formData.stock || 0) - 1))} className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-l-md hover:bg-slate-200">
                        <Minus className="w-4 h-4" />
                      </button>
                      <input 
                        type="number" 
                        value={formData.stock || 0} 
                        onChange={e => handleChange("stock", Number(e.target.value))}
                        className="w-full px-3 py-2 border-y border-slate-300 text-center"
                      />
                      <button type="button" onClick={() => handleChange("stock", (formData.stock || 0) + 1)} className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-r-md hover:bg-slate-200">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <PriceAdvisor 
                  category={formData.category || CATEGORIES[0]}
                  brand={formData.brand}
                  condition={formData.condition || "NUOVO"}
                  basePrice={formData.price || 0}
                />
              </div>
            )}

            {activeTab === "canali" && (
              <div className="max-w-4xl space-y-6">
                {[
                  { id: "syncSubito", label: "Subito", channel: "SUBITO" as const },
                  { id: "syncVinted", label: "Vinted", channel: "VINTED" as const },
                  { id: "syncEbay", label: "eBay", channel: "EBAY" as const },
                  { id: "syncFacebook", label: "Facebook", channel: "FACEBOOK" as const }
                ].map(platform => {
                  const isSync = formData[platform.id as keyof MockProduct] as boolean;
                  const listing = generateChannelListing(productForListing, platform.channel, storeName);
                  
                  return (
                    <div key={platform.id} className="taaaac-card border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isSync} 
                            onChange={e => handleChange(platform.id as keyof MockProduct, e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-slate-800">{platform.label}</span>
                        </div>
                        {isSync && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Attivo</span>}
                      </div>
                      
                      {isSync && (
                        <div className="p-4 space-y-4">
                          <div className="bg-slate-50 p-3 rounded-lg text-sm font-mono text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {listing.formattedText}
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => navigator.clipboard.writeText(listing.title)} className="taaaac-btn-primary flex-1 py-1.5 text-xs">Copia Titolo</button>
                            <button type="button" onClick={() => navigator.clipboard.writeText(listing.formattedText)} className="taaaac-btn-primary flex-1 py-1.5 text-xs">Copia Testo</button>
                          </div>
                          <div>
                            <input type="text" placeholder="Incolla link annuncio qui una volta pubblicato..." className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
            Annulla
          </button>
          <button type="button" onClick={handleSave} className="taaaac-btn-accent px-6 py-2 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Salva Articolo
          </button>
        </div>
      </div>
    </div>
  );
}
