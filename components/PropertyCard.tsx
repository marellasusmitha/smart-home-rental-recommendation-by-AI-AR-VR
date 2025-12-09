import React from 'react';
import { Property, UserRole } from '../types';
import { MapPin, Video, Eye, Heart, Star, Pencil, Trash2 } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  userRole: UserRole;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
  onViewDetails: (p: Property) => void;
  onViewVR: (p: Property) => void;
  onViewMap: (p: Property) => void;
  onEdit?: (p: Property) => void;
  onDelete?: (id: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  userRole,
  isLiked,
  onToggleLike,
  onViewDetails,
  onViewVR,
  onViewMap,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 flex flex-col h-full border border-gray-100 group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={property.image_url} 
          alt={property.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-800 flex items-center shadow-sm">
           <Star size={12} className="text-yellow-500 mr-1" fill="currentColor" /> {property.rating}
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
          {property.property_type} • {property.furnished_type}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1" title={property.title}>
          {property.title}
        </h3>
        <p className="text-gray-500 text-sm mb-3 flex items-center">
          <MapPin size={14} className="mr-1" /> {property.city}
        </p>
        
        <div className="mt-auto flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-indigo-600">₹{property.rent.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 border-t pt-4">
           <button 
             onClick={() => onViewDetails(property)}
             className="col-span-1 flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 text-xs transition"
             title="Details"
           >
             <Eye size={20} className="mb-1" />
             <span>View</span>
           </button>
           
           <button 
             onClick={() => onViewVR(property)}
             className="col-span-1 flex flex-col items-center justify-center text-gray-600 hover:text-purple-600 text-xs transition"
             title="VR View"
           >
             <Video size={20} className="mb-1" />
             <span>VR</span>
           </button>

           <button 
             onClick={() => onViewMap(property)}
             className="col-span-1 flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 text-xs transition"
             title="Map"
           >
             <MapPin size={20} className="mb-1" />
             <span>Map</span>
           </button>

           {userRole === UserRole.TENANT && onToggleLike && (
             <button 
               onClick={() => onToggleLike(property.id)}
               className={`col-span-1 flex flex-col items-center justify-center text-xs transition ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
               title={isLiked ? 'Unlike' : 'Like'}
             >
               <Heart size={20} className="mb-1" fill={isLiked ? "currentColor" : "none"} />
               <span>{isLiked ? 'Liked' : 'Like'}</span>
             </button>
           )}

           {userRole === UserRole.OWNER && (
             <div className="col-span-1 flex items-center justify-center gap-2">
               {onEdit && (
                 <button 
                  onClick={() => onEdit(property)}
                  className="text-gray-600 hover:text-blue-600 transition"
                  title="Edit"
                 >
                   <Pencil size={18} />
                 </button>
               )}
               {onDelete && (
                 <button 
                  onClick={() => onDelete(property.id)}
                  className="text-gray-600 hover:text-red-600 transition"
                  title="Delete"
                 >
                   <Trash2 size={18} />
                 </button>
               )}
             </div>
           )}
        </div>
      </div>
      
      {/* Footer for Owner info */}
      {userRole === UserRole.TENANT && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
             Listed by: {property.owner_email || 'Verified Agent'}
          </div>
      )}
    </div>
  );
};

export default PropertyCard;
