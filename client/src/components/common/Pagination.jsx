// components/common/Pagination.js
import React from 'react';
import {
  MdKeyboardArrowLeft as ChevronLeft,
  MdKeyboardArrowRight as ChevronRight
} from 'react-icons/md';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between p-4">
      <div className="text-sm text-gray-700">
        Affichage <span className="font-medium">{startItem}</span> à <span className="font-medium">{endItem}</span> sur <span className="font-medium">{totalItems}</span> résultats
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Précédent
        </button>
        
        {getPageNumbers().map(page => (
          <button
            key={page}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150 ${
              page === currentPage
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        
        <button
          className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Suivant
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;