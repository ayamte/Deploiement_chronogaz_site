import { Star } from 'lucide-react';

const StarRating = ({ rating, setRating, label, icon: Icon }) => {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Icon size={20} style={{color: '#4DAEBD'}} />
          <span className="font-medium text-gray-800">{label}</span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-all hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {rating === 0 && 'Cliquez pour évaluer'}
          {rating === 1 && 'Très insatisfait'}
          {rating === 2 && 'Insatisfait'}
          {rating === 3 && 'Correct'}
          {rating === 4 && 'Satisfait'}
          {rating === 5 && 'Très satisfait'}
        </div>
      </div>
    );
  };
export default StarRating;  