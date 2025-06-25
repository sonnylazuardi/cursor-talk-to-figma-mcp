// Simple hash router for Figma plugin UI navigation
import { useState, useEffect } from 'react';

export type RouteType = 'connection' | 'settings' | 'about';

export interface RouterState {
  currentRoute: RouteType;
  navigate: (route: RouteType) => void;
}

export function useHashRouter(): RouterState {
  const [currentRoute, setCurrentRoute] = useState<RouteType>(() => {
    const hash = window.location.hash.slice(1) as RouteType;
    return ['connection', 'settings', 'about'].includes(hash) ? hash : 'connection';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as RouteType;
      const validRoute = ['connection', 'settings', 'about'].includes(hash) ? hash : 'connection';
      setCurrentRoute(validRoute);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: RouteType) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  return { currentRoute, navigate };
}

// Navigation helper
export const routes = {
  connection: '#connection',
  settings: '#settings', 
  about: '#about'
} as const; 