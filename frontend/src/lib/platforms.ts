import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Youtube, Hash, Building2, Twitter, Search, BarChart3 } from 'lucide-react';

export type PlatformId = 'facebook' | 'instagram' | 'threads' | 'x' | 'google' | 'youtube' | 'gsc' | 'ga';

export interface PlatformDef {
  id: PlatformId;
  name: string;
  icon: LucideIcon;
  brand: string;      // brand color
  bg: string;         // background gradient/solid hex tokens
  accent: string;     // accent color (text-on-brand)
  description: string;
}

export const PLATFORMS: PlatformDef[] = [
  { id: 'facebook',  name: 'Facebook',           icon: Facebook,   brand: '#1877F2', bg: 'linear-gradient(135deg,#1877F2,#0E54B8)', accent: '#fff', description: 'Pages, groups, scheduled posts' },
  { id: 'instagram', name: 'Instagram',          icon: Instagram,  brand: '#E4405F', bg: 'linear-gradient(135deg,#FFB75E,#E4405F 45%,#7C2BFF)', accent: '#fff', description: 'Feed, stories, reels' },
  { id: 'threads',   name: 'Threads',            icon: Hash,       brand: '#0F172A', bg: 'linear-gradient(135deg,#1F2937,#000)', accent: '#fff', description: 'Conversation-first posts' },
  { id: 'x',         name: 'X',                  icon: Twitter,    brand: '#0F172A', bg: 'linear-gradient(135deg,#0F172A,#000)', accent: '#fff', description: 'Short-form posts' },
  { id: 'google',    name: 'Google Business',    icon: Building2,  brand: '#4285F4', bg: 'linear-gradient(135deg,#4285F4,#34A853 45%,#FBBC05 80%,#EA4335)', accent: '#fff', description: 'GBP posts, offers, events' },
  { id: 'youtube',   name: 'YouTube',            icon: Youtube,    brand: '#FF0000', bg: 'linear-gradient(135deg,#FF0000,#B70000)', accent: '#fff', description: 'Videos, Shorts, community posts' },
  { id: 'gsc',       name: 'Search Console',     icon: Search,     brand: '#4285F4', bg: 'linear-gradient(135deg,#4285F4,#1F4FA1)', accent: '#fff', description: 'Impressions, clicks, queries' },
  { id: 'ga',        name: 'Google Analytics',   icon: BarChart3,  brand: '#F59E0B', bg: 'linear-gradient(135deg,#F59E0B,#D97706)', accent: '#fff', description: 'Sessions, conversions, sources' },
];

export const PUBLISHABLE_PLATFORMS = PLATFORMS.filter(p => !['gsc','ga'].includes(p.id));

export function platformDef(id: string): PlatformDef | undefined {
  return PLATFORMS.find(p => p.id === id);
}
