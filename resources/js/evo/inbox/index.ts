export { Attachment } from '@/evo/inbox/Attachment';
export {
    ChannelChip,
    ChannelGlyph,
    inboxChannelIcon,
    inboxChannelLabel,
    normalizeInboxChannel,
} from '@/evo/inbox/channel';
export { ChannelFilter } from '@/evo/inbox/ChannelFilter';
export { CANNED_TEMPLATES, templatesForChannel } from '@/evo/inbox/canned';
export { Composer, InboxComposer } from '@/evo/inbox/Composer';
export { ConversationList } from '@/evo/inbox/ConversationList';
export { ConversationRow, InboxConversationRow } from '@/evo/inbox/ConversationRow';
export { InboxWorkspace } from '@/evo/inbox/InboxWorkspace';
export { InboxMessageThread, MessageBubble, MessageThread } from '@/evo/inbox/MessageThread';
export { InboxFolderRail, QueueNavigation } from '@/evo/inbox/QueueNavigation';
export {
    deskMessageToInbox,
    deskThreadToConversation,
    outboundReplyToConversation,
} from '@/evo/inbox/adapters';
export { crmContextFromInbox } from '@/evo/inbox/context';
export {
    formatInboxClock,
    formatInboxDay,
    formatInboxWhen,
    inboxDayKey,
} from '@/evo/inbox/format';
export { inboxMessages } from '@/evo/inbox/messages';
export {
    inboxContactName,
    inboxInitials,
    participantFromLegacy,
} from '@/evo/inbox/names';
export type { InboxContact } from '@/evo/inbox/names';
export {
    InboxCaughtUpMark,
    InboxEmbedSkeleton,
    InboxListHeader,
    InboxPersonMark,
    InboxStatusBanner,
} from '@/evo/inbox/marks';
export type {
    InboxAssignment,
    InboxAttachment,
    InboxChannel,
    InboxComposeMode,
    InboxComposerSubmit,
    InboxConversation,
    InboxMessage,
    InboxParticipant,
    InboxQueueItem,
    InboxTemplate,
} from '@/evo/inbox/types';
