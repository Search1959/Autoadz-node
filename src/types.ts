export type UserRole = "advertiser" | "driver" | "admin";

export type CampaignStatus = "pending" | "active" | "completed";

export interface Campaign {
  id: string;
  title: string;
  client: string;
  city: string;
  area: string;
  budget: number;
  autosCount: number;
  creativeUrl: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  kmsCovered: number;
  qrScans: number;
  gpsRoute: Array<{ lat: number; lng: number }>;
}

export type DriverStatus = "pending_approval" | "active" | "rejected";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  autoNumber: string;
  location: string;
  state: "offline" | "online" | "tracking";
  kycVerified: boolean;
  totalEarnings: number;
  walletBalance: number;
  currentCampaignId: string | null;
  status: DriverStatus;
}

export type ProofType = "morning" | "evening" | "installation";

export interface Proof {
  id: string;
  driverId: string;
  driverName: string;
  campaignId: string;
  campaignTitle: string;
  type: ProofType;
  imageUrl: string;
  timestamp: string;
  location: string;
  status: "pending" | "approved" | "rejected";
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "earning" | "payment";
  amount: number;
  status: "pending" | "success" | "failed";
  description: string;
  timestamp: string;
}

export interface Message {
  id: string;
  sender: "user" | "ai" | "support";
  text: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  type: "campaign" | "driver" | "payment" | "system";
}
