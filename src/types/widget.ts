/**
 * Widget Types
 * Type definitions for the AI booking widget
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface BookingDetails {
  service: string;
  date: string;
  time: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface BusinessConfig {
  businessId: string;
  name: string;
  domain: string;
  services: Array<{
    name: string;
    description?: string;
    price?: number | string;
  }>;
  pricing: Record<string, any>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  hours?: string;
  locations?: any[];
  bookingSystem: {
    type: 'mock' | 'calendly' | 'squarespace' | 'aestheticpro' | 'custom';
    calendar?: any[];
    [key: string]: any;
  };
  images: {
    logo?: string;
    hero?: string;
    [key: string]: any;
  };
  navigation?: any;
}

