export interface NormalPopupRef {
  open: () => void;
  close: () => void;
}

export enum VipTypeEnum {
  WEEKLY = 1,
  YEARLY = 2,
  MONTHLY = 3,
}

export enum PayItemTypeEnum {
  IAP = 0,
  VIP = 10,
}
