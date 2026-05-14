import { MessagesSquare } from 'lucide-react';

export default function InboxView() {
  return (
    <div className="px-8 py-6" data-testid="inbox-view">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">Channels</div>
        <h2 className="font-display text-2xl font-semibold mt-1">Inbox & Replies</h2>
      </div>
      <div className="card-elev p-12 text-center text-ink-300 flex flex-col items-center gap-3">
        <MessagesSquare className="size-10 text-ink-500" />
        <div className="font-semibold">Unified inbox is coming up</div>
        <p className="text-sm max-w-md">Once Facebook & Instagram connections complete business verification, this inbox will surface Messenger & DMs with AI reply suggestions and lead capture.</p>
      </div>
    </div>
  );
}
