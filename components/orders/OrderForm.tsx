
import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import { ClothingItem, Order, OrderItem, OUTSOURCING_STORES, OutsourcingStore, OrderStatus } from '../../types'; 
import { CURRENCY_SYMBOL } from '../../constants';

interface OrderFormProps {
  inventory: ClothingItem[];
  onSubmit: (orderData: Omit<Order, 'id' | 'createdAt' | 'totalAmount' | 'status'> & { items: OrderItem[], sourceStore: OutsourcingStore } | Order) => void;
  onCancel: () => void;
  isLoading?: boolean;
  itemToPreload?: { 
    itemId: string;
    size: string;
    name: string;
    price: number;
    stock: number;
  };
  orderToEdit?: Order; // For editing existing orders
}

interface CartItemUi extends OrderItem {
  name: string; 
  itemPrice: number; 
  availableStock: number; 
  originalQuantity?: number; // Used in edit mode
}

interface ItemVariantOptionValue {
    itemId: string;
    size: string;
    price: number;
    name: string;
    stock: number;
}


const OrderForm: React.FC<OrderFormProps> = ({ inventory, onSubmit, onCancel, isLoading, itemToPreload, orderToEdit }) => {
  const isEditMode = !!orderToEdit;
  const [sourceStore, setSourceStore] = useState<OutsourcingStore>(orderToEdit?.sourceStore || OUTSOURCING_STORES[0]);
  const [cartItems, setCartItems] = useState<CartItemUi[]>([]);
  const [selectedVariantJSON, setSelectedVariantJSON] = useState<string>(''); 
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  };
  
  useEffect(() => {
    if (isEditMode && orderToEdit) {
      // Pre-fill cart from orderToEdit
      const initialCart: CartItemUi[] = orderToEdit.items.map(orderItem => {
        const invItem = inventory.find(i => i.id === orderItem.clothingItemId);
        const variant = invItem?.variants.find(v => v.size === orderItem.size);
        const currentStock = variant?.stock || 0;
        // For edit mode, availableStock should consider stock already allocated to this order + current variant stock
        // For simplicity now, just use current variant stock. Real calculation is complex if status is SHIPPED.
        return {
          ...orderItem,
          name: invItem?.name || '不明な商品',
          itemPrice: orderItem.priceAtPurchase,
          // Available stock for editing should be (current variant stock + original quantity in this order)
          // If not shipped, it's just variant.stock
          // This is a simplification; accurate stock for editing shipped orders is complex.
          availableStock: (orderToEdit.status === OrderStatus.SHIPPED ? (currentStock + orderItem.quantity) : currentStock),
          originalQuantity: orderItem.quantity,
        };
      });
      setCartItems(initialCart);
      setSourceStore(orderToEdit.sourceStore);
    } else if (itemToPreload && inventory.length > 0 && !isEditMode) {
      const itemExistsInInventory = inventory.find(invItem => invItem.id === itemToPreload.itemId);
      const variantExists = itemExistsInInventory?.variants.find(v => v.size === itemToPreload.size && v.stock > 0);

      if (variantExists) {
          const alreadyInCart = cartItems.find(ci => ci.clothingItemId === itemToPreload.itemId && ci.size === itemToPreload.size);
          if (!alreadyInCart) {
            setCartItems(prevCart => [
              ...prevCart,
              {
                clothingItemId: itemToPreload.itemId,
                size: itemToPreload.size,
                quantity: 1,
                priceAtPurchase: itemToPreload.price,
                name: itemToPreload.name,
                itemPrice: itemToPreload.price,
                availableStock: variantExists.stock, // Use actual current stock from variant
              }
            ]);
          }
      } else {
        console.warn("Preloaded item or variant not found or out of stock:", itemToPreload);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemToPreload, inventory, orderToEdit, isEditMode]);

  const availableItemVariantsToSelect = useMemo(() => {
    return inventory.flatMap(item =>
      item.variants
        .filter(variant => {
          const inCart = cartItems.find(ci => ci.clothingItemId === item.id && ci.size === variant.size);
          // If in edit mode and the item is in cart, allow re-selection (it will update quantity)
          // If not in cart, must have stock > 0
          return variant.stock > 0 || (inCart && isEditMode);
        })
        .map(variant => ({
          value: JSON.stringify({ 
            itemId: item.id,
            size: variant.size,
            price: item.price,
            name: item.name,
            stock: variant.stock,
          } as ItemVariantOptionValue),
          display: `${item.name} - ${variant.size} (${formatPrice(item.price)}) - 在庫: ${variant.stock}`,
        }))
    );
  }, [inventory, cartItems, isEditMode]);

  const handleAddItemToCart = () => {
    if (!selectedVariantJSON) {
      setErrors(prev => ({ ...prev, cart: '商品とサイズを選択してください。' }));
      return;
    }
    const selectedDetails: ItemVariantOptionValue = JSON.parse(selectedVariantJSON);
    
    // Available stock check
    const inventoryItem = inventory.find(i => i.id === selectedDetails.itemId);
    const variantInInventory = inventoryItem?.variants.find(v => v.size === selectedDetails.size);
    const currentVariantStock = variantInInventory?.stock || 0;

    const existingCartItemIndex = cartItems.findIndex(ci => ci.clothingItemId === selectedDetails.itemId && ci.size === selectedDetails.size);

    if (existingCartItemIndex !== -1) { // Item already in cart, try to increment
      const updatedCartItems = [...cartItems];
      const cartItem = updatedCartItems[existingCartItemIndex];
      // Max quantity for edit mode is complex: current_variant_stock + original_order_quantity for this item
      // Max quantity for new order: current_variant_stock
      const maxAllowedQuantity = isEditMode && orderToEdit?.status === OrderStatus.SHIPPED ? (currentVariantStock + (cartItem.originalQuantity || 0)) : currentVariantStock;

      if (cartItem.quantity < maxAllowedQuantity) {
        updatedCartItems[existingCartItemIndex].quantity += 1;
        setCartItems(updatedCartItems);
        setErrors(prev => ({...prev, cart: undefined}));
      } else {
         setErrors(prev => ({ ...prev, cart: `${selectedDetails.name} - ${selectedDetails.size} の在庫が不足しています。(最大: ${maxAllowedQuantity})` }));
      }
    } else { // New item to cart
      if (currentVariantStock <= 0 && !isEditMode) { // Stricter check for adding new item if not in edit mode
        setErrors(prev => ({ ...prev, cart: `${selectedDetails.name} - ${selectedDetails.size} は在庫切れです。` }));
        return;
      }
      setCartItems([...cartItems, { 
        clothingItemId: selectedDetails.itemId,
        size: selectedDetails.size,
        quantity: 1, 
        priceAtPurchase: selectedDetails.price, 
        name: selectedDetails.name, 
        itemPrice: selectedDetails.price, 
        availableStock: currentVariantStock, // This is current live stock
        originalQuantity: isEditMode ? 0 : undefined, // For new item in edit mode
      }]);
      setErrors(prev => ({...prev, cart: undefined}));
    }
    setSelectedVariantJSON(''); 
  };

  const handleQuantityChange = (itemId: string, itemSize: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity <= 0) { // Keep current quantity if input is invalid or zero/negative
        // Optionally show an error or just ignore
        return;
    }

    setCartItems(cartItems.map(item => {
      if (item.clothingItemId === itemId && item.size === itemSize) {
        const inventoryItem = inventory.find(i => i.id === item.clothingItemId);
        const variantInInventory = inventoryItem?.variants.find(v => v.size === item.size);
        const currentVariantStock = variantInInventory?.stock || 0;
        
        // Max quantity check: For edit mode of a shipped order, max is (current variant stock + original quantity of this item in THIS order).
        // Otherwise (new order, or edit mode of non-shipped order), max is just current variant stock.
        const maxAllowed = (isEditMode && orderToEdit?.status === OrderStatus.SHIPPED && item.originalQuantity !== undefined) 
                            ? currentVariantStock + item.originalQuantity 
                            : currentVariantStock;

        if (newQuantity > maxAllowed) {
          setErrors(prev => ({ ...prev, [`item_${itemId}_${itemSize}`]: `${item.name} - ${item.size} の在庫は残り ${maxAllowed} 点です。` }));
          return { ...item, quantity: maxAllowed };
        }
        setErrors(prev => ({...prev, [`item_${itemId}_${itemSize}`]: undefined}));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleRemoveItemFromCart = (itemId: string, itemSize: string) => {
    setCartItems(cartItems.filter(item => !(item.clothingItemId === itemId && item.size === itemSize)));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.priceAtPurchase * item.quantity), 0);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!sourceStore) newErrors.sourceStore = '仕入先店舗は必須です。';
    if (cartItems.length === 0) newErrors.cart = '注文には最低1つの商品が含まれている必要があります。';
    
    cartItems.forEach(cartItem => {
        const inventoryItem = inventory.find(i => i.id === cartItem.clothingItemId);
        const variantInInventory = inventoryItem?.variants.find(v => v.size === cartItem.size);
        const currentVariantStock = variantInInventory?.stock ?? 0;

        const maxAllowed = (isEditMode && orderToEdit?.status === OrderStatus.SHIPPED && cartItem.originalQuantity !== undefined)
                            ? currentVariantStock + cartItem.originalQuantity
                            : currentVariantStock;

        if (cartItem.quantity > maxAllowed) { 
            newErrors[`item_${cartItem.clothingItemId}_${cartItem.size}`] = `${cartItem.name} - ${cartItem.size} の在庫が不足しています。(最大: ${maxAllowed})`;
        }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).filter(k => newErrors[k] !== undefined).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const orderPayloadItems = cartItems.map(({name, itemPrice, availableStock, originalQuantity, ...item}) => item as OrderItem);
      
      if (isEditMode && orderToEdit) {
        onSubmit({
          ...orderToEdit, // Includes id, createdAt, status
          sourceStore,
          items: orderPayloadItems,
          totalAmount: calculateTotal(), // Recalculate total for edit
        });
      } else {
        onSubmit({
          sourceStore,
          items: orderPayloadItems,
        });
      }
    }
  };

  const commonSelectClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm focus:bg-primary focus:text-white";
  const commonInputClasses = "w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:bg-primary focus:text-white focus:placeholder-gray-200";
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{isEditMode ? '注文を編集' : '新規注文作成'}</h2>
      
      <div>
        <label htmlFor="sourceStore" className="block text-sm font-medium text-gray-700">仕入先店舗 <span className="text-red-500">*</span></label>
        <select 
          name="sourceStore" 
          id="sourceStore" 
          value={sourceStore} 
          onChange={(e) => { setSourceStore(e.target.value as OutsourcingStore); if(errors.sourceStore) setErrors(p => ({...p, sourceStore: ''}));}} 
          className={commonSelectClasses}
          required
        >
          {OUTSOURCING_STORES.map(store => (
            <option key={store} value={store}>{store}</option>
          ))}
        </select>
        {errors.sourceStore && <p className="mt-1 text-xs text-red-500">{errors.sourceStore}</p>}
      </div>

      <div className="border-t border-b border-gray-200 py-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-800">注文商品</h3>
        <div className="flex items-end space-x-2">
          <div className="flex-grow">
            <label htmlFor="selectItemVariant" className="block text-sm font-medium text-gray-700">商品追加</label>
            <select 
              id="selectItemVariant" 
              value={selectedVariantJSON} 
              onChange={(e) => {setSelectedVariantJSON(e.target.value); setErrors(prev => ({...prev, cart: undefined}));}}
              className={commonSelectClasses}
              disabled={availableItemVariantsToSelect.length === 0 && !isEditMode } 
            >
              <option value="">-- 商品とサイズを選択 --</option>
              {availableItemVariantsToSelect.map(variantOpt => (
                <option key={variantOpt.value} value={variantOpt.value}>
                  {variantOpt.display}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleAddItemToCart} className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors text-sm" disabled={!selectedVariantJSON}>カートに追加</button>
        </div>
        {errors.cart && <p className="text-xs text-red-500">{errors.cart}</p>}

        {cartItems.length === 0 && <p className="text-sm text-gray-500">カートに商品がありません。</p>}
        {cartItems.length > 0 && (
          <div className="mt-4 space-y-3">
            {cartItems.map(item => (
              <div key={`${item.clothingItemId}-${item.size}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium text-gray-700">{item.name} - サイズ: {item.size}</p>
                  <p className="text-sm text-gray-500">{formatPrice(item.priceAtPurchase)} /点</p>
                  {errors[`item_${item.clothingItemId}_${item.size}`] && <p className="text-xs text-red-500">{errors[`item_${item.clothingItemId}_${item.size}`]}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    value={item.quantity} 
                    min="1"
                    // max logic is handled by validation and quantity change handler
                    onChange={(e) => handleQuantityChange(item.clothingItemId, item.size, e.target.value)}
                    className={commonInputClasses}
                    aria-label={`数量 ${item.name} ${item.size}`}
                  />
                  <button type="button" onClick={() => handleRemoveItemFromCart(item.clothingItemId, item.size)} className="text-accent hover:text-red-700 transition-colors" aria-label={`${item.name} ${item.size} を削除`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-right">
        <p className="text-xl font-semibold text-gray-800">合計: {formatPrice(calculateTotal())}</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors" disabled={isLoading}>
          キャンセル
        </button>
        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50" disabled={isLoading || cartItems.length === 0}>
          {isLoading ? (isEditMode ? '更新中...' : '注文処理中...') : (isEditMode ? '変更を保存' : '注文を確定する')}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;
