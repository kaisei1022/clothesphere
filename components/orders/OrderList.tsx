
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Order, OrderStatus, ClothingItem, OrderItem, ALL_ORDER_STATUSES } from '../../types'; 
import { CURRENCY_SYMBOL } from '../../constants';
import Modal from '../shared/Modal'; 

interface OrderListProps {
  orders: Order[];
  inventory: ClothingItem[]; 
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void; 
}

const OrderListItem: React.FC<{ 
    order: Order; 
    inventory: ClothingItem[]; 
    onUpdateStatus: (orderId: string, status: OrderStatus) => void;
    onDelete: () => void;
}> = ({ order, inventory, onUpdateStatus, onDelete }) => {
  const navigate = useNavigate();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [largeImageUrl, setLargeImageUrl] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED: return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getItemDetails = (orderItem: OrderItem): { name: string; imageUrl: string | null } => {
    const item = inventory.find(i => i.id === orderItem.clothingItemId);
    return {
        name: item ? item.name : '不明な商品',
        imageUrl: item ? item.imageUrl : null
    };
  };

  const handleImageClick = (imageUrl: string | null) => {
    if (imageUrl) {
      setLargeImageUrl(imageUrl);
      setIsImageModalOpen(true);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">注文ID: <span className="font-mono text-sm text-primary">{order.id.substring(0,8)}...</span></h3>
                <p className="text-sm text-gray-600">仕入先店舗: {order.sourceStore}</p>
                <p className="text-xs text-gray-500">注文日: {new Date(order.createdAt).toLocaleDateString('ja-JP')}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
            </span>
        </div>
        
        <div className="mt-4 border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">商品:</h4>
            <ul className="space-y-2 text-sm text-gray-600 max-h-32 overflow-y-auto">
                {order.items.map((item, index) => {
                    const details = getItemDetails(item);
                    return (
                        <li key={`${item.clothingItemId}-${item.size}-${index}`} className="flex items-center space-x-2">
                            {details.imageUrl && (
                                <img 
                                    src={details.imageUrl} 
                                    alt={details.name} 
                                    className="w-10 h-10 object-cover rounded cursor-pointer"
                                    onClick={() => handleImageClick(details.imageUrl)}
                                />
                            )}
                            {!details.imageUrl && (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                            )}
                            <span>{details.name} (サイズ: {item.size}) (x{item.quantity}) - {formatPrice(item.priceAtPurchase * item.quantity)}</span>
                        </li>
                    );
                })}
            </ul>
        </div>

        <p className="text-md font-bold text-primary my-3 text-right">合計: {formatPrice(order.totalAmount)}</p>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
            <label htmlFor={`status-${order.id}`} className="text-sm font-medium text-gray-700">ステータス:</label>
            <select 
              id={`status-${order.id}`}
              value={order.status} 
              onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
              className="px-2 py-1 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
            >
              {ALL_ORDER_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
        </div>
        <div className="flex justify-end space-x-2">
            <button 
                onClick={() => navigate(`/orders/edit/${order.id}`)}
                className="px-3 py-1 text-sm font-medium text-white bg-secondary rounded-md hover:bg-secondary/90 transition-colors"
            >
                編集
            </button>
            <button 
                onClick={onDelete}
                className="px-3 py-1 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 transition-colors"
            >
                削除
            </button>
        </div>
      </div>
      {isImageModalOpen && largeImageUrl && (
        <Modal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          title="商品画像"
        >
          <img src={largeImageUrl} alt="拡大画像" className="w-full h-auto max-h-[80vh] object-contain rounded" />
        </Modal>
      )}
    </div>
  );
};


const OrderList: React.FC<OrderListProps> = ({ orders, inventory, onUpdateOrderStatus, onDeleteOrder }) => {
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">まだ注文がありません</h3>
        <p className="mt-1 text-sm text-gray-500">新しい注文を作成して始めましょう。</p>
        <div className="mt-6">
          <Link
            to="/orders/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
             <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新規注文作成
          </Link>
        </div>
      </div>
    );
  }
  
  const sortedOrders = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">注文一覧</h1>
        <Link to="/orders/new" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          新規注文作成
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedOrders.map(order => (
          <OrderListItem 
            key={order.id} 
            order={order} 
            inventory={inventory}
            onUpdateStatus={onUpdateOrderStatus}
            onDelete={() => handleDeleteClick(order)}
          />
        ))}
      </div>
      <Modal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        title="注文削除の確認"
        footer={
          <>
            <button onClick={() => setOrderToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button onClick={confirmDelete} className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90">削除</button>
          </>
        }
      >
        <p className="text-gray-600">本当に注文ID「{orderToDelete?.id.substring(0,8)}...」を削除しますか？この操作は元に戻せません。在庫は自動調整されません。</p>
      </Modal>
    </div>
  );
};

export default OrderList;
