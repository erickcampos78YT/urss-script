import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, limit, where, or } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { HeartIcon, ChatBubbleLeftIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import SearchBar, { SearchFilters } from '../components/SearchBar';

interface Script {
  id: string;
  title: string;
  description: string;
  language: string;
  authorName: string;
  likes: number;
  comments: number;
  createdAt: Date;
  tags: string[];
}

const Home = () => {
  const { currentUser } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSearch, setLastSearch] = useState('');

  const fetchScripts = async (searchQuery = '', filters: SearchFilters = { language: '', tags: [], sortBy: 'recent' }) => {
    try {
      setLoading(true);
      const scriptsRef = collection(db, 'scripts');
      let q = query(scriptsRef);

      // Pesquisa por título com case insensitive
      if (searchQuery) {
        const lowercaseQuery = searchQuery.toLowerCase();
        const words = lowercaseQuery.split(' ').filter(word => word.length > 0);
        
        if (words.length > 0) {
          // Cria uma query OR para cada palavra da busca
          const queries = words.map(word => [
            where('titleLowerCase', '>=', word),
            where('titleLowerCase', '<=', word + '\uf8ff'),
          ]).flat();
          
          q = query(scriptsRef, or(...queries));
        }
      }

      // Filtro por linguagem
      if (filters.language) {
        q = query(q, where('language', '==', filters.language));
      }

      // Filtro por tags
      if (filters.tags.length > 0) {
        q = query(q, where('tags', 'array-contains-any', filters.tags));
      }

      // Ordenação
      switch (filters.sortBy) {
        case 'recent':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'popular':
          q = query(q, orderBy('likes', 'desc'));
          break;
        case 'name':
          q = query(q, orderBy('titleLowerCase', 'asc'));
          break;
      }

      const querySnapshot = await getDocs(q);
      
      const scriptsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Script[];

      // Filtra os resultados usando fuzzy search se houver uma busca
      const filteredScripts = searchQuery
        ? fuzzySearch(scriptsData, searchQuery)
        : scriptsData;

      setScripts(filteredScripts);
      setLastSearch(searchQuery);
    } catch (error) {
      setError('Failed to fetch scripts');
      console.error('Fetch scripts error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função de busca fuzzy para melhorar os resultados
  const fuzzySearch = (scripts: Script[], search: string): Script[] => {
    if (!search) return scripts;

    const searchTerms = search.toLowerCase().split(' ');
    return scripts.filter(script => {
      const title = script.title.toLowerCase();
      const description = script.description.toLowerCase();
      const language = script.language.toLowerCase();
      const tags = script.tags.map(tag => tag.toLowerCase());

      return searchTerms.every(term =>
        title.includes(term) ||
        description.includes(term) ||
        language.includes(term) ||
        tags.some(tag => tag.includes(term))
      );
    });
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleSearch = (query: string, filters: SearchFilters) => {
    fetchScripts(query, filters);
  };

  // Informações de resultados da busca
  const searchResults = useMemo(() => {
    if (!lastSearch) return null;
    
    const total = scripts.length;
    const languagesFound = Array.from(new Set(scripts.map(s => s.language)));
    const tagsFound = Array.from(new Set(scripts.flatMap(s => s.tags)));

    return {
      total,
      languagesFound,
      tagsFound,
    };
  }, [scripts, lastSearch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-carmine"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-300">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Latest Scripts</h1>
        {currentUser && (
          <Link
            to="/submit-script"
            className="px-4 py-2 bg-carmine rounded-xl hover:bg-carmine/90 transition-colors"
          >
            Submit Script
          </Link>
        )}
      </div>

      <div className="mb-8">
        <SearchBar onSearch={handleSearch} />
        
        {/* Search Results Summary */}
        {searchResults && (
          <div className="mt-4 p-4 bg-dark-gray/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">
                Found <span className="text-carmine font-semibold">{searchResults.total}</span> results
                {lastSearch && ` for "${lastSearch}"`}
              </div>
              {searchResults.total > 0 && (
                <div className="text-sm text-gray-400">
                  in {searchResults.languagesFound.length} languages
                </div>
              )}
            </div>
            {searchResults.tagsFound.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {searchResults.tagsFound.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {scripts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-300">No scripts found</h2>
          <p className="text-gray-400 mt-2">
            {lastSearch ? 'Try different search terms or filters' : 'Be the first to submit a script!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map(script => (
            <motion.div
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-gray/50 border border-gray-700 rounded-lg p-6"
            >
              <Link to={`/script/${script.id}`} className="block">
                <h2 className="text-xl font-bold text-white mb-2 hover:text-carmine transition-colors">
                  {script.title}
                </h2>
              </Link>
              <p className="text-gray-300 mb-4 line-clamp-2">{script.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <CodeBracketIcon className="h-4 w-4" />
                  <span>{script.language}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HeartIcon className="h-4 w-4" />
                  <span>{script.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{script.comments}</span>
                </div>
              </div>
              {script.tags && script.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {script.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 text-sm text-gray-400">
                Posted by {script.authorName} on {script.createdAt.toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;