"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/app/actions/messages";

export function ChatThread({
  load,
  send,
  title,
  subtitle,
  placeholder,
  accent = "parent",
  onSent,
}: {
  load: () => Promise<ChatMessage[]>;
  send: (text: string) => Promise<{ success: boolean; error?: string }>;
  title: string;
  subtitle?: string;
  placeholder: string;
  accent?: "parent" | "teacher";
  onSent?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setMessages(await load());
  }, [load]);

  // load now, then check for new messages every 10 seconds
  useEffect(() => {
    let alive = true;
    load().then((m) => alive && setMessages(m));
    const t = setInterval(() => load().then((m) => alive && setMessages(m)), 10000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const res = await send(text);
    if (res.success) {
      setText("");
      await refresh();
      onSent?.();
    } else setError(res.error || "Message not sent.");
    setSending(false);
  };

  const mineCls = accent === "parent" ? "bg-parent text-parent-foreground" : "bg-teacher text-teacher-foreground";

  return (
    <div className="bg-card rounded-3xl border-2 border-border overflow-hidden flex flex-col h-[520px]">
      <div className="p-4 bg-muted/60 border-b-2 border-border">
        <h2 className="font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4" aria-live="polite">
        {messages === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {messages?.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>}
        {messages?.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
            <span className="text-xs text-muted-foreground mb-1 px-1">
              {m.mine ? "You" : m.senderName} ·{" "}
              {new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </span>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                m.mine ? `${mineCls} rounded-br-md` : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="p-3 sm:p-4 bg-muted/60 border-t-2 border-border space-y-2">
        {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="chat-input">Message</label>
          <input
            id="chat-input"
            type="text"
            placeholder={placeholder}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 min-w-0 border-2 border-border rounded-2xl px-4 min-h-12 text-sm bg-card focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Send message"
            className="min-h-12 min-w-12 px-4 rounded-2xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
