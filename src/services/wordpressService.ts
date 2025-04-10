
/**
 * WordPress API integration service
 */

// Post interface based on WordPress REST API
export interface WordPressPost {
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'private' | 'pending';
  excerpt?: string;
  meta?: {
    _yoast_wpseo_metadesc?: string; // Yoast SEO meta description
    _yoast_wpseo_title?: string;     // Yoast SEO title
    rank_math_description?: string;  // Rank Math SEO meta description
    rank_math_title?: string;        // Rank Math SEO title
  };
  featured_media?: number;
  categories?: number[];
  tags?: number[];
}

// WordPress connection settings interface
export interface WordPressSettings {
  siteUrl: string;
  username: string;
  appPassword: string;
  isConnected: boolean;
}

/**
 * Get WordPress settings for the current user
 */
export const getWordPressSettings = (userId: string): WordPressSettings | null => {
  const savedSettings = localStorage.getItem(`wordpress_settings_${userId}`);
  if (!savedSettings) return null;
  
  try {
    return JSON.parse(savedSettings);
  } catch (e) {
    console.error("Error parsing WordPress settings:", e);
    return null;
  }
};

/**
 * Create a new draft post on WordPress
 */
export const createWordPressPost = async (
  content: {
    title: string;
    content: string;
    excerpt?: string;
    metaDescription?: string;
  }, 
  userId: string
): Promise<{ success: boolean; message: string; postId?: number; editUrl?: string }> => {
  const settings = getWordPressSettings(userId);
  
  if (!settings || !settings.isConnected) {
    return { 
      success: false, 
      message: "Not connected to WordPress. Please set up your WordPress connection in Settings." 
    };
  }

  try {
    const { siteUrl, username, appPassword } = settings;
    
    const postData: WordPressPost = {
      title: content.title,
      content: content.content,
      status: 'draft',
      excerpt: content.excerpt,
    };
    
    // Add SEO metadata if available
    if (content.metaDescription) {
      postData.meta = {
        // Add for both Yoast and RankMath
        _yoast_wpseo_metadesc: content.metaDescription,
        rank_math_description: content.metaDescription,
      };
    }

    const endpoint = `${siteUrl}/wp-json/wp/v2/posts`;
    
    console.log(`Attempting to create WordPress post at: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(username + ':' + appPassword),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    console.log(`WordPress response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(e => ({ message: "Failed to parse error response" }));
      console.error("WordPress API error:", errorData);
      return { 
        success: false, 
        message: errorData.message || `Error ${response.status}: ${response.statusText}` 
      };
    }

    const responseData = await response.json();
    console.log("WordPress post created successfully:", responseData);
    
    return {
      success: true,
      message: "Draft post created successfully!",
      postId: responseData.id,
      editUrl: `${siteUrl}/wp-admin/post.php?post=${responseData.id}&action=edit`
    };
  } catch (error) {
    console.error("Error creating WordPress post:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error occurred while trying to create the post."
    };
  }
};

/**
 * Test connection to WordPress site
 */
export const testWordPressConnection = async (
  url: string, 
  username: string, 
  password: string
): Promise<{ success: boolean; message: string; user?: any; details?: string }> => {
  // Format the URL properly
  let apiUrl = url;
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = 'https://' + apiUrl;
  }
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }
  
  console.log(`Testing WordPress connection to: ${apiUrl}`);
  
  try {
    // First check if the site is reachable
    console.log(`Step 1: Checking if site is reachable at ${apiUrl}/wp-json`);
    const siteCheckResponse = await fetch(`${apiUrl}/wp-json`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.error("Error checking site availability:", error);
      throw new Error(`Could not connect to WordPress site: ${error.message}`);
    });
    
    console.log(`Site check response status: ${siteCheckResponse.status} ${siteCheckResponse.statusText}`);
    
    if (!siteCheckResponse.ok) {
      console.error("WordPress site not reachable or REST API not enabled:", siteCheckResponse);
      
      // Try to get more details
      const errorText = await siteCheckResponse.text().catch(() => "");
      console.log("Error response body:", errorText);
      
      return {
        success: false,
        message: `Site is reachable but does not appear to be a WordPress site with REST API enabled. Status: ${siteCheckResponse.status}`,
        details: errorText || undefined
      };
    }
    
    // Now try to authenticate
    const endpoint = `${apiUrl}/wp-json/wp/v2/users/me`;
    console.log(`Step 2: Authenticating at ${endpoint}`);
    
    const authHeaders = new Headers({
      'Authorization': 'Basic ' + btoa(username + ':' + password),
      'Content-Type': 'application/json'
    });
    
    console.log("Sending authentication request with credentials");
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: authHeaders
    });
    
    console.log(`Authentication response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("Authentication successful:", data);
      return {
        success: true,
        user: data,
        message: "Connected successfully"
      };
    } else {
      // Try to parse the error response
      try {
        console.log("Authentication failed, parsing error response");
        const errorData = await response.json();
        console.error("Error data:", errorData);
        
        return {
          success: false,
          message: errorData.message || `Authentication failed: ${response.status} ${response.statusText}`,
          details: JSON.stringify(errorData)
        };
      } catch (jsonError) {
        console.error("Failed to parse error response:", jsonError);
        // If we can't parse the JSON, try to get the text response
        try {
          const errorText = await response.text();
          console.log("Error response text:", errorText);
          return {
            success: false,
            message: `Authentication failed: ${response.status} ${response.statusText}`,
            details: errorText || undefined
          };
        } catch (textError) {
          // If we can't even get the text, just return the status
          return {
            success: false,
            message: `Authentication failed: ${response.status} ${response.statusText}`
          };
        }
      }
    }
  } catch (error) {
    console.error("Error testing WordPress connection:", error);
    return {
      success: false,
      message: error instanceof Error 
        ? `Connection error: ${error.message}` 
        : "Network error occurred. Please check the site URL and try again.",
      details: error instanceof Error ? error.stack : undefined
    };
  }
};
