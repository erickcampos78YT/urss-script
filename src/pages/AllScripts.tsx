import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { HeartIcon, HeartIconSolid, ChatBubbleIcon, CodeBracketIcon } from '../components/icons';

interface Script {
  id: string;
  title: string;
  description: string;
  language: string;
  author: {
    id: string;
    name: string;
  };
  likes: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

const AllScripts = () => {
  const { theme } = useTheme();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes'>('newest');
  const [filterLanguage, setFilterLanguage] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const scriptsQuery = query(
          collection(db, 'scripts'),
          orderBy(
            sortBy === 'newest' ? 'createdAt' : 
            sortBy === 'oldest' ? 'createdAt' : 'likes',
            sortBy === 'oldest' ? 'asc' : 'desc'
          )
        );

        const querySnapshot = await getDocs(scriptsQuery);
        const scriptsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        })) as Script[];

        setScripts(scriptsData);
      } catch (err) {
        console.error('Error fetching scripts:', err);
        setError('Failed to load scripts');
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, [sortBy]);

  const filteredScripts = scripts.filter(script => 
    (!filterLanguage || script.language.toLowerCase().includes(filterLanguage.toLowerCase())) &&
    (!filterTag || script.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())))
  );

  const allTags = Array.from(new Set(scripts.flatMap(script => script.tags)));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className={`
          p-8 rounded-lg text-center
          ${theme === 'dark' 
            ? 'bg-dark-gray/50 border border-gray-700' 
            : 'script-interface'
          }
        `}>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className={`
          p-8 rounded-lg text-center
          ${theme === 'dark' 
            ? 'bg-dark-gray/50 border border-gray-700' 
            : 'script-interface'
          }
        `}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className={`
          text-3xl font-bold
          ${theme === 'dark' 
            ? 'text-white' 
            : 'text-white'
          }
        `}>
          All Scripts
        </h1>
        <Link
          to="/submit"
          className={`
            px-4 py-2 rounded-lg transition-all duration-300
            ${theme === 'dark' 
              ? 'bg-carmine hover:bg-carmine/80' 
              : 'script-button'
            }
          `}
        >
          Submit New Script
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'likes')}
          className={`
            px-4 py-2 rounded-lg
            ${theme === 'dark' 
              ? 'bg-dark-gray/50 border border-gray-700 text-white' 
              : 'script-interface text-white'
            }
          `}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="likes">Most Liked</option>
        </select>

        <input
          type="text"
          placeholder="Filter by language..."
          value={filterLanguage}
          onChange={(e) => setFilterLanguage(e.target.value)}
          className={`
            px-4 py-2 rounded-lg
            ${theme === 'dark' 
              ? 'bg-dark-gray/50 border border-gray-700 text-white' 
              : 'script-interface text-white'
            }
          `}
        />

        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className={`
            px-4 py-2 rounded-lg
            ${theme === 'dark' 
              ? 'bg-dark-gray/50 border border-gray-700 text-white' 
              : 'script-interface text-white'
            }
          `}
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {filteredScripts.length === 0 ? (
        <div className={`
          p-8 rounded-lg text-center
          ${theme === 'dark' 
            ? 'bg-dark-gray/50 border border-gray-700' 
            : 'script-interface'
          }
        `}>
          No scripts found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts.map(script => (
            <Link
              key={script.id}
              to={`/scripts/${script.id}`}
              className={`
                p-6 rounded-lg transition-all duration-300
                ${theme === 'dark' 
                  ? 'bg-dark-gray/50 border border-gray-700 hover:bg-dark-gray/70' 
                  : 'script-interface hover:bg-white/10'
                }
              `}
            >
              <h2 className={`
                text-xl font-bold mb-2
                ${theme === 'dark' 
                  ? 'text-white' 
                  : 'text-white'
                }
              `}>
                {script.title}
              </h2>
              <p className={`
                text-sm mb-4 line-clamp-2
                ${theme === 'dark' 
                  ? 'text-gray-300' 
                  : 'text-white/80'
                }
              `}>
                {script.description}
              </p>
              <div className="flex items-center gap-4 text-sm mb-4">
                <div className={`
                  flex items-center gap-1
                  ${theme === 'dark' 
                    ? 'text-gray-400' 
                    : 'text-white/60'
                  }
                `}>
                  <CodeBracketIcon className="h-4 w-4" />
                  <span>{script.language}</span>
                </div>
                <div className={`
                  flex items-center gap-1
                  ${theme === 'dark' 
                    ? 'text-gray-400' 
                    : 'text-white/60'
                  }
                `}>
                  <HeartIcon className="h-4 w-4" />
                  <span>{script.likes}</span>
                </div>
                <div className={`
                  flex items-center gap-1
                  ${theme === 'dark' 
                    ? 'text-gray-400' 
                    : 'text-white/60'
                  }
                `}>
                  <ChatBubbleIcon className="h-4 w-4" />
                  <span>{script.comments}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {script.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`
                      px-2 py-1 rounded-full text-xs
                      ${theme === 'dark' 
                        ? 'bg-dark-gray/50 text-gray-300' 
                        : 'bg-white/10 text-white'
                      }
                    `}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className={`
                mt-4 text-sm
                ${theme === 'dark' 
                  ? 'text-gray-400' 
                  : 'text-white/60'
                }
              `}>
                By {script.author.name} • {script.createdAt.toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllScripts; 