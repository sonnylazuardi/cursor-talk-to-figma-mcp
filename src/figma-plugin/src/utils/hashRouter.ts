export type RouteHandler = () => void;

export interface Route {
  path: string;
  handler: RouteHandler;
}

export class HashRouter {
  private routes: Map<string, RouteHandler> = new Map();
  private currentRoute: string = '';

  constructor() {
    window.addEventListener('hashchange', this.handleHashChange.bind(this));
    window.addEventListener('load', this.handleHashChange.bind(this));
  }

  // Add a route
  addRoute(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  // Remove a route
  removeRoute(path: string): void {
    this.routes.delete(path);
  }

  // Navigate to a route
  navigate(path: string): void {
    window.location.hash = path;
  }

  // Get current route
  getCurrentRoute(): string {
    return this.currentRoute;
  }

  // Handle hash change
  private handleHashChange(): void {
    const hash = window.location.hash.slice(1) || '/';
    this.currentRoute = hash;
    
    const handler = this.routes.get(hash);
    if (handler) {
      handler();
    } else {
      // Default route
      const defaultHandler = this.routes.get('/');
      if (defaultHandler) {
        defaultHandler();
      }
    }
  }

  // Initialize router
  init(): void {
    this.handleHashChange();
  }

  // Destroy router
  destroy(): void {
    window.removeEventListener('hashchange', this.handleHashChange.bind(this));
    window.removeEventListener('load', this.handleHashChange.bind(this));
  }
}

// Create singleton instance
export const router = new HashRouter(); 