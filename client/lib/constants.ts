import { DomainType, TriggerType, TrackingRule } from '../types/index';
import { ShoppingCart, Music, Film, Newspaper, MousePointer, Star, Eye, ArrowDownCircle } from 'lucide-react';

// Mapping DomainType to API type number
export const DOMAIN_TYPE_TO_NUMBER: Record<DomainType, number> = {
  music: 1,
  movie: 2,
  ecommerce: 3,
  news: 4,
  general: 0,
};

export const DOMAIN_OPTIONS: { type: DomainType; label: string; icon: any; description: string }[] = [
  { type: 'music', label: 'Music Streaming', icon: Music, description: 'Track plays, duration, playlists.' },
  { type: 'movie', label: 'Movies & Video', icon: Film, description: 'Track watch %, completion, quality.' },
  { type: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart, description: 'Track cart adds, purchases, views.' },
  { type: 'news', label: 'News & Media', icon: Newspaper, description: 'Track read depth, dwell time.' }
];

export const TRIGGER_ICONS: Record<TriggerType, any> = {
  click: MousePointer,
  rate: Star,
  page_view: Eye,
  scroll: ArrowDownCircle,
};

// Suggestions based on domain
export const DOMAIN_PRESETS: Record<DomainType, Partial<TrackingRule>[]> = {
  music: [
    { name: 'Play Song', trigger: 'click', selector: '.play-btn' },
    { name: 'Add to Playlist', trigger: 'click', selector: '.add-playlist' },
  ],
  movie: [
    { name: 'Start Watch', trigger: 'click', selector: '.watch-now' },
    { name: 'Next Episode', trigger: 'click', selector: '.next-ep' },
  ],
  ecommerce: [
    { name: 'Add To Cart', trigger: 'click', selector: 'button.add-to-cart' },
    { name: 'Product View', trigger: 'view', selector: '.product-detail' },
  ],
  news: [
    { name: 'Read Article', trigger: 'scroll', selector: 'body' }, // Logic usually handled by scroll depth
    { name: 'Share Article', trigger: 'click', selector: '.share-btn' },
  ],
  general: []
};

export const MOCK_SCRIPT_TEMPLATE = (config: any) => `<script>window.__RECSYS_DOMAIN_KEY__ = "${config.uuid}";</script>
<script src="https://cdn.jsdelivr.net/gh/Xaoimiimii/recsys-tracker-module/packages/sdk/dist/loader.js"></script>`;

