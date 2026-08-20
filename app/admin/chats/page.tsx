import { getConversations } from '@/lib/server/admin-data';
import { getSessionUser } from '@/lib/server/session';
import { ChatsExplorer } from '@/components/admin/ChatsExplorer';

export const dynamic = 'force-dynamic';

export default async function AdminChatsPage() {
  if (!(await getSessionUser())?.isAdmin) return null;
  const conversations = await getConversations();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">
          Chats <span className="text-secondary/50 font-normal text-lg">· {conversations.length} transcripts</span>
        </h1>
        <p className="mt-1.5 text-sm text-secondary/60">
          Every Groot conversation, newest first. What it refused to answer is the content to-do list.
        </p>
      </div>
      <ChatsExplorer conversations={conversations} />
    </div>
  );
}
