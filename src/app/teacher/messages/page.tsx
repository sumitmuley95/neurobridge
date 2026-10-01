"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { getTeacherInbox, getTeacherThread, teacherSendMessage } from "@/app/actions/messages";
import { ChatThread } from "@/components/messages/ChatThread";

type Inbox = Awaited<ReturnType<typeof getTeacherInbox>>;

export default function TeacherMessagesPage() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [studentId, setStudentId] = useState("");

  const reload = useCallback(() => {
    getTeacherInbox().then((i) => {
      setInbox(i);
      setStudentId((cur) => {
        if (cur) return cur;
        const first = i.conversations.find((c) => c.unread > 0) ?? i.conversations.find((c) => c.lastMessage) ?? i.conversations.find((c) => c.hasParent);
        return first?.studentId ?? "";
      });
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const load = useCallback(async () => {
    const msgs = await getTeacherThread(studentId);
    reload(); // unread counts change once a thread is opened
    return msgs;
  }, [studentId, reload]);
  const send = useCallback((t: string) => teacherSendMessage(studentId, t), [studentId]);

  const active = inbox?.conversations.find((c) => c.studentId === studentId);

  return (
    <div className="space-y-6">
      <Link href="/teacher/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground min-h-11">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold font-heading">Messages with parents</h1>

      {inbox === null && <p className="text-sm text-muted-foreground">Loading…</p>}

      {inbox && (
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
          <nav aria-label="Conversations" className="bg-card border-2 border-border rounded-3xl p-2 max-h-[520px] overflow-y-auto">
            {inbox.conversations.length === 0 && <p className="p-3 text-sm text-muted-foreground">No students at your school yet.</p>}
            <ul className="space-y-1">
              {inbox.conversations.map((c) => (
                <li key={c.studentId}>
                  <button
                    type="button"
                    disabled={!c.hasParent}
                    onClick={() => setStudentId(c.studentId)}
                    aria-current={c.studentId === studentId ? "true" : undefined}
                    className={`w-full text-left rounded-2xl p-3 min-h-12 flex items-start gap-3 transition-colors disabled:opacity-60 ${
                      c.studentId === studentId ? "bg-teacher-soft" : "hover:bg-muted"
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 text-teacher shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm truncate">{c.parentName ?? "Parent"}</span>
                        {c.unread > 0 && (
                          <span className="text-xs font-bold bg-teacher text-teacher-foreground rounded-full px-2 py-0.5">
                            {c.unread}
                            <span className="sr-only"> unread</span>
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">About {c.studentName}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {c.hasParent ? c.lastMessage ?? "No messages yet" : "Parent hasn't logged in yet"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {active && active.hasParent ? (
            <ChatThread
              key={active.studentId}
              load={load}
              send={send}
              title={`${active.parentName ?? "Parent"} — about ${active.studentName}`}
              subtitle="Only you and this parent can see these messages."
              placeholder="Write to the parent…"
              accent="teacher"
            />
          ) : (
            <div className="bg-card border-2 border-border rounded-3xl p-6 text-sm text-muted-foreground">Choose a conversation.</div>
          )}
        </div>
      )}
    </div>
  );
}
