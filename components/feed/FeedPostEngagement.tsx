'use client'

import {
  addPostCommentAction,
  togglePostLikeAction,
} from '@/app/actions/post-engagement'
import { createClient } from '@/lib/supabase/client'
import {
  IconBookmark,
  IconBubble,
  IconHeart,
  IconSend,
} from './FeedIcons'
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
  captionUsername: string
  caption: string
  initialLikesCount: number
  initialLiked: boolean
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

export function FeedPostEngagement({
  postId,
  captionUsername,
  caption,
  initialLikesCount,
  initialLiked,
  initialCommentsCount,
}: Props) {
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [liked, setLiked] = useState(initialLiked)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [likePending, setLikePending] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [commentPending, setCommentPending] = useState(false)

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
    setCommentsOpen(true)
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
            aria-expanded={commentsOpen}
            onClick={() => (commentsOpen ? setCommentsOpen(false) : openComments())}
          >
            <IconBubble className="feed-icon-stroke" title="" />
          </button>
          <button type="button" className="feed-icon-btn" aria-label="Share">
            <IconSend className="feed-icon-stroke" title="" />
          </button>
        </div>
        <button type="button" className="feed-icon-btn" aria-label="Save">
          <IconBookmark className="feed-icon-stroke" title="" />
        </button>
      </div>

      {likeError ? (
        <p className="feed-like-error" role="alert">
          {likeError}
        </p>
      ) : null}

      <p className="feed-likes">
        {likesCount === 1 ? '1 like' : `${likesCount.toLocaleString()} likes`}
      </p>

      <p className="feed-caption">
        <span className="feed-username feed-caption-user">{captionUsername}</span>{' '}
        <span className="feed-caption-text">{caption}</span>
      </p>

      {commentsCount > 0 && !commentsOpen ? (
        <button
          type="button"
          className="feed-view-comments"
          onClick={openComments}
        >
          View all {commentsCount} comment{commentsCount === 1 ? '' : 's'}
        </button>
      ) : null}

      {commentsOpen ? (
        <div className="feed-comments-section">
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

          <form className="feed-comment-form" onSubmit={onSubmitComment}>
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
      ) : null}
    </div>
  )
}
