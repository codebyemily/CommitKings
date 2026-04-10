'use client'

import {
  addPostCommentAction,
  togglePostSaveAction,
  togglePostLikeAction,
} from '@/app/actions/post-engagement'
import {
  getShareConversationItems,
  sharePostToConversation,
  type ShareConversationItem,
} from '@/app/actions/messages'
import { createClient } from '@/lib/supabase/client'
import { getPostImagePublicUrl } from '@/lib/posts/public-url'
import {
  IconBookmark,
  IconBubble,
  IconHeart,
  IconSend,
} from './FeedIcons'
import Image from 'next/image'
import { useCallback, useState } from 'react'

export type CommentRow = {
  id: string
  body: string
  created_at: string
  author_username: string
  author_display_name: string
}

type Props = {
  postId: string
  captionAuthorLabel: string
  shareAuthorUsername: string
  caption: string
  imageSrc: string
  initialLikesCount: number
  initialLiked: boolean
  initialSaved: boolean
  initialCommentsCount: number
}

function formatCommentTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function peerAvatarSrc(path: string | null): string | null {
  if (!path?.trim()) return null
  try {
    return getPostImagePublicUrl(path.trim())
  } catch {
    return null
  }
}

export function FeedPostEngagement({
  postId,
  captionAuthorLabel,
  shareAuthorUsername,
  caption,
  imageSrc,
  initialLikesCount,
  initialLiked,
  initialSaved,
  initialCommentsCount,
}: Props) {
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initialLiked)
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [saved, setSaved] = useState(initialSaved)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [likePending, setLikePending] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [commentPending, setCommentPending] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [shareItems, setShareItems] = useState<ShareConversationItem[]>([])
  const [shareLoading, setShareLoading] = useState(false)
  const [sendingConversationId, setSendingConversationId] = useState<string | null>(
    null,
  )
  const [shareError, setShareError] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    setCommentsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('post_comments')
      .select(
        'id, body, created_at, author_username, author_display_name',
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(80)

    setCommentsLoading(false)
    if (error) {
      console.error('post_comments:', error.message)
      setComments([])
      return
    }
    setComments((data ?? []) as CommentRow[])
  }, [postId])

  const openComments = () => {
    setCommentsSheetOpen(true)
    void loadComments()
  }

  const onLike = () => {
    if (likePending) return
    setLikeError(null)
    const wasLiked = liked
    const previousCount = likesCount
    setLiked(!wasLiked)
    setLikesCount(wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1)
    setLikePending(true)
    void togglePostLikeAction(postId).then((r) => {
      setLikePending(false)
      if (r.ok) {
        setLiked(r.liked)
        setLikesCount(r.likesCount)
      } else {
        setLiked(wasLiked)
        setLikesCount(previousCount)
        setLikeError(r.error)
      }
    })
  }

  const onSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    const text = commentDraft.trim()
    if (!text || commentPending) return
    setCommentError(null)
    setCommentPending(true)
    void addPostCommentAction(postId, text).then((r) => {
      setCommentPending(false)
      if (r.ok) {
        setCommentDraft('')
        setComments((c) => [...c, r.comment])
        setCommentsCount((n) => n + 1)
      } else {
        setCommentError(r.error)
      }
    })
  }

  const onShare = () => {
    if (shareLoading) return
    setShareError(null)
    setShareSheetOpen(true)
    setShareLoading(true)
    void getShareConversationItems().then((r) => {
      setShareLoading(false)
      if (!r.ok) {
        setShareError(r.error)
        return
      }
      setShareItems(r.items)
    })
  }

  const onSave = () => {
    if (savePending) return
    setSaveError(null)
    const wasSaved = saved
    setSaved(!wasSaved)
    setSavePending(true)
    void togglePostSaveAction(postId).then((r) => {
      setSavePending(false)
      if (!r.ok) {
        setSaved(wasSaved)
        setSaveError(r.error)
        return
      }
      setSaved(r.saved)
    })
  }

  const sendToConversation = (conversationId: string) => {
    if (sendingConversationId) return
    setShareError(null)
    setSendingConversationId(conversationId)
    void sharePostToConversation({
      conversationId,
      postId,
      authorUsername: shareAuthorUsername,
      caption,
      imageSrc,
    }).then((r) => {
      setSendingConversationId(null)
      if (!r.ok) {
        setShareError(r.error)
        return
      }
      setShareSheetOpen(false)
    })
  }

  return (
    <div className="feed-post-body">
      <div className="feed-actions">
        <div className="feed-actions-left">
          <button
            type="button"
            className="feed-icon-btn"
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
            disabled={likePending}
            onClick={onLike}
          >
            <IconHeart className="feed-icon-stroke" liked={liked} title="" />
          </button>
          <button
            type="button"
            className="feed-icon-btn"
            aria-label="Comment"
            aria-expanded={commentsSheetOpen}
            onClick={openComments}
          >
            <IconBubble className="feed-icon-stroke" title="" />
          </button>
          <button
            type="button"
            className="feed-icon-btn"
            aria-label="Share"
            disabled={shareLoading}
            onClick={onShare}
          >
            <IconSend className="feed-icon-stroke" title="" />
          </button>
        </div>
        <button
          type="button"
          className="feed-icon-btn"
          aria-label={saved ? 'Unsave' : 'Save'}
          aria-pressed={saved}
          disabled={savePending}
          onClick={onSave}
        >
          <IconBookmark className="feed-icon-stroke" title="" saved={saved} />
        </button>
      </div>

      {likeError ? (
        <p className="feed-like-error" role="alert">
          {likeError}
        </p>
      ) : null}
      {saveError ? (
        <p className="feed-like-error" role="alert">
          {saveError}
        </p>
      ) : null}
      {shareError ? (
        <p className="feed-like-error" role="alert">
          {shareError}
        </p>
      ) : null}

      <p className="feed-likes">
        {likesCount === 1 ? '1 like' : `${likesCount.toLocaleString()} likes`}
      </p>

      <p className="feed-caption">
        <span className="feed-username feed-caption-user">{captionAuthorLabel}</span>{' '}
        <span className="feed-caption-text">{caption}</span>
      </p>

      {commentsCount > 0 && !commentsSheetOpen ? (
        <button
          type="button"
          className="feed-view-comments"
          onClick={openComments}
        >
          View all {commentsCount} comment{commentsCount === 1 ? '' : 's'}
        </button>
      ) : null}

      {commentsSheetOpen ? (
        <div
          className="feed-comments-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Comments"
          onClick={() => setCommentsSheetOpen(false)}
        >
          <div
            className="feed-comments-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="feed-share-grabber" aria-hidden />
            <div className="feed-comments-head">
              <p className="feed-comments-title">
                Comments {commentsCount > 0 ? `(${commentsCount})` : ''}
              </p>
              <button
                type="button"
                className="feed-share-close"
                aria-label="Close comments"
                onClick={() => setCommentsSheetOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="feed-comments-sheet-list">
              {commentsLoading ? (
                <p className="feed-comments-loading">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="feed-comments-empty">No comments yet.</p>
              ) : (
                <ul className="feed-comments-list">
                  {comments.map((c) => (
                    <li key={c.id} className="feed-comment-item">
                      <span className="feed-comment-author">{c.author_display_name}</span>{' '}
                      <span className="feed-comment-body">{c.body}</span>
                      <span className="feed-comment-time">{formatCommentTime(c.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form className="feed-comment-form feed-comment-form-sticky" onSubmit={onSubmitComment}>
              {commentError ? (
                <p className="feed-comment-error" role="alert">
                  {commentError}
                </p>
              ) : null}
              <div className="feed-comment-form-row">
                <label className="sr-only" htmlFor={`comment-${postId}`}>
                  Add a comment
                </label>
                <input
                  id={`comment-${postId}`}
                  type="text"
                  className="feed-comment-input"
                  placeholder="Add a comment…"
                  maxLength={2000}
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  disabled={commentPending}
                />
                <button
                  type="submit"
                  className="feed-comment-submit"
                  disabled={commentPending || !commentDraft.trim()}
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {shareSheetOpen ? (
        <div
          className="feed-share-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Share post"
          onClick={() => setShareSheetOpen(false)}
        >
          <div className="feed-share-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="feed-share-grabber" aria-hidden />
            <div className="feed-share-head">
              <p className="feed-share-title">Share</p>
              <button
                type="button"
                className="feed-share-close"
                aria-label="Close share sheet"
                onClick={() => setShareSheetOpen(false)}
              >
                ×
              </button>
            </div>
            {shareLoading ? (
              <p className="feed-share-empty">Loading conversations…</p>
            ) : shareItems.length === 0 ? (
              <p className="feed-share-empty">
                No conversations yet. Start a chat in Messages first.
              </p>
            ) : (
              <ul className="feed-share-list">
                {shareItems.map((item) => {
                  const avatarSrc = peerAvatarSrc(item.peerAvatarPath)
                  const initial = (
                    item.peerDisplayName ||
                    item.peerUsername ||
                    'U'
                  )
                    .slice(0, 1)
                    .toUpperCase()
                  const isSending = sendingConversationId === item.conversationId
                  return (
                    <li className="feed-share-row" key={item.conversationId}>
                      <div className="feed-share-user">
                        {avatarSrc ? (
                          <Image
                            src={avatarSrc}
                            alt=""
                            width={44}
                            height={44}
                            className="feed-avatar"
                            unoptimized
                          />
                        ) : (
                          <span className="feed-avatar feed-avatar-fallback" aria-hidden>
                            {initial}
                          </span>
                        )}
                        <div className="feed-share-user-copy">
                          <span className="feed-share-name">{item.peerDisplayName}</span>
                          <span className="feed-share-handle">@{item.peerUsername}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="feed-share-send"
                        disabled={isSending || Boolean(sendingConversationId)}
                        onClick={() => sendToConversation(item.conversationId)}
                      >
                        {isSending ? 'Sending…' : 'Send'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
