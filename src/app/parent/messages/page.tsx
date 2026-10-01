"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getParentMessaging, getParentThread, parentSendMessage } from "@/app/actions/messages";
import { ChatThread } from "@/components/messages/ChatThread";

type Info = Awaited<ReturnType<typeof getParentMessaging>>;

export default function MessagesPage() {
  const [info, setInfo] = useState<Info | null>(null);
  const [teacherId, setTeacherId] = useState("");

  const reloadInfo = useCallback(() => {
    getParentMessaging().then((i) => {
      setInfo(i);
      setTeacherId((cur) => cur || (i.allowed && i.teachers[0]?.id) || "");
    });
  }, []);

  useEffect(() => {
    reloadInfo();
  }, [reloadInfo]);

  const load = useCallback(() => getParentThread(teacherId), [teacherId]);
  const send = useCallback((t: string) => parentSendMessage(teacherId, t), [teacherId]);

  const teacher = info?.allowed ? info.teachers.find((t) => t.id === teacherId) : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground min-h-11">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard
      </Link>

      {info === null && <p className="text-sm text-muted-foreground">Loading…</p>}

      {info && !info.allowed && (
        <div className="p-5 bg-muted border-2 border-border rounded-3xl text-sm text-foreground flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Messaging connects parents with teachers at their child&apos;s school. {info.studentName} is on an individual
            learning account, so there are no teachers to message.
          </span>
        </div>
      )}

      {info?.allowed && (
        <>
          <div className="bg-card border-2 border-border rounded-3xl p-5 space-y-3">
            <h1 className="text-2xl font-bold font-heading">Message a teacher</h1>
            <p className="text-sm text-muted-foreground">
              About {info.studentName}
              {info.schoolName ? ` · ${info.schoolName}` : ""}
            </p>
            {info.teachers.length === 0 ? (
              <p className="text-sm font-semibold">No teachers have been added to your child&apos;s school yet.</p>
            ) : (
              <label className="block text-sm font-semibold max-w-sm">
                Choose a teacher
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="mt-1 w-full border-2 border-border rounded-xl px-3 min-h-12 text-sm bg-card"
                >
                  {info.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.unread ? ` (${t.unread} new)` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {teacher && (
            <ChatThread
              key={teacher.id}
              load={load}
              send={send}
              onSent={reloadInfo}
              title={`Conversation with ${teacher.name}`}
              subtitle={`Only you and ${teacher.name} can see these messages.`}
              placeholder={`Write to ${teacher.name}…`}
              accent="parent"
            />
          )}
        </>
      )}
    </div>
  );
}
