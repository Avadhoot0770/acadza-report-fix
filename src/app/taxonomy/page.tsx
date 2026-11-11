import { loadTaxonomy } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Layers, ShieldCheck, Check, X } from "lucide-react";

export default function TaxonomyPage() {
  const taxonomy = loadTaxonomy();

  return (
    <>
      <Header
        title="Taxonomy & Repair Policy"
        subtitle="Source of truth for all triage verdicts, repair scopes, and auto-apply permission boundaries."
      />

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* About Card */}
        <div className="p-5 rounded-xl border border-blue-200/70 bg-blue-50/50 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-blue-600 mt-1 shrink-0" />
          <div className="text-xs space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">
              Closed List Principle & Safety Boundaries
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {taxonomy._about}
            </p>
          </div>
        </div>

        {/* Closed Verdicts */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Allowed Taxonomy Verdicts ({Object.keys(taxonomy.verdicts).length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(taxonomy.verdicts).map(([key, desc]) => (
              <div
                key={key}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {key}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Allowed Repairs */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Allowed Taxonomy Repairs & Scopes ({Object.keys(taxonomy.repairs).length})
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Repair Key</th>
                  <th className="py-3 px-4">Allowed Fields</th>
                  <th className="py-3 px-4">Auto Policy</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(taxonomy.repairs).map(([key, item]) => (
                  <tr key={key} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {key}
                    </td>
                    <td className="py-3 px-4">
                      {item.fields.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {item.fields.map((f) => (
                            <span
                              key={f}
                              className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None (authored)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.auto ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="h-3 w-3" />
                          auto: true
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <X className="h-3 w-3" />
                          auto: false (Human)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
