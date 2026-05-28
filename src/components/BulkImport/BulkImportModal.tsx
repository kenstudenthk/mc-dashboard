import React, { useState } from "react";
import { X } from "lucide-react";
import { usePermission } from "../../contexts/PermissionContext";
import { orderService } from "../../services/orderService";
import {
  detectConflicts,
  applyConflictResolutions,
} from "../../services/bulkImportService";
import {
  type Customer,
  normalizeCustomerName,
  resolveOrCreateCustomer,
} from "../../services/customerService";
import {
  type ServiceAccount,
  serviceAccountService,
  normalizeAccountId,
  resolveOrCreateServiceAccount,
} from "../../services/serviceAccountService";
import { normalizeCloudProvider } from "../../services/emailTemplateService";
import type {
  BulkImportStep,
  ConflictItem,
  FinalRow,
  ImportProgress,
  ParsedRow,
  RowError,
  ValidationResult,
} from "./BulkImportTypes";
import { UploadStep } from "./UploadStep";
import { ValidationStep } from "./ValidationStep";
import { ConflictStep } from "./ConflictStep";
import { PreviewStep } from "./PreviewStep";
import { ImportingStep } from "./ImportingStep";

interface Props {
  customers: Customer[];
  onClose: () => void;
  onImportComplete: () => void;
}

const STEP_LABELS: Record<BulkImportStep, string> = {
  upload: "Upload",
  validation: "Validation",
  conflicts: "Review Names",
  preview: "Preview",
  importing: "Importing",
};

const STEP_ORDER: BulkImportStep[] = [
  "upload",
  "validation",
  "conflicts",
  "preview",
  "importing",
];

function StepDots({ step }: { step: BulkImportStep }): React.ReactElement {
  const currentIdx = STEP_ORDER.indexOf(step);
  return (
    <div className="flex items-center gap-1.5">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: i === currentIdx ? "20px" : "6px",
            backgroundColor: i <= currentIdx ? "#078a52" : "#dad4c8",
          }}
        />
      ))}
    </div>
  );
}

export function BulkImportModal({
  customers,
  onClose,
  onImportComplete,
}: Props): React.ReactElement {
  const { userEmail } = usePermission();
  const [step, setStep] = useState<BulkImportStep>("upload");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [finalRows, setFinalRows] = useState<FinalRow[]>([]);
  const [progress, setProgress] = useState<ImportProgress[]>([]);

  const isImporting = step === "importing" && progress.some((p) => p.status === "pending" || p.status === "importing");

  const handleFileParsed = (valid: ParsedRow[], errors: RowError[]): void => {
    setValidationResult({ valid, errors });
    setStep("validation");
  };

  const handleProceedFromValidation = (rows: ParsedRow[]): void => {
    const found = detectConflicts(rows, customers);
    setConflicts(found);
    setStep(found.length > 0 ? "conflicts" : "preview");
    setFinalRows(applyConflictResolutions(rows, []));
  };

  const handleConflictsResolved = (resolved: ConflictItem[]): void => {
    const rows = validationResult?.valid ?? [];
    setFinalRows(applyConflictResolutions(rows, resolved));
    setStep("preview");
  };

  const handleStartImport = async (): Promise<void> => {
    // Pre-pass: resolve or create every unique customer name before touching orders.
    // Sequential (not parallel) so duplicate names in the same batch create only one record.
    const uniqueNames = [
      ...new Set(finalRows.map((r) => r.resolvedCustomerName)),
    ];
    let runtimeCustomers: Customer[] = [...customers];
    const nameToIdMap = new Map<string, number>();
    const failedNames = new Map<string, string>(); // normalizedName → error reason

    for (const name of uniqueNames) {
      try {
        const result = await resolveOrCreateCustomer(
          name,
          userEmail,
          runtimeCustomers,
        );
        nameToIdMap.set(normalizeCustomerName(name), result.id);
        if (result.created) {
          runtimeCustomers = [
            ...runtimeCustomers,
            { id: result.id, Company: result.name, Email: "", Status: "Active" },
          ];
        }
      } catch (e: unknown) {
        const reason = e instanceof Error ? e.message : "Unknown error";
        failedNames.set(normalizeCustomerName(name), reason);
      }
    }

    // SA pre-pass: resolve or create every unique AccountID before touching orders.
    const rowsWithAccount = finalRows.filter((r) => !!r.AccountID?.trim());
    const accountIdToFirstRow = new Map<string, FinalRow>();
    for (const row of rowsWithAccount) {
      const norm = normalizeAccountId(row.AccountID!);
      if (!accountIdToFirstRow.has(norm)) accountIdToFirstRow.set(norm, row);
    }
    let runtimeAccounts: ServiceAccount[] = await serviceAccountService.findAll();
    const accountIdToSaIdMap = new Map<string, number>();
    for (const [normalizedId, row] of accountIdToFirstRow) {
      const provider = normalizeCloudProvider(row.CloudProvider ?? "");
      try {
        const result = await resolveOrCreateServiceAccount(
          row.AccountID!,
          provider,
          userEmail,
          runtimeAccounts,
          {
            CustomerIDId: nameToIdMap.get(normalizeCustomerName(row.resolvedCustomerName)),
            AccountName: row.AccountName,
            LoginEmail: row.AccountLoginEmail,
            PrimaryAccountID: row.BillingAccount,
            OtherAccountInfo: row.OtherAccountInfo,
          },
        );
        accountIdToSaIdMap.set(normalizedId, result.id);
        if (result.created) {
          runtimeAccounts = [
            ...runtimeAccounts,
            { id: result.id, Title: row.AccountID!, Provider: provider, SecondaryID: row.AccountID, AccountStatus: "Active" },
          ];
        }
      } catch {
        // SA resolution failed — order will be created without SAId
      }
    }

    const initial: ImportProgress[] = finalRows.map((r) => ({
      rowIndex: r.rowIndex,
      title: r.Title,
      status: "pending",
    }));
    setProgress(initial);
    setStep("importing");

    for (let i = 0; i < finalRows.length; i++) {
      const row = finalRows[i];
      const normalizedName = normalizeCustomerName(row.resolvedCustomerName);

      if (failedNames.has(normalizedName)) {
        const reason = failedNames.get(normalizedName);
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: "error", errorMessage: `Could not resolve customer "${row.resolvedCustomerName}": ${reason}` }
              : p,
          ),
        );
        continue;
      }

      setProgress((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: "importing" } : p)),
      );
      try {
        await orderService.create(
          {
            Title: row.Title,
            CustomerName: row.resolvedCustomerName,
            CustomerID: nameToIdMap.get(normalizedName),
            OrderType: row.OrderType,
            Status: row.Status,
            SRD: row.SRD,
            CloudProvider: row.CloudProvider,
            Amount: row.Amount,
            AccountID: row.AccountID,
            SAId: row.AccountID ? accountIdToSaIdMap.get(normalizeAccountId(row.AccountID)) : undefined,
            ServiceType: row.ServiceType,
            OasisNumber: row.OasisNumber,
            OrderReceiveDate: row.OrderReceiveDate,
            CxSCompleteDate: row.CxSCompleteDate,
            ContactPerson: row.ContactPerson,
            ContactNo: row.ContactNo,
            ContactEmail: row.ContactEmail,
            BillingAddress: row.BillingAddress,
            BillingAccount: row.BillingAccount,
            AccountName: row.AccountName,
            AccountLoginEmail: row.AccountLoginEmail,
            OtherAccountInfo: row.OtherAccountInfo,
            CxSRequestNo: row.CxSRequestNo,
            TID: row.TID,
            SDNumber: row.SDNumber,
            PSJob: row.PSJob,
            T2T3: row.T2T3,
            WelcomeLetter: row.WelcomeLetter,
            By: row.By,
            OrderFormURL: row.OrderFormURL,
            Remark: row.Remark,
            SubName: row.SubName,
          },
          userEmail,
        );
        setProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "success" } : p)),
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "error", errorMessage: msg } : p,
          ),
        );
      }
    }

    onImportComplete();
  };

  const handleClose = (): void => {
    if (!isImporting) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d1d1f]/06">
          <div className="flex items-center gap-3">
            <div>
              <h2
                className="text-[17px] font-semibold text-[#1d1d1f]"
                style={{ letterSpacing: "-0.17px" }}
              >
                Bulk Import Orders
              </h2>
              <p className="text-xs text-[#9f9b93] mt-0.5">
                {STEP_LABELS[step]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StepDots step={step} />
            <button
              onClick={handleClose}
              disabled={isImporting}
              className="p-1.5 rounded-lg hover:bg-[#f5f5f7] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 text-[#1d1d1f]" />
            </button>
          </div>
        </div>

        {/* Step content */}
        {step === "upload" && <UploadStep onParsed={handleFileParsed} />}
        {step === "validation" && validationResult && (
          <ValidationStep
            result={validationResult}
            onProceed={handleProceedFromValidation}
            onBack={() => setStep("upload")}
          />
        )}
        {step === "conflicts" && (
          <ConflictStep
            conflicts={conflicts}
            onResolved={handleConflictsResolved}
            onBack={() => setStep("validation")}
          />
        )}
        {step === "preview" && (
          <PreviewStep
            rows={finalRows}
            onImport={() => void handleStartImport()}
            onBack={() => setStep(conflicts.length > 0 ? "conflicts" : "validation")}
          />
        )}
        {step === "importing" && (
          <ImportingStep progress={progress} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}
