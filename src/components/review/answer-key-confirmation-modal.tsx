"use client";

import React, { useState } from "react";
import { AlertOctagon, Check, ShieldAlert, X } from "lucide-react";

interface AnswerKeyConfirmationModalProps {
  isOpen: boolean;
  questionId: string;
  subject: string;
  oldKey: string;
  newKey: string;
  actor: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AnswerKeyConfirmationModal({
  isOpen,
  questionId,
  subject,
  oldKey,
  newKey,
  actor,
  onConfirm,
  onCancel,
}: AnswerKeyConfirmationModalProps) {
  const [calcVerified, setCalcVerified] = useState(false);
  const [auditAcknowledged, setAuditAcknowledged] = useState(false);

  if (!isOpen) return null;

  const canConfirm = calcVerified && auditAcknowledged;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border-2 border-rose-500 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Banner */}
        <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="h-6 w-6 text-white shrink-0" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                HIGH-STAKES ACTION: ANSWER KEY MODIFICATION
              </h3>
              <p className="text-[11px] text-rose-100 font-medium">
                Mandatory Institutional Faculty Verification Required
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-rose-200 hover:text-white hover:bg-rose-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
            <strong className="font-bold block mb-1">
              Scoring Impact Warning:
            </strong>
            Altering this question&apos;s answer key will retroactively impact candidate test scores and percentile rankings across all active test series for JEE/NEET.
          </div>

          {/* Details Table */}
          <div className="rounded-lg border border-slate-200 p-3.5 space-y-2 bg-slate-50/50 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Question ID:</span>
              <span className="font-mono font-bold text-slate-800">{questionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Subject:</span>
              <span className="font-semibold text-slate-800">{subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reviewing Faculty:</span>
              <span className="font-semibold text-slate-800">{actor}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Database Key:</span>
                <span className="font-mono text-base font-bold text-rose-600 line-through">
                  {oldKey}
                </span>
              </div>
              <span className="text-slate-400 font-bold">➔</span>
              <div>
                <span className="text-slate-500 block text-[11px]">New Correct Key:</span>
                <span className="font-mono text-base font-bold text-emerald-600">
                  {newKey}
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={calcVerified}
                onChange={(e) => setCalcVerified(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>
                <strong>Independent Calculation Verified:</strong> I have independently calculated this scientific/mathematical problem from first principles and confirm that <strong>{newKey}</strong> is the only physically and scientifically correct answer.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={auditAcknowledged}
                onChange={(e) => setAuditAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span>
                <strong>Audit Trail Acknowledgment:</strong> I acknowledge that this key modification will be permanently logged under my faculty profile and timestamped in the institutional audit log.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (canConfirm) {
                onConfirm();
              }
            }}
            disabled={!canConfirm}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              canConfirm
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Confirm & Commit Answer Key</span>
          </button>
        </div>
      </div>
    </div>
  );
}
