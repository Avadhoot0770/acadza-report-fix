"use client";

import React, { useState } from "react";
import { AlertCircle, Ban, X } from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  questionId: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectionModal({
  isOpen,
  questionId,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(
    "Question stem and keyed answer are scientifically sound as-is (student misunderstanding)."
  );
  const [customReason, setCustomReason] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedReason === "other"
        ? customReason.trim() || "Rejected with no custom note"
        : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-rose-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Reject Report & Retain Question
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Rejecting this proposal keeps the original question stem, options, and answer key unchanged. Please record a rationale for the audit log.
          </p>

          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">
              Rejection Rationale:
            </label>
            <div className="space-y-2">
              {[
                "Question stem and keyed answer are scientifically sound as-is (student misunderstanding).",
                "Non-actionable student comment / display artifact on client device.",
                "Syllabus scope confirmed; question strictly adheres to current JEE/NEET specifications.",
                "Duplicate student report already addressed.",
                "other",
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-800 text-xs">
                    {reason === "other" ? "Custom faculty rationale..." : reason}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                Enter Custom Note:
              </label>
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this proposal was rejected..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-sans text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Ban className="h-4 w-4" />
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
