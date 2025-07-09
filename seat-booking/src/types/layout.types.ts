export interface LayoutData {
  id: string;
  name: string;
  type: 'grid' | 'svg' | 'designer';
  content: string;
  timestamp: Date;
  metadata?: {
    rows?: number;
    cols?: number;
    seatSize?: number;
    viewBox?: string;
  };
}

export interface BackgroundImage {
  element: SVGImageElement;
  visible: boolean;
  url: string;
}

export interface SavedLayout {
  key: string;
  name: string;
  data: string;
  timestamp: string;
}