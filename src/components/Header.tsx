import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="bg-dark-gray shadow-md fixed w-full z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Bloco agrupado: título, navegação e autenticação */}
            <div className="flex items-center gap-4 md:gap-6">
              <Link to="/" className="text-xl md:text-2xl font-bold transition-colors duration-300 flex items-center gap-1 text-white hover:text-carmine">
                URSS Script
                <span className="text-carmine text-xl" title="Símbolo soviético">☭</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link to="/" className="transition-colors duration-300 text-gray-300 hover:text-carmine">
                  Home
                </Link>
                <Link to="/scripts" className="transition-colors duration-300 text-gray-300 hover:text-carmine">
                  Scripts
                </Link>
                {currentUser ? (
                  <div className="hidden md:flex items-center gap-2">
                    <button
                      onClick={() => navigate('/profile')}
                      className="text-gray-300 hover:text-carmine font-semibold px-3 py-1 rounded transition-colors border border-transparent hover:border-carmine"
                    >
                      {currentUser.displayName || 'User'}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg transition-all duration-300 bg-dark-gray/50 border border-carmine/30 hover:bg-dark-gray/70"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="hidden md:block px-4 py-2 rounded-lg transition-all duration-300 bg-dark-gray/50 border border-carmine/30 hover:bg-dark-gray/70">
                    Login
                  </Link>
                )}
              </nav>
              {/* Botão menu mobile */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-lg hover:bg-white/10"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6 text-white" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700">
              <nav className="flex flex-col gap-4">
                <Link 
                  to="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 rounded-lg transition-colors duration-300 text-gray-300 hover:text-carmine hover:bg-dark-gray/50"
                >
                  Home
                </Link>
                <Link 
                  to="/scripts" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 rounded-lg transition-colors duration-300 text-gray-300 hover:text-carmine hover:bg-dark-gray/50"
                >
                  Scripts
                </Link>
                {currentUser ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="px-4 py-2 rounded-lg transition-colors duration-300 text-gray-300 hover:text-carmine hover:bg-dark-gray/50 text-left font-semibold border border-transparent hover:border-carmine"
                    >
                      {currentUser.displayName || 'User'}
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="px-4 py-2 rounded-lg transition-all duration-300 text-left bg-dark-gray/50 border border-carmine/30 hover:bg-dark-gray/70"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2 rounded-lg transition-all duration-300 bg-dark-gray/50 border border-carmine/30 hover:bg-dark-gray/70"
                  >
                    Login
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
      <div className="h-16"></div>
      {/* Botão de mudança de tema fixo centralizado na parte inferior */}
      <div className="fixed bottom-4 left-0 w-full flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
};

export default Header;
