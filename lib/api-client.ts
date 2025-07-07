/**
 * Safe API client utility for handling fetch requests
 * Prevents JSON parsing of HTML error pages and provides proper error handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface ApiError extends Error {
  status: number;
  response?: Response;
}

/**
 * Safe fetch wrapper that handles common API errors
 */
export async function safeFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Set default headers
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    // Get the content type to determine how to parse the response
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    // If response is not ok, handle error
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
      } else {
        // If response is HTML (like 404 page), don't try to parse as JSON
        const textResponse = await response.text();
        if (textResponse.includes('<html>')) {
          errorMessage = `API endpoint not found (${response.status})`;
        } else {
          errorMessage = textResponse || errorMessage;
        }
      }

      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }

    // Parse successful response
    if (isJson) {
      const data = await response.json();
      return {
        success: true,
        data,
        status: response.status,
      };
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      return {
        success: true,
        data: text as T,
        status: response.status,
      };
    }

  } catch (error) {
    console.error('API request failed:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        status: 0,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0,
    };
  }
}

/**
 * API client methods for common operations
 */
export const apiClient = {
  /**
   * GET request
   */
  get: async <T = any>(url: string, options: Omit<RequestInit, 'method'> = {}) => {
    return safeFetch<T>(url, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post: async <T = any>(url: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
    return safeFetch<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  put: async <T = any>(url: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
    return safeFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(url: string, options: Omit<RequestInit, 'method'> = {}) => {
    return safeFetch<T>(url, { ...options, method: 'DELETE' });
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(url: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
    return safeFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};

/**
 * Specific API methods for the application
 */
export const api = {
  auth: {
    signup: async (userData: { name: string; email: string; password: string }) => {
      return apiClient.post('/api/auth/signup', userData);
    },
    
    login: async (credentials: { email: string; password: string }) => {
      return apiClient.post('/api/auth/login', credentials);
    },
    
    logout: async () => {
      return apiClient.post('/api/auth/logout');
    },
  },

  subscription: {
    create: async (subscriptionData: { 
      userId: string; 
      plan: string; 
      paymentMethodId?: string; 
      billingCycle?: 'monthly' | 'yearly' 
    }) => {
      return apiClient.post('/api/subscription/create', subscriptionData);
    },
    
    getPlans: async () => {
      return apiClient.get('/api/subscription/create');
    },
  },

  support: {
    contact: async (contactData: { name: string; email: string; message: string }) => {
      return apiClient.post('/api/support/contact', contactData);
    },
  },
};

export default apiClient;
