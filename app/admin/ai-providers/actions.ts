"use server";

import { setActiveAiSetting } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function saveAiSetting(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") || "");
  const model = String(formData.get("model") || "");
  if (!provider || !model) return;
  await setActiveAiSetting(provider, model);
  revalidatePath("/admin/ai-providers");
}
