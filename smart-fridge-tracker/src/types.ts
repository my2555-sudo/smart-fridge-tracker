export interface ItemEvent {
  type: 'added' | 'consumed' | 'discarded';
  at: string; // ISO 时间
}

export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  addedAt: string;     // ISO
  expireAt?: string;   // ISO
  status: 'in' | 'out';
  outReason?: 'consumed' | 'discarded';
  history?: ItemEvent[]; // 兼容：旧数据可为空
}
