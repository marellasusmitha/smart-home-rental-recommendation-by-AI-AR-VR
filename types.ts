export enum UserRole {
  TENANT = 'TENANT',
  OWNER = 'OWNER'
}

export enum PropertyType {
  APARTMENT = 'Apartment',
  HOUSE = 'Individual House',
  BHK2 = '2BHK',
  BHK3 = '3BHK',
  STUDIO = 'Studio'
}

export enum FurnishedType {
  FULLY = 'Fully Furnished',
  SEMI = 'Semi Furnished',
  UNFURNISHED = 'Unfurnished'
}

export interface User {
  id: string; // UUID from Supabase
  email: string;
  role: UserRole;
  name?: string;
}

export interface Property {
  id: string;
  owner_id: string; // Foreign Key to User
  owner_email: string; // For display
  title: string;
  description: string;
  city: string;
  property_type: PropertyType | string; // DB uses snake_case
  furnished_type: FurnishedType | string; // DB uses snake_case
  rating: number;
  rent: number;
  image_url: string;
  video_url?: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export interface Notification {
  id: string;
  owner_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

// Helper to map DB snake_case to CamelCase if needed, 
// though for this refactor we will try to use the DB keys directly where possible
// or just mapping types.
