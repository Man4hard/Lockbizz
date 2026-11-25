import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n";
import { SETUP_STEPS, setupProgress, type SetupSteps } from "@/lib/setup-steps";

export function SetupChecklist({ deviceId, steps }: { deviceId: string; steps: unknown }) {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const current = (steps && typeof steps === "object" ? steps : {}) as SetupSteps;
  const { done, total } = setupProgress(current);
  const m = useMutation({
    mutationFn: async (next: SetupSteps) => {
      const { error } = await supabase.from("devices").update({ setup_steps: next }).eq("id", deviceId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <details className="rounded-lg border border-border p-3" open={done < total}>
      <summary className="cursor-pointer text-sm font-semibold">
        {lang === "ur" ? "سیٹ اپ چیک لسٹ" : "Setup checklist"} · {done}/{total}
      </summary>
      <ul className="mt-2 space-y-2">
        {SETUP_STEPS.map((s) => (
          <li key={s.key}>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={current[s.key] === true}
                disabled={m.isPending}
                onCheckedChange={(v) => m.mutate({ ...current, [s.key]: v === true })}
              />
              {s[lang]}
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}
