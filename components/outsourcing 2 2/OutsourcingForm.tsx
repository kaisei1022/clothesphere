
import React, { useState, FormEvent, useEffect } from 'react';
import { OutsourcingRecord, OUTSOURCING_STORES, OutsourcingStore, OutsourcingStatus, ALL_OUTSOURCING_STATUSES } from '../../types';
import ImageUploader from '../inventory/ImageUploader'; // Import ImageUploader

interface OutsourcingFormProps {
  onSubmit: (recordData: Omit<OutsourcingRecord, 'id'> | OutsourcingRecord) => void;
  onCancel: () => void;
  isLoading?: boolean;
  recordToEdit?: OutsourcingRecord | null;
}

const initialFormState: Omit<OutsourcingRecord, 'id'> = {
  outsourcingStore: OUTSOURCING_STORES[0],
  recipientName: '',
  itemName: '',
  itemDescription: '',
  quantity: 1,
  dateOutsourced: new Date().toISOString().split('T')[0], // Defaults to today
  status: OutsourcingStatus.OUTSOURCED, // Default status
  notes: '',
  imageUrl: null, // Initialize imageUrl
};

const OutsourcingForm: React.FC<OutsourcingFormProps> = ({ onSubmit, onCancel, isLoading, recordToEdit }) => {
  const [formData, setFormData] = useState<Omit<OutsourcingRecord, 'id'>>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<OutsourcingRecord, 'id'>, string>>>({});

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        outsourcingStore: recordToEdit.outsourcingStore,
        recipientName: recordToEdit.recipientName,
        itemName: recordToEdit.itemName,
        itemDescription: recordToEdit.itemDescription || '',
        quantity: recordToEdit.quantity,
        dateOutsourced: recordToEdit.dateOutsourced.split('T')[0],
        status: recordToEdit.status,
        notes: recordToEdit.notes || '',
        imageUrl: recordToEdit.imageUrl || null, // Load existing image
      });
    } else {
      setFormData(initialFormState);
    }
  }, [recordToEdit]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'quantity' ? parseInt(value, 10) : 
               name === 'status' ? value as OutsourcingStatus : value 
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageUpload = (base64Image: string | null) => {
    setFormData(prev => ({ ...prev, imageUrl: base64Image }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<OutsourcingRecord, 'id'>, string>> = {};
    if (!formData.outsourcingStore) newErrors.outsourcingStore = '委託元店舗は必須です。';
    if (!formData.recipientName.trim()) newErrors.recipientName = '受取人名は必須です。';
    if (!formData.itemName.trim()) newErrors.itemName = '商品名は必須です。';
    if (formData.quantity <= 0) newErrors.quantity = '数量は1以上である必要があります。';
    if (!formData.dateOutsourced) newErrors.dateOutsourced = '委託日は必須です。';
    if (!formData.status) newErrors.status = 'ステータスは必須です。';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
        const dataToSubmit = { ...formData }; // Ensure imageUrl is included
        if (recordToEdit) {
            onSubmit({ ...recordToEdit, ...dataToSubmit }); // Pass full record with ID for edit
        } else {
            onSubmit(dataToSubmit); // Pass data without ID for new record
        }
    }
  };

  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm focus:bg-primary focus:text-white focus:placeholder-gray-200";
  const commonSelectClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm focus:bg-primary focus:text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{recordToEdit ? '委託記録を編集' : '新規委託記録'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="outsourcingStore" className="block text-sm font-medium text-gray-700">委託元店舗 <span className="text-red-500">*</span></label>
          <select 
            name="outsourcingStore" 
            id="outsourcingStore" 
            value={formData.outsourcingStore} 
            onChange={handleChange}
            className={commonSelectClasses}
            required
          >
            {OUTSOURCING_STORES.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
          {errors.outsourcingStore && <p className="mt-1 text-xs text-red-500">{errors.outsourcingStore}</p>}
        </div>
        <div>
          <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">受取人/委託先名 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="recipientName" 
            id="recipientName" 
            value={formData.recipientName} 
            onChange={handleChange} 
            className={commonInputClasses} 
            required 
          />
          {errors.recipientName && <p className="mt-1 text-xs text-red-500">{errors.recipientName}</p>}
        </div>
      </div>
      
      <div>
        <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">商品名 <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          name="itemName" 
          id="itemName" 
          value={formData.itemName} 
          onChange={handleChange} 
          className={commonInputClasses} 
          required 
        />
        {errors.itemName && <p className="mt-1 text-xs text-red-500">{errors.itemName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">商品画像</label>
        <ImageUploader 
          onImageUpload={handleImageUpload} 
          currentImage={formData.imageUrl} 
          id={`outsourcing-image-upload-${recordToEdit?.id || 'new'}`} 
        />
      </div>

      <div>
        <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700">商品説明</label>
        <textarea 
          name="itemDescription" 
          id="itemDescription" 
          value={formData.itemDescription} 
          onChange={handleChange} 
          rows={3}
          className={commonInputClasses}
        ></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">数量 <span className="text-red-500">*</span></label>
          <input 
            type="number" 
            name="quantity" 
            id="quantity" 
            value={formData.quantity} 
            onChange={handleChange} 
            min="1" 
            className={commonInputClasses} 
            required 
          />
          {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
        </div>
        <div>
          <label htmlFor="dateOutsourced" className="block text-sm font-medium text-gray-700">委託日 <span className="text-red-500">*</span></label>
          <input 
            type="date" 
            name="dateOutsourced" 
            id="dateOutsourced" 
            value={formData.dateOutsourced} 
            onChange={handleChange} 
            className={commonInputClasses} 
            required 
          />
          {errors.dateOutsourced && <p className="mt-1 text-xs text-red-500">{errors.dateOutsourced}</p>}
        </div>
        <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">ステータス <span className="text-red-500">*</span></label>
            <select 
                name="status" 
                id="status" 
                value={formData.status} 
                onChange={handleChange}
                className={commonSelectClasses}
                required
            >
                {ALL_OUTSOURCING_STATUSES.map(statusVal => (
                  <option key={statusVal} value={statusVal}>{statusVal}</option>
                ))}
            </select>
            {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">備考</label>
        <textarea 
          name="notes" 
          id="notes" 
          value={formData.notes} 
          onChange={handleChange} 
          rows={3}
          className={commonInputClasses}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors" disabled={isLoading}>
          キャンセル
        </button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50" disabled={isLoading}>
          {isLoading ? (recordToEdit ? '保存中...' : '追加中...') : (recordToEdit ? '変更を保存' : '記録を追加')}
        </button>
      </div>
    </form>
  );
};

export default OutsourcingForm;
