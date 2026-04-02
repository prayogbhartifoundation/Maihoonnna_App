
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Global fetch interceptor to attach JWT token to all API requests
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    if (url.includes('/api/')) {
      const savedUser = localStorage.getItem('maihonna_user');
      let token = '';
      if (savedUser) {
        try {
          token = JSON.parse(savedUser).token;
        } catch (e) {}
      }
      
      if (token) {
        init = init || {};
        const headers = new Headers(init.headers);
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        
        // Handle standard objects and convert Headers back to object if needed
        // The simplest way to keep it robust:
        init.headers = headers;
      }
    }
    
    return originalFetch(input, init);
  };

  createRoot(document.getElementById("root")!).render(<App />);
  