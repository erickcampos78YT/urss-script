import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CodeBracketIcon, HeartIcon, ChatBubbleIcon } from '../components/icons';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

interface Script {
  id: string;
  title: string;
  language: string;
  likes: number;
  comments: number;
  code: string;
  createdAt: any;
}

interface Comment {
  id: string;
  content: string;
  scriptId: string;
  scriptTitle: string;
  createdAt: any;
  updatedAt?: any;
  authorId: string;
  authorName: string;
  isEdited: boolean;
  votes: number;
  userVotes: { [key: string]: 'up' | 'down' };
  parentId?: string;
  replies?: Comment[];
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B6B6B', '#E5989B', '#FFB4A2', '#6B4F4F'
];

const drawPieChart = (
  ctx: CanvasRenderingContext2D,
  data: { [key: string]: number },
  width: number,
  height: number
) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  let startAngle = 0;

  ctx.clearRect(0, 0, width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 10;

  Object.entries(data).forEach(([language, count], index) => {
    const sliceAngle = (count / total) * 2 * Math.PI;
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    
    // Draw label
    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY + Math.sin(labelAngle) * labelRadius;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Arial';
    const percentage = Math.round((count / total) * 100);
    if (percentage > 5) { // Only show label if slice is big enough
      ctx.fillText(`${language} (${percentage}%)`, labelX, labelY);
    }
    
    startAngle += sliceAngle;
  });
};

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);
  const [totalLines, setTotalLines] = useState(0);
  const [languageStats, setLanguageStats] = useState<{ [key: string]: number }>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Verificar autenticação
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  // Carregar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      setLoadingData(true);
      setError('');

      try {
        // Fetch user's scripts
        const scriptsQuery = query(
          collection(db, 'scripts'),
          where('authorId', '==', currentUser.uid)
        );

        const scriptsSnapshot = await getDocs(scriptsQuery);
        const scriptsData = scriptsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Script[];

        setScripts(scriptsData);

        // Fetch user's comments
        const commentsQuery = query(
          collection(db, 'comments'),
          where('authorId', '==', currentUser.uid)
        );

        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = await Promise.all(
          commentsSnapshot.docs.map(async (doc) => {
            const comment = doc.data();
            // Fetch script title for each comment
            const scriptDoc = await getDocs(query(
              collection(db, 'scripts'),
              where('id', '==', comment.scriptId)
            ));
            const scriptTitle = scriptDoc.docs[0]?.data()?.title || 'Unknown Script';
            
            return {
              id: doc.id,
              content: comment.content,
              scriptId: comment.scriptId,
              scriptTitle,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
              authorId: comment.authorId,
              authorName: comment.authorName || 'Anonymous',
              isEdited: comment.isEdited || false,
              votes: comment.votes || 0,
              userVotes: comment.userVotes || {},
              parentId: comment.parentId,
              replies: []
            };
          })
        );

        setComments(commentsData);

        // Calculate total lines of code
        const lines = scriptsData.reduce((acc, script) => {
          return acc + (script.code?.split('\n').length || 0);
        }, 0);
        setTotalLines(lines);

        // Calculate language statistics
        const stats = scriptsData.reduce((acc, script) => {
          acc[script.language] = (acc[script.language] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        setLanguageStats(stats);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoadingData(false);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    if (canvasRef.current && Object.keys(languageStats).length > 0) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawPieChart(ctx, languageStats, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [languageStats]);

  const totalLikes = scripts.reduce((acc, script) => acc + (script.likes || 0), 0);
  const totalComments = scripts.reduce((acc, script) => acc + (script.comments || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-carmine/20 border border-carmine text-carmine px-6 py-4 rounded-xl mb-4 text-center">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-carmine rounded-xl hover:bg-carmine/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-dark-gray/50 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-carmine/20 flex items-center justify-center">
            <span className="text-4xl text-carmine font-semibold">
              {currentUser?.displayName?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {currentUser?.displayName || 'Anonymous User'}
            </h1>
            <p className="text-gray-400">{currentUser?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-gray/30 rounded-lg p-4 text-center">
            <CodeBracketIcon className="h-6 w-6 text-carmine mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{scripts.length}</div>
            <div className="text-sm text-gray-400">Scripts</div>
          </div>
          <div className="bg-dark-gray/30 rounded-lg p-4 text-center">
            <HeartIcon className="h-6 w-6 text-carmine mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalLikes}</div>
            <div className="text-sm text-gray-400">Total Likes</div>
          </div>
          <div className="bg-dark-gray/30 rounded-lg p-4 text-center">
            <ChatBubbleIcon className="h-6 w-6 text-carmine mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalComments}</div>
            <div className="text-sm text-gray-400">Total Comments</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Language Distribution</h2>
            <div className="relative bg-dark-gray/30 rounded-lg p-4 aspect-square">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="w-full h-full"
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Code Statistics</h2>
            <div className="bg-dark-gray/30 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Lines of Code</span>
                  <span className="text-carmine font-semibold">{totalLines}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average Lines per Script</span>
                  <span className="text-carmine font-semibold">
                    {scripts.length ? Math.round(totalLines / scripts.length) : 0}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-2">Language Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(languageStats).map(([language, count]) => (
                    <div key={language} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ 
                            backgroundColor: colors[Object.keys(languageStats).indexOf(language) % colors.length] 
                          }} 
                        />
                        <span className="text-gray-300">{language}</span>
                      </div>
                      <span className="text-carmine font-semibold">{count} scripts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">My Scripts</h2>
          {scripts.length === 0 ? (
            <p className="text-gray-400">No scripts yet. Start by creating one!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scripts.map((script) => (
                <Link
                  key={script.id}
                  to={`/script/${script.id}`}
                  className="bg-dark-gray/50 rounded-xl p-4 hover:bg-dark-gray/70 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{script.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{script.language}</span>
                    <span>{script.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white mb-4">My Comments</h2>
          {comments.length === 0 ? (
            <p className="text-gray-400">No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Link
                  key={comment.id}
                  to={`/script/${comment.scriptId}`}
                  className="block bg-dark-gray/50 rounded-xl p-4 hover:bg-dark-gray/70 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{comment.scriptTitle}</h3>
                  <p className="text-gray-300 mb-2">{comment.content}</p>
                  <span className="text-sm text-gray-400">
                    {comment.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;