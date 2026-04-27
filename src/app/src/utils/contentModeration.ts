// Content moderation utility for detecting inappropriate content
export interface ModerationResult {
  isAppropriate: boolean;
  reasons: string[];
  confidence: number;
}

export interface ModerationAppeal {
  id: string;
  userId: string;
  userName: string;
  contentType: 'post' | 'comment';
  originalContent: string;
  postId?: string;
  commentId?: string;
  flaggedReasons: string[];
  userMessage: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// Inappropriate content patterns and categories
const MODERATION_PATTERNS = {
  spam: {
    keywords: [
      'click here', 'buy now', 'limited time', 'act fast', 'free money',
      'get rich quick', 'make money fast', 'guaranteed income', 'no experience needed',
      'work from home', 'earn $', 'easy money'
    ],
    regexes: [
      /(.)\1{4,}/g, // Repeated characters (aaaaa)
      /[A-Z]{5,}/g, // Excessive caps
      /\$\d+/g, // Dollar amounts might be suspicious in high frequency
    ]
  },
  
  harassment: {
    keywords: [
      'stupid', 'idiot', 'loser', 'waste of space', 'pathetic', 'worthless',
      'shut up', 'kill yourself', 'die', 'hate you', 'disgusting'
    ],
    regexes: [
      /f[u*@#$%^&]{1,3}k/gi, // Censored profanity variations
      /[a@]ss\s*h[o0]l[e3]/gi, // Asshole variations
      /b[i1]tch/gi, // Bitch variations
    ]
  },
  
  offtopic: {
    keywords: [
      'politics', 'election', 'vote for', 'democrat', 'republican', 'liberal', 'conservative',
      'religion', 'god', 'jesus', 'allah', 'buddha', 'pray',
      'crypto scam', 'bitcoin investment', 'nft drop', 'forex trading'
    ],
    regexes: []
  },
  
  inappropriate: {
    keywords: [
      'sex', 'porn', 'nude', 'naked', 'adult content', 'xxx',
      'drugs', 'cocaine', 'marijuana', 'weed', 'high', 'stoned'
    ],
    regexes: []
  },
  
  scam: {
    keywords: [
      'investment opportunity', 'guaranteed returns', 'risk free', 'double your money',
      'insider trading', 'secret method', 'hidden formula', 'get rich scheme',
      'pyramid scheme', 'multilevel marketing', 'mlm', 'ponzi'
    ],
    regexes: [
      /\b\d+%\s*(?:return|profit|guaranteed)/gi, // Percentage returns
      /invest\s*\$?\d+.*(?:return|profit)/gi, // Investment promises
    ]
  }
};

// Moderation messages for each category
const MODERATION_MESSAGES = {
  spam: "Your content appears to be spam or promotional material. Please keep posts relevant to business development and entrepreneurship.",
  harassment: "Your content contains language that could be considered harassment or bullying. Please keep discussions respectful and constructive.",
  offtopic: "Your content appears to be off-topic for this business community. Please focus on business-related discussions.",
  inappropriate: "Your content contains inappropriate material for a professional business community. Please keep content suitable for all audiences.",
  scam: "Your content appears to promote investment schemes or potentially fraudulent activities. Please focus on legitimate business discussions."
};

export function moderateContent(content: string, title?: string): ModerationResult {
  const textToCheck = `${title || ''} ${content}`.toLowerCase();
  const flaggedReasons: string[] = [];
  let totalConfidence = 0;
  let checkCount = 0;

  // Check each moderation category
  for (const [category, patterns] of Object.entries(MODERATION_PATTERNS)) {
    let categoryFlags = 0;
    
    // Check keywords
    for (const keyword of patterns.keywords) {
      if (textToCheck.includes(keyword.toLowerCase())) {
        categoryFlags++;
      }
    }
    
    // Check regex patterns
    for (const regex of patterns.regexes) {
      if (regex.test(textToCheck)) {
        categoryFlags++;
      }
    }
    
    // If we found flags in this category, add it to reasons
    if (categoryFlags > 0) {
      flaggedReasons.push(category);
      // Calculate confidence based on number of flags in category
      const categoryConfidence = Math.min(categoryFlags * 0.3, 1.0);
      totalConfidence += categoryConfidence;
      checkCount++;
    }
  }

  // Additional checks for suspicious patterns
  const wordCount = textToCheck.split(/\s+/).length;
  const uniqueWords = new Set(textToCheck.split(/\s+/)).size;
  const repetitionRatio = uniqueWords / wordCount;
  
  // Flag if too much repetition (potential spam)
  if (wordCount > 10 && repetitionRatio < 0.5) {
    if (!flaggedReasons.includes('spam')) {
      flaggedReasons.push('spam');
      totalConfidence += 0.4;
      checkCount++;
    }
  }

  // Calculate final confidence
  const averageConfidence = checkCount > 0 ? totalConfidence / checkCount : 0;
  const isAppropriate = flaggedReasons.length === 0 || averageConfidence < 0.5;

  return {
    isAppropriate,
    reasons: flaggedReasons,
    confidence: averageConfidence
  };
}

export function getModerationMessage(reasons: string[]): string {
  if (reasons.length === 0) return '';
  
  // Return message for the most severe reason
  const priorityOrder = ['harassment', 'inappropriate', 'scam', 'spam', 'offtopic'];
  
  for (const priority of priorityOrder) {
    if (reasons.includes(priority)) {
      return MODERATION_MESSAGES[priority];
    }
  }
  
  // Fallback to first reason
  return MODERATION_MESSAGES[reasons[0]] || 'Your content has been flagged for review.';
}

export function createAppeal(
  userId: string,
  userName: string,
  contentType: 'post' | 'comment',
  originalContent: string,
  flaggedReasons: string[],
  userMessage: string,
  postId?: string,
  commentId?: string
): ModerationAppeal {
  return {
    id: `appeal-${Date.now()}-${userId}`,
    userId,
    userName,
    contentType,
    originalContent,
    postId,
    commentId,
    flaggedReasons,
    userMessage,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}