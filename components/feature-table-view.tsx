import type { FeatureRow } from "@/lib/feature-table";
import { t, type Lang } from "@/lib/i18n";

export function FeatureTableView({ lang, rows }: { lang: Lang; rows: FeatureRow[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-stone-200 text-left">
            <th className="border border-stone-300 px-3 py-2">{t(lang, "col_screen")}</th>
            <th className="border border-stone-300 px-3 py-2">{t(lang, "col_action")}</th>
            <th className="border border-stone-300 px-3 py-2">{t(lang, "col_expected")}</th>
            <th className="border border-stone-300 px-3 py-2">{t(lang, "col_otherwise")}</th>
            <th className="border border-stone-300 px-3 py-2">{t(lang, "col_importance")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.screen}-${row.action}-${index}`} className="bg-white">
              <td className="border border-stone-300 px-3 py-2 font-medium">{row.screen}</td>
              <td className="border border-stone-300 px-3 py-2">{row.action}</td>
              <td className="border border-stone-300 px-3 py-2">{row.expected}</td>
              <td className="border border-stone-300 px-3 py-2">{row.otherwise}</td>
              <td className="border border-stone-300 px-3 py-2">{row.importance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
