export interface PageTag {
  profile: string;
  uid: string;
  name: string;
  codeState: 'Configured' | 'Code registered';
  account: string | null;
  environment: string | null;
  version: string | null;
  utid?: string | null;
  profileName?: string | null;
  publishId?: string | null;
  libraryVersion?: string | null;
  publishedTitle?: string | null;
  nameSource?: string;
  initialized: boolean;
  loadingSuppressed: boolean;
  requestUrls: string[];
  senderSource: string | null;
  extensionSources?: string[] | null;
}

export interface PageObservation {
  state: 'Not detected' | 'Initializing' | 'Detected' | 'Unsupported runtime';
  url: string;
  tags: PageTag[];
  resources: string[];
  limits: string[];
  childFrames: {url: string; index: number}[];
}

export interface FrameObservation {
  frameId: number;
  documentId: string;
  observation: PageObservation;
}

export interface TagRow extends PageTag {
  key: string;
  tabId: number;
  frameId: number;
  documentId: string;
  pageUrl: string;
}

export interface CoverageLimit {
  frameId: number;
  url: string;
  reason: string;
}

export interface Inventory {
  frames: FrameObservation[];
  limits: CoverageLimit[];
}
