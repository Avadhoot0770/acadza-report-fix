"use client";

import React, { useState } from "react";
import { AlertCircle, Edit3, Save, X } from "lucide-react";
import { EditableField, ProposedEdit, Taxonomy } from "@/types";

interface CustomEditModalProps {
  isOpen: boolean;
  questionId: string;
  repairKey: string;
  taxonomy: Taxonomy;
  initialEdit?: ProposedEdit | null;
  onSave: (edit: ProposedEdit, note: string) => void;
  onCancel: () => void;
}

export function CustomEditModal({
  isOpen,
  questionId,
  repairKey,
  taxonomy,
  initialEdit,
  onSave,
  onCancel,
}: CustomEditModalProps) {
  const repairConfig = taxonomy.repairs[repairKey];
  const allowedFields = (repairConfig?.fields || []) as EditableField[];

  const [selectedField, setSelectedField] = useState<EditableField>(
    (initialEdit?.field as EditableField) || allowedFields[0] || "question"
  );
  const [findValue, setFindValue] = useState<string>(
    initialEdit?.find !== undefined
      ? typeof initialEdit.find === "object"
        ? JSON.stringify(initialEdit.find)
        : String(initialEdit.find)
      : ""
  );
  const [replaceValue, setReplaceValue] = useState<string>(
    initialEdit?.replace !== undefined
      ? typeof initialEdit.replace === "object"
        ? JSON.stringify(initialEdit.replace)
        : String(initialEdit.replace)
      : ""
  );
  const [facultyNote, setFacultyNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!replaceValue.trim()) {
      setError("Replacement value cannot be empty.");
      return;
    }
    if (!facultyNote.trim()) {
      setError("Please provide a brief faculty rationale / note for this custom edit.");
      return;
    }

    // Parse replace value if answer field and looks like array/number
    let parsedReplace: any = replaceValue.trim();
    if (selectedField === "answer") {
      if (
        (parsedReplace.startsWith("[") && parsedReplace.endsWith("]")) ||
        (parsedReplace.startsWith("{") && parsedReplace.endsWith("}"))
      ) {
        try {
          parsedReplace = JSON.parse(parsedReplace);
        } catch {
          // keep as string
        }
      } else if (!isNaN(Number(parsedReplace)) && parsedReplace !== "") {
        parsedReplace = Number(parsedReplace);
      }
    }

    const customEdit: ProposedEdit = {
      field: selectedField,
      find: findValue ? findValue : undefined,
      replace: parsedReplace,
    };

    onSave(customEdit, facultyNote.trim());
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Faculty Custom Fix Authoring
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
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Repair and allowed fields badge */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Selected Repair:</span>
              <span className="font-mono font-bold text-indigo-700">
                {repairKey}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Allowed Scope:</span>
              <span className="font-mono text-slate-700">
                [{allowedFields.join(", ")}]
              </span>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Target Field to Modify:
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value as EditableField)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {allowedFields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Find (optional for stem/solution replacements) */}
          {selectedField !== "answer" && selectedField !== "questionType" && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Target String to Replace (Find - optional):
              </label>
              <textarea
                rows={2}
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Leave blank to overwrite the entire field, or enter exact target substring..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Replacement Value */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Verified Replacement Content:
            </label>
            <textarea
              rows={3}
              value={replaceValue}
              onChange={(e) => setReplaceValue(e.target.value)}
              placeholder="Enter verified replacement string, MathML snippet, or answer key value..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Faculty Rationale */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Faculty Rationale & Notes (required for audit log):
            </label>
            <input
              type="text"
              value={facultyNote}
              onChange={(e) => setFacultyNote(e.target.value)}
              placeholder="e.g. Corrected typo per NCERT Chapter 4 textbook conventions..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 font-sans text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

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
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span>Apply Custom Fix</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
