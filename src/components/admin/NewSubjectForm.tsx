"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createSubject } from "@/app/actions/curriculum";

const input = "w-full border-2 border-border rounded-xl px-3 py-2 text-sm bg-card min-h-11 focus:outline-none focus:border-primary";

export function NewSubjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await createSubject({ name, emoji, description });
    if (res.success) router.push(`/admin/curriculum/${res.id}`);
    else {
      setError(res.error);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border-2 border-border rounded-3xl p-5 space-y-3">
      <h2 className="font-heading font-bold text-lg">Add a new subject</h2>
      <p className="text-sm text-muted-foreground">
        After creating it you&apos;ll add its lessons (with XP), practice activities, mastery quiz and a screening question.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-[6rem_1fr] gap-3">
        <label className="text-sm font-semibold">
          Emoji
          <input className={input} value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} />
        </label>
        <label className="text-sm font-semibold">
          Subject name
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cooking Basics" required />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        Short description
        <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn?" />
      </label>
      {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
      <button type="submit" disabled={saving || !name.trim()} className="min-h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create subject
      </button>
    </form>
  );
}
