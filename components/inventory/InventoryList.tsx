
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClothingItem, ClothingItemVariant, ClothingCategory, Gender, ALL_CLOTHING_CATEGORIES, GENDER_OPTIONS, CATEGORIES_NEEDING_GENDER_SEPARATION, CATEGORIES_flexible_GENDER } from '../../types';
import { CURRENCY_SYMBOL } from '../../constants';
import Modal from '../shared/Modal';

interface InventoryListItemProps {
  item: ClothingItem;
  onEdit: () => void;
  onDelete: () => void;
  onQuickAddToOrder: (item: ClothingItem, variant: ClothingItemVariant) => void;
}

const InventoryListItem: React.FC<InventoryListItemProps> = ({ item, onEdit, onDelete, onQuickAddToOrder }) => {
  const [showVariantModal, setShowVariantModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  };

  const totalStock = item.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const availableSizes = item.variants.filter(v => v.stock > 0).map(v => v.size).join(', ') || '取扱なし';
  const orderableVariants = item.variants.filter(v => v.stock > 0);

  const handleQuickAddClick = () => {
    if (orderableVariants.length === 1) {
      onQuickAddToOrder(item, orderableVariants[0]);
    } else if (orderableVariants.length > 1) {
      setShowVariantModal(true);
    } else {
      alert(`${item.name} は現在在庫切れのため、注文に追加できません。`);
    }
  };

  const handleVariantSelectForOrder = (variant: ClothingItemVariant) => {
    onQuickAddToOrder(item, variant);
    setShowVariantModal(false);
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <div className="h-48 w-full overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
        )}
      </div>
      <div className="p-5 flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 truncate" title={item.name}>{item.name}</h3>
        <p className="text-xs text-gray-500">
          {item.category} {item.gender !== Gender.NOT_APPLICABLE ? `(${item.gender})` : ''}
        </p>
        <p className="text-sm text-gray-500">ブランド: {item.brand} - 色: {item.color}</p>
        <p className="text-xs text-gray-500 mt-1">取扱サイズ: {availableSizes}</p>
        <p className="text-lg font-bold text-primary my-2">{formatPrice(item.price)}</p>
        <p className={`text-sm font-medium ${totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
          総在庫数: {totalStock}
        </p>
        <p className="text-xs text-gray-600 mt-1 h-10 overflow-hidden text-ellipsis" title={item.description || "商品説明なし。"}>{item.description || "商品説明なし。"}</p>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col space-y-2">
        <button 
          onClick={handleQuickAddClick} 
          className="w-full px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300"
          disabled={orderableVariants.length === 0}
          aria-label={`${item.name}を注文に追加`}
        >
          注文に追加
        </button>
        <div className="flex justify-end space-x-2">
          <button onClick={onEdit} className="px-3 py-1 text-sm font-medium text-white bg-secondary rounded-md hover:bg-secondary/90 transition-colors">編集</button>
          <button onClick={onDelete} className="px-3 py-1 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 transition-colors">削除</button>
        </div>
      </div>
      {orderableVariants.length > 1 && (
        <Modal
          isOpen={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          title={`「${item.name}」のサイズを選択`}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">注文に追加するサイズを選択してください:</p>
            {orderableVariants.map(variant => (
              <button
                key={variant.size}
                onClick={() => handleVariantSelectForOrder(variant)}
                className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                サイズ: {variant.size} (在庫: {variant.stock})
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};


interface InventoryListProps {
  inventory: ClothingItem[];
  onDeleteItem: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ inventory, onDeleteItem }) => {
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Allow empty string for "all"
  const [selectedGender, setSelectedGender] = useState<string>(''); // Allow empty string for "all"
  const navigate = useNavigate();

  const handleDeleteClick = (item: ClothingItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const uniqueBrands = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];
    const brands = inventory.map(item => item.brand.trim()).filter(brand => brand !== '');
    return [...new Set(brands)].sort((a, b) => a.localeCompare(b, 'ja'));
  }, [inventory]);
  
  const genderOptionsForFilter = useMemo(() => {
    if (selectedCategory) {
      const catEnumKey = Object.keys(ClothingCategory).find(key => ClothingCategory[key as keyof typeof ClothingCategory] === selectedCategory) as keyof typeof ClothingCategory | undefined;
      if (catEnumKey && CATEGORIES_flexible_GENDER.includes(ClothingCategory[catEnumKey])) {
        return [Gender.UNISEX, Gender.NOT_APPLICABLE];
      }
    }
    return [Gender.MENS, Gender.WOMENS, Gender.UNISEX]; // Default for categories needing separation or if no category selected
  }, [selectedCategory]);

  useEffect(() => {
    // Reset gender if it becomes incompatible with selected category
    if (selectedCategory && selectedGender) {
        if (!genderOptionsForFilter.includes(selectedGender as Gender)) {
            setSelectedGender(''); // Reset to "all"
        }
    }
  }, [selectedCategory, selectedGender, genderOptionsForFilter]);


  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesGender = selectedGender ? item.gender === selectedGender : true;
      const matchesBrand = selectedBrand ? item.brand === selectedBrand : true;
      const matchesSearch = searchTerm ? 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      return matchesCategory && matchesGender && matchesBrand && matchesSearch;
    });
  }, [inventory, searchTerm, selectedBrand, selectedCategory, selectedGender]);

  const handleQuickAddToOrder = useCallback((item: ClothingItem, variant: ClothingItemVariant) => {
    navigate('/orders/new', { 
        state: { 
            quickAddItem: { 
                itemId: item.id, 
                size: variant.size,
                name: item.name,
                price: item.price,
                stock: variant.stock 
            } 
        } 
    });
  }, [navigate]);

  if (inventory.length === 0 && !searchTerm && !selectedBrand && !selectedCategory && !selectedGender) {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">在庫商品がありません</h3>
        <p className="mt-1 text-sm text-gray-500">新しい商品を追加して始めましょう。</p>
        <div className="mt-6">
          <Link
            to="/inventory/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新規商品追加
          </Link>
        </div>
      </div>
    );
  }
  
  const commonInputClasses = "pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary w-full focus:bg-primary focus:text-white focus:placeholder-gray-200";
  const commonSelectClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm focus:bg-primary focus:text-white";

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">在庫一覧</h1>
        <div className="flex items-center space-x-2 relative flex-grow md:flex-grow-0 max-w-sm">
            <input 
                type="text"
                placeholder="商品名、ブランド、カテゴリー等で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={commonInputClasses}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
            </div>
        </div>
        <Link to="/inventory/new" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center">
         <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          新規商品追加
        </Link>
      </div>

      <div className="mb-6 p-4 bg-white shadow rounded-lg space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">絞り込み条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">カテゴリー</label>
                <select 
                    id="filter-category" 
                    value={selectedCategory} 
                    onChange={(e) => {setSelectedCategory(e.target.value); setSelectedGender('');}} // Reset gender when category changes
                    className={commonSelectClasses}
                >
                    <option value="">すべてのカテゴリー</option>
                    {ALL_CLOTHING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filter-gender" className="block text-sm font-medium text-gray-700">性別</label>
                <select 
                    id="filter-gender" 
                    value={selectedGender} 
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className={commonSelectClasses}
                    disabled={!selectedCategory && GENDER_OPTIONS.length === genderOptionsForFilter.length} // Disable if no category and showing all gender options
                >
                    <option value="">すべて</option>
                    {genderOptionsForFilter.map(gen => <option key={gen} value={gen}>{gen}</option>)}
                </select>
            </div>
        </div>
         {uniqueBrands.length > 0 && (
            <div>
                <div className="flex justify-between items-center mt-4 mb-2">
                    <h3 className="text-md font-semibold text-gray-700">ブランド</h3>
                    {selectedBrand && (
                    <button 
                        onClick={() => setSelectedBrand(null)}
                        className="text-sm text-primary hover:underline"
                    >
                        すべてのブランドを表示
                    </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {uniqueBrands.map(brand => (
                    <button 
                        key={brand} 
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors
                        ${selectedBrand === brand 
                            ? 'bg-primary text-white ring-2 ring-primary/50' 
                            : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    >
                        {brand}
                    </button>
                    ))}
                </div>
            </div>
        )}
      </div>
      
      {filteredInventory.length === 0 && (inventory.length > 0 || searchTerm || selectedBrand || selectedCategory || selectedGender) && (
         <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">該当する商品が見つかりません</h3>
            <p className="mt-1 text-sm text-gray-500">検索条件を変更するか、フィルターをクリアしてください。</p>
         </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredInventory.map(item => (
          <InventoryListItem 
            key={item.id} 
            item={item} 
            onEdit={() => navigate(`/inventory/edit/${item.id}`)}
            onDelete={() => handleDeleteClick(item)}
            onQuickAddToOrder={handleQuickAddToOrder}
          />
        ))}
      </div>
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="削除の確認"
        footer={
          <>
            <button onClick={() => setItemToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90">削除</button>
          </>
        }
      >
        <p className="text-gray-600">本当に「{itemToDelete?.name}」を削除しますか？この操作は元に戻せません。</p>
      </Modal>
    </div>
  );
};

export default InventoryList;
