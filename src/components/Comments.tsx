import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  parentId?: string;
  replies?: Comment[];
  votes: number;
  userVote?: 'up' | 'down' | null;
}

interface CommentsProps {
  scriptId: string;
}

const Comments: React.FC<CommentsProps> = ({ scriptId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'new' | 'controversial'>('top');
  const navigate = useNavigate();

  useEffect(() => {
    fetchComments();
  }, [scriptId, sortBy]);

  const fetchComments = async () => {
    try {
      const commentsRef = collection(db, 'comments');
      let q = query(
        commentsRef,
        where('scriptId', '==', scriptId),
        where('parentId', '==', null)
      );

      // Add sorting based on selected option
      switch (sortBy) {
        case 'top':
          q = query(q, orderBy('votes', 'desc'));
          break;
        case 'new':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'controversial':
          // For controversial, we'll sort by the ratio of upvotes to downvotes
          q = query(q, orderBy('votes', 'asc'));
          break;
      }
      
      const querySnapshot = await getDocs(q);
      const fetchedComments = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const comment = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            votes: doc.data().votes || 0,
            userVote: doc.data().userVotes?.[auth.currentUser?.uid] || null,
          } as Comment;

          // Fetch replies for this comment
          const repliesQuery = query(
            commentsRef,
            where('parentId', '==', doc.id),
            orderBy('createdAt', 'asc')
          );
          const repliesSnapshot = await getDocs(repliesQuery);
          const replies = repliesSnapshot.docs.map(replyDoc => ({
            id: replyDoc.id,
            ...replyDoc.data(),
            createdAt: replyDoc.data().createdAt.toDate(),
            votes: replyDoc.data().votes || 0,
            userVote: replyDoc.data().userVotes?.[auth.currentUser?.uid] || null,
          })) as Comment[];

          return { ...comment, replies };
        })
      );

      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (commentId: string, voteType: 'up' | 'down') => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const commentRef = doc(db, 'comments', commentId);
      const comment = comments.find(c => c.id === commentId) || 
                     comments.flatMap(c => c.replies || []).find(r => r.id === commentId);

      if (!comment) return;

      const currentVote = comment.userVote;
      let voteChange = 0;

      if (currentVote === voteType) {
        // Remove vote
        voteChange = voteType === 'up' ? -1 : 1;
      } else if (currentVote) {
        // Change vote
        voteChange = voteType === 'up' ? 2 : -2;
      } else {
        // New vote
        voteChange = voteType === 'up' ? 1 : -1;
      }

      await updateDoc(commentRef, {
        votes: comment.votes + voteChange,
        [`userVotes.${auth.currentUser.uid}`]: currentVote === voteType ? null : voteType
      });

      // Update local state
      setComments(prevComments => 
        prevComments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              votes: c.votes + voteChange,
              userVote: currentVote === voteType ? null : voteType
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r.id === commentId
                  ? {
                      ...r,
                      votes: r.votes + voteChange,
                      userVote: currentVote === voteType ? null : voteType
                    }
                  : r
              )
            };
          }
          return c;
        })
      );
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const trimmedContent = newComment.trim();
    if (!trimmedContent) return;

    if (trimmedContent.length > 1000) {
      setError('Comment cannot exceed 1000 characters.');
      return;
    }

    try {
      const commentsRef = collection(db, 'comments');
      await addDoc(commentsRef, {
        content: trimmedContent,
        scriptId,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEdited: false,
        parentId: null,
        votes: 0,
        userVotes: {}
      });

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to post comment. Please try again.');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const trimmedContent = replyContent.trim();
    if (!trimmedContent) return;

    if (trimmedContent.length > 500) {
      setError('Reply cannot exceed 500 characters.');
      return;
    }

    try {
      const commentsRef = collection(db, 'comments');
      await addDoc(commentsRef, {
        content: trimmedContent,
        scriptId,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEdited: false,
        parentId,
        votes: 0,
        userVotes: {}
      });

      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to post reply. Please try again.');
    }
  };

  const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
    const [showReplies, setShowReplies] = useState(true);
    const replyCount = comment.replies?.length || 0;

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          {/* Voting */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleVote(comment.id, 'up')}
              className={`p-1 rounded hover:bg-dark-gray/50 transition-colors ${
                comment.userVote === 'up' ? 'text-carmine' : 'text-gray-400'
              }`}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-300">{comment.votes}</span>
            <button
              onClick={() => handleVote(comment.id, 'down')}
              className={`p-1 rounded hover:bg-dark-gray/50 transition-colors ${
                comment.userVote === 'down' ? 'text-carmine' : 'text-gray-400'
              }`}
            >
              <ArrowDownIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Comment Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-carmine">{comment.authorName}</span>
              <span className="text-sm text-gray-400">
                {comment.createdAt.toLocaleDateString()}
                {comment.isEdited && (
                  <span className="ml-2 text-xs text-gray-500">(edited)</span>
                )}
              </span>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap mb-2">{comment.content}</p>
            {!comment.parentId && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-sm text-carmine hover:text-carmine/80 transition-colors"
              >
                <ChatBubbleLeftIcon className="h-4 w-4" />
                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>
        </div>

        {replyingTo === comment.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-14"
          >
            <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply... (max 500 characters)"
                className="w-full bg-dark-gray/50 border border-carmine/30 rounded-xl px-4 py-2 text-gray-300"
                rows={2}
                maxLength={500}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 bg-dark-gray/50 border border-carmine/30 rounded-xl hover:bg-dark-gray/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-carmine rounded-xl hover:bg-carmine/90 transition-colors"
                >
                  Reply
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {replyCount > 0 && (
          <div className="ml-14">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2 text-sm text-carmine hover:text-carmine/80 transition-colors mb-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transform transition-transform ${showReplies ? 'rotate-90' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
            <AnimatePresence>
              {showReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {comment.replies?.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-carmine"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-carmine">Comments</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'top' | 'new' | 'controversial')}
            className="bg-dark-gray/50 border border-carmine/30 rounded-xl px-3 py-1 text-sm focus:outline-none focus:border-carmine"
          >
            <option value="top">Top</option>
            <option value="new">New</option>
            <option value="controversial">Controversial</option>
          </select>
        </div>
      </div>
      
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-carmine/20 flex items-center justify-center">
              <span className="text-carmine font-semibold">
                {auth.currentUser?.displayName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment... (max 1000 characters)"
              className="w-full bg-dark-gray/50 border border-carmine/30 rounded-xl px-4 py-2 text-gray-300"
              rows={3}
              maxLength={1000}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-carmine rounded-xl hover:bg-carmine/90 transition-colors"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default Comments; 