/**
 * @fileOverview Collection of inspirational quotes related to learning and personal growth
 * that will be displayed at the beginning of each task breakdown.
 */

export interface Quote {
  text: string;
  author: string;
}

export const inspirationalQuotes: Quote[] = [
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  },
  {
    text: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    text: "Learning is a treasure that will follow its owner everywhere.",
    author: "Chinese Proverb"
  },
  {
    text: "What we learn with pleasure we never forget.",
    author: "Alfred Mercier"
  },
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss"
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin"
  },
  {
    text: "The future belongs to those who learn more skills and combine them in creative ways.",
    author: "Robert Greene"
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier"
  },
  {
    text: "Continuous effort - not strength or intelligence - is the key to unlocking our potential.",
    author: "Winston Churchill"
  },
  {
    text: "The mind that opens up to a new idea never returns to its original size.",
    author: "Albert Einstein"
  },
  {
    text: "Knowledge is power. Information is liberating. Education is the premise of progress.",
    author: "Kofi Annan"
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis"
  },
  {
    text: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle"
  },
  {
    text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
    author: "Abigail Adams"
  },
  {
    text: "Progress is impossible without change, and those who cannot change their minds cannot change anything.",
    author: "George Bernard Shaw"
  },
  {
    text: "The expert in anything was once a beginner who refused to give up.",
    author: "Anonymous"
  },
  {
    text: "Growth begins at the end of your comfort zone.",
    author: "Anonymous"
  },
  {
    text: "Small progress is still progress.",
    author: "Anonymous"
  },
  {
    text: "Every master was once a disaster.",
    author: "T. Harv Eker"
  }
];

/**
 * Get a random inspirational quote
 */
export function getRandomQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
  return inspirationalQuotes[randomIndex];
}

/**
 * Format a quote for display
 */
export function formatQuote(quote: Quote): string {
  return `"${quote.text}" — ${quote.author}`;
}
