
import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { 
  ClothingItem, 
  ClothingItemVariant, 
  CLOTHING_SIZES, 
  CLOTHING_COLORS,
  Gender,
  ClothingCategory,
  ALL_CLOTHING_CATEGORIES,
  GENDER_OPTIONS,
  CATEGORIES_NEEDING_GENDER_SEPARATION,
  CATEGORIES_flexible_GENDER
} from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import ImageUploader from './ImageUploader';

interface InventoryItemFormProps {
  itemToEdit?: ClothingItem | null;
  onSubmit: (itemData: Omit<ClothingItem, 'id'> | ClothingItem) => void;
  onCancel: () => void;
  isLoading?: boolean;
  uniqueBrands: string[];
}

const initialFormState: Omit<ClothingItem, 'id' | 'imageUrl' | 'variants'> & { imageUrl: string | null; variants: ClothingItemVariant[] } = {
  name: '',
  description: '',
  brand: '', 
  category: ALL_CLOTHING_CATEGORIES[0] || ClothingCategory.TSHIRTS,
  gender: Gender.UNISEX,
  color: CLOTHING_COLORS[0] || '',
  price: 0,
  variants: [{ size: CLOTHING_SIZES[0] || '', stock: 0 }],
  imageUrl: null,
};


const InventoryItemForm: React.FC<InventoryItemFormProps> = ({ itemToEdit, onSubmit, onCancel, isLoading, uniqueBrands }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<ClothingItem, 'id' | 'variants' | 'imageUrl' | 'brand' | 'category' | 'gender'>, string> & { brand?: string; category?: string; gender?: string; variants?: string | string[] }>>({});

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name,
        description: itemToEdit.description,
        brand: itemToEdit.brand,
        category: itemToEdit.category,
        gender: itemToEdit.gender,
        color: itemToEdit.color,
        price: itemToEdit.price,
        variants: itemToEdit.variants.length > 0 ? JSON.parse(JSON.stringify(itemToEdit.variants)) : [{ size: CLOTHING_SIZES[0] || '', stock: 0 }], // Deep copy
        imageUrl: itemToEdit.imageUrl,
      });
    } else {
      // When creating new, set a sensible default gender based on the initial category
      const initialCategory = initialFormState.category;
      let initialGender = Gender.UNISEX;
      if (CATEGORIES_NEEDING_GENDER_SEPARATION.includes(initialCategory)) {
        initialGender = Gender.MENS; // Default to Men's for categories needing separation
      } else if (CATEGORIES_flexible_GENDER.includes(initialCategory)) {
        initialGender = Gender.NOT_APPLICABLE; // Default to N/A for accessories
      }
      setFormData({...initialFormState, gender: initialGender});
    }
  }, [itemToEdit]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as ClothingCategory;
    let newGender = formData.gender;

    if (CATEGORIES_NEEDING_GENDER_SEPARATION.includes(newCategory)) {
      // If switching to a category that needs gender, and current gender is N/A, switch to a sensible default like MENS
      if (formData.gender === Gender.NOT_APPLICABLE) {
        newGender = Gender.MENS;
      }
    } else if (CATEGORIES_flexible_GENDER.includes(newCategory)) {
      newGender = Gender.NOT_APPLICABLE; // Default to N/A for these categories
    }
    // For other cases (e.g., unisex category, or category change where gender is already Mens/Womens/Unisex), keep current gender.
    
    setFormData(prev => ({ ...prev, category: newCategory, gender: newGender }));
    if (errors.category) setErrors(prev => ({ ...prev, category: undefined }));
    if (errors.gender) setErrors(prev => ({ ...prev, gender: undefined }));
  };
  
  const currentGenderOptions = useMemo(() => {
    if (CATEGORIES_flexible_GENDER.includes(formData.category)) {
      return [Gender.UNISEX, Gender.NOT_APPLICABLE];
    }
    return [Gender.MENS, Gender.WOMENS, Gender.UNISEX];
  }, [formData.category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "category") {
        handleCategoryChange(e as React.ChangeEvent<HTMLSelectElement>);
        return;
    }
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleVariantChange = (index: number, field: keyof ClothingItemVariant, value: string | number) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: field === 'stock' ? Number(value) : value };
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
    if (Array.isArray(errors.variants) && errors.variants[index]) {
        const newVariantErrors = [...errors.variants];
        newVariantErrors[index] = '';
        setErrors(prev => ({ ...prev, variants: newVariantErrors.every(e => !e) ? undefined : newVariantErrors}));
    } else if (typeof errors.variants === 'string') {
        setErrors(prev => ({ ...prev, variants: undefined}));
    }
  };

  const handleAddVariant = () => {
    const existingSizes = new Set(formData.variants.map(v => v.size));
    const nextSize = CLOTHING_SIZES.find(s => !existingSizes.has(s)) || CLOTHING_SIZES[0] || '';
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: nextSize, stock: 0 }]
    }));
  };

  const handleRemoveVariant = (index: number) => {
    if (formData.variants.length <= 1) {
        setErrors(prev => ({...prev, variants: "最低1つのサイズバリアントが必要です。"}));
        return; 
    }
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const handleImageUpload = (base64Image: string | null) => {
    setFormData(prev => ({ ...prev, imageUrl: base64Image }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<ClothingItem, 'id' | 'variants' | 'imageUrl' | 'brand' | 'category' | 'gender'>, string> & { brand?: string; category?: string; gender?: string; variants?: string | string[] }> = {};
    if (!formData.name.trim()) newErrors.name = '商品名は必須です。';
    if (!formData.brand.trim()) newErrors.brand = 'ブランドは必須です。';
    if (!formData.category) newErrors.category = 'カテゴリーは必須です。';
    if (!formData.gender) newErrors.gender = '性別は必須です。';
    else if (CATEGORIES_NEEDING_GENDER_SEPARATION.includes(formData.category) && formData.gender === Gender.NOT_APPLICABLE) {
        newErrors.gender = `このカテゴリー (${formData.category}) では「適用なし」以外の性別を選択してください。`;
    } else if (CATEGORIES_flexible_GENDER.includes(formData.category) && ![Gender.UNISEX, Gender.NOT_APPLICABLE].includes(formData.gender)) {
        newErrors.gender = `このカテゴリー (${formData.category}) では「ユニセックス」または「適用なし」を選択してください。`;
    }


    if (formData.price < 0) newErrors.price = '価格をマイナスにすることはできません。';
    if (!formData.color) newErrors.color = '色は必須です。';

    if (formData.variants.length === 0) {
      newErrors.variants = '最低1つのサイズバリアントが必要です。';
    } else {
      const variantErrors: string[] = formData.variants.map((variant, index) => {
        if (!variant.size) return `バリアント #${index + 1} のサイズは必須です。`;
        if (variant.stock < 0) return `バリアント #${index + 1} (${variant.size}) の在庫数をマイナスにすることはできません。`;
        const sizes = formData.variants.map(v => v.size);
        if (sizes.indexOf(variant.size) !== sizes.lastIndexOf(variant.size)) {
          return `バリアント #${index + 1} のサイズ ${variant.size} が重複しています。サイズは一意である必要があります。`;
        }
        return '';
      });
      if (variantErrors.some(e => e)) newErrors.variants = variantErrors;
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => {
        if (typeof error === 'string' && error) return true;
        if (Array.isArray(error)) return error.some(subError => typeof subError === 'string' && subError);
        return false;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (itemToEdit) {
        onSubmit({ ...itemToEdit, ...formData });
      } else {
        const { id, ...dataToSend } = { ...formData, id: crypto.randomUUID() };
        onSubmit(dataToSend);
      }
    }
  };
  
  const brandListId = "unique-brands-list";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm focus:bg-primary focus:text-white focus:placeholder-gray-200";
  const commonSelectClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm focus:bg-primary focus:text-white";


  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">商品名</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={commonInputClasses} />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">商品説明</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={commonInputClasses}></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">カテゴリー</label>
          <select name="category" id="category" value={formData.category} onChange={handleChange} className={commonSelectClasses}>
            {ALL_CLOTHING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">性別</label>
          <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className={commonSelectClasses}>
            {currentGenderOptions.map(gen => <option key={gen} value={gen}>{gen}</option>)}
          </select>
          {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">ブランド</label>
          <input 
            type="text" 
            name="brand" 
            id="brand" 
            value={formData.brand} 
            onChange={handleChange} 
            list={brandListId}
            className={commonInputClasses} 
            placeholder="既存のブランドを選択または新規入力"
          />
          <datalist id={brandListId}>
            {uniqueBrands.map(b => <option key={b} value={b} />)}
          </datalist>
          {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700">色</label>
          <select name="color" id="color" value={formData.color} onChange={handleChange} className={commonSelectClasses}>
            {CLOTHING_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color}</p>}
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">価格 ({CURRENCY_SYMBOL})</label>
          <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} min="0" step="1" className={commonInputClasses} />
          {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
        </div>
      </div>
      
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-700">サイズバリアントと在庫</h3>
        {formData.variants.map((variant, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-md space-y-3 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-1">
                <label htmlFor={`variant-size-${index}`} className="block text-xs font-medium text-gray-600">サイズ</label>
                <select 
                  name={`variant-size-${index}`} 
                  id={`variant-size-${index}`} 
                  value={variant.size} 
                  onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                  className={commonSelectClasses}
                >
                  <option value="">-- サイズを選択 --</option>
                  {CLOTHING_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-1">
                <label htmlFor={`variant-stock-${index}`} className="block text-xs font-medium text-gray-600">在庫数</label>
                <input 
                  type="number" 
                  name={`variant-stock-${index}`} 
                  id={`variant-stock-${index}`} 
                  value={variant.stock} 
                  min="0"
                  step="1"
                  onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                  className={commonInputClasses} 
                />
              </div>
              {formData.variants.length > 1 && (
                <div className="md:col-span-1">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveVariant(index)} 
                    className="w-full px-3 py-2 text-sm text-white bg-accent rounded-md hover:bg-accent/90 transition-colors"
                    aria-label={`バリアント ${index + 1} を削除`}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
            {Array.isArray(errors.variants) && errors.variants[index] && <p className="text-xs text-red-500">{errors.variants[index]}</p>}
          </div>
        ))}
        {typeof errors.variants === 'string' && <p className="mt-1 text-xs text-red-500">{errors.variants}</p>}
        <button 
          type="button" 
          onClick={handleAddVariant}
          className="mt-2 px-4 py-2 text-sm border border-secondary text-secondary rounded-md hover:bg-secondary/10 transition-colors"
        >
          + サイズバリアントを追加
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">画像</label>
        <ImageUploader onImageUpload={handleImageUpload} currentImage={formData.imageUrl} id={`item-image-upload-${itemToEdit?.id || 'new'}`} />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors" disabled={isLoading}>
          キャンセル
        </button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50" disabled={isLoading}>
          {isLoading ? (itemToEdit ? '保存中...' : '追加中...') : (itemToEdit ? '変更を保存' : '商品を追加')}
        </button>
      </div>
    </form>
  );
};

export default InventoryItemForm;
