import React from 'react';
import { Property, UserRole } from '../types';
import { X, MapPin, Video, Heart } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-[95%] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 line-clamp-1">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

interface VRModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
}

export const VRModal: React.FC<VRModalProps> = ({ isOpen, onClose, videoUrl }) => {
  if (!isOpen || !videoUrl) return null;

  const getYoutubeEmbed = (url: string) => {
    // Regex to capture video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const youtubeEmbed = getYoutubeEmbed(videoUrl);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="VR Tour / Video Walkthrough">
      <div className="relative pt-[56.25%] bg-black rounded overflow-hidden">
        {youtubeEmbed ? (
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={youtubeEmbed}
            title="VR View"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <video className="absolute top-0 left-0 w-full h-full" controls src={videoUrl}>
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </BaseModal>
  );
};

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, latitude, longitude }) => {
  if (!isOpen) return null;
  
  const mapSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="360° Map View">
      <div className="w-full h-64 md:h-96 bg-gray-200 rounded overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapSrc}
          title="Map View"
        ></iframe>
      </div>
    </BaseModal>
  );
};

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onVR: () => void;
  onMap: () => void;
  onToggleLike?: () => void;
  isLiked?: boolean;
  role: UserRole;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  property,
  onVR,
  onMap,
  onToggleLike,
  isLiked,
  role
}) => {
  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={property.title}>
      <div className="space-y-6">
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-48 md:h-64 object-cover rounded-lg"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Details</h4>
             <p className="mt-1 text-gray-800"><span className="font-semibold">Type:</span> {property.property_type}</p>
             <p className="text-gray-800"><span className="font-semibold">Furnishing:</span> {property.furnished_type}</p>
             <p className="text-gray-800"><span className="font-semibold">Rating:</span> {property.rating} / 5.0</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Location & Rent</h4>
            <p className="mt-1 text-gray-800"><span className="font-semibold">City:</span> {property.city}</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">₹{property.rent.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></p>
          </div>
        </div>

        <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Description</h4>
            <p className="mt-2 text-gray-600 leading-relaxed">{property.description}</p>
        </div>

        <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Contact</h4>
            <p className="mt-1 text-gray-800 font-mono break-all">{property.owner_email}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button onClick={onVR} className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                <Video size={18} /> VR View
            </button>
            <button onClick={onMap} className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                <MapPin size={18} /> Map View
            </button>
            {role === UserRole.TENANT && onToggleLike && (
                <button 
                  onClick={onToggleLike}
                  className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 border rounded transition ${isLiked ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    {isLiked ? 'Liked' : 'Like'}
                </button>
            )}
        </div>
      </div>
    </BaseModal>
  );
};
