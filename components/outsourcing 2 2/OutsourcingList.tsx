
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OutsourcingRecord, OutsourcingStatus, ALL_OUTSOURCING_STATUSES } from '../../types';

interface OutsourcingListProps {
  records: OutsourcingRecord[];
  onUpdateStatus: (recordId: string, status: OutsourcingStatus) => void;
  onDeleteRecord?: (id: string) => void; 
}

const OutsourcingListItem: React.FC<{ record: OutsourcingRecord; onUpdateStatus: (recordId: string, status: OutsourcingStatus) => void; onDelete?: (id: string) => void }> = ({ record, onUpdateStatus, onDelete }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: OutsourcingStatus) => {
    switch (status) {
      case OutsourcingStatus.OUTSOURCED: return 'bg-yellow-100 text-yellow-800';
      case OutsourcingStatus.RECEIVED_BY_STORE: return 'bg-blue-100 text-blue-800';
      case OutsourcingStatus.RETURNED_TO_SUPPLIER: return 'bg-indigo-100 text-indigo-800';
      case OutsourcingStatus.SHIPPED_TO_SELLER: return 'bg-purple-100 text-purple-800'; // New color for shipped to seller
      case OutsourcingStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden flex flex-col">
      <div className="h-40 w-full overflow-hidden bg-gray-100">
        {record.imageUrl ? (
          <img src={record.imageUrl} alt={record.itemName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
        )}
      </div>
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 truncate" title={record.itemName}>
              {record.itemName}
            </h3>
            <p className="text-sm text-gray-600">受取人/委託先: {record.recipientName}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
            {record.status}
          </span>
        </div>
         <p className="text-sm text-gray-500 mb-2">委託元店舗: {record.outsourcingStore}</p>
        
        <div className="mt-3">
          <p className="text-sm text-gray-500">数量: {record.quantity}</p>
          <p className="text-xs text-gray-500">委託日: {new Date(record.dateOutsourced).toLocaleDateString('ja-JP')}</p>
          {record.itemDescription && <p className="text-xs text-gray-500 mt-1">説明: {record.itemDescription}</p>}
          {record.notes && <p className="text-xs text-gray-500 mt-1">備考: {record.notes}</p>}
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between space-x-2">
            <label htmlFor={`outsourcing-status-${record.id}`} className="text-sm font-medium text-gray-700 whitespace-nowrap">ステータス:</label>
            <select 
              id={`outsourcing-status-${record.id}`}
              value={record.status} 
              onChange={(e) => onUpdateStatus(record.id, e.target.value as OutsourcingStatus)}
              className="w-full px-2 py-1 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
            >
              {ALL_OUTSOURCING_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
        </div>
        <div className="flex justify-end space-x-2">
            <button 
                onClick={() => navigate(`/outsourcing/edit/${record.id}`)} 
                className="px-3 py-1 text-sm font-medium text-white bg-secondary rounded-md hover:bg-secondary/90 transition-colors"
            >
                編集
            </button>
            {onDelete && (
                <button 
                    onClick={() => onDelete(record.id)} 
                    className="px-3 py-1 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent/90 transition-colors"
                >
                    削除
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

const OutsourcingList: React.FC<OutsourcingListProps> = ({ records, onUpdateStatus, onDeleteRecord }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">委託記録がありません</h3>
        <p className="mt-1 text-sm text-gray-500">新しい委託記録を追加して始めましょう。</p>
        <div className="mt-6">
          <Link
            to="/outsourcing/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
             <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新規委託記録追加
          </Link>
        </div>
      </div>
    );
  }
  
  const sortedRecords = [...records].sort((a,b) => new Date(b.dateOutsourced).getTime() - new Date(a.dateOutsourced).getTime());

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">委託記録一覧</h1>
        <Link to="/outsourcing/new" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          新規委託記録追加
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRecords.map(record => (
          <OutsourcingListItem 
            key={record.id} 
            record={record}
            onUpdateStatus={onUpdateStatus}
            onDelete={onDeleteRecord}
          />
        ))}
      </div>
    </div>
  );
};

export default OutsourcingList;