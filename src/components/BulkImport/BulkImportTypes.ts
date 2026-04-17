export interface RawRow {
  rowIndex: number;
  raw: Record<string, unknown>;
}

export interface ParsedRow {
  rowIndex: number;
  Title: string;
  CustomerName: string;
  OrderType: string;
  Status: string;
  SRD: string;
  CloudProvider: string;
  Amount: number;
  AccountID?: string;
  ServiceType?: string;
  OasisNumber?: string;
  OrderReceiveDate?: string;
  CxSCompleteDate?: string;
  ContactPerson?: string;
  ContactNo?: string;
  ContactEmail?: string;
  BillingAddress?: string;
  BillingAccount?: string;
  AccountName?: string;
  AccountLoginEmail?: string;
  OtherAccountInfo?: string;
  CxSRequestNo?: string;
  TID?: string;
  SDNumber?: string;
  PSJob?: string;
  T2T3?: string;
  WelcomeLetter?: string;
  By?: string;
  OrderFormURL?: string;
  Remark?: string;
  SubName?: string;
}

export interface RowError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: ParsedRow[];
  errors: RowError[];
}

export interface ConflictItem {
  importedName: string;
  suggestedName: string;
  suggestedId: number;
  similarity: number;
  resolution: "accept" | "reject" | "pending";
}

export interface FinalRow extends ParsedRow {
  resolvedCustomerName: string;
  resolvedCustomerId?: number;
}

export type ImportRowStatus = "pending" | "importing" | "success" | "error";

export interface ImportProgress {
  rowIndex: number;
  title: string;
  status: ImportRowStatus;
  errorMessage?: string;
}

export type BulkImportStep =
  | "upload"
  | "validation"
  | "conflicts"
  | "preview"
  | "importing";
