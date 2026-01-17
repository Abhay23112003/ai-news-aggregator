'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Newspaper,
  TrendingUp,
  Bookmark,
  Clock,
  LoaderCircle
} from 'lucide-react';
import NewsTrendsChart from './components/NewsTrendsCharts';
import NotificationSettings from './components/NotificationSettings';
import { useReadingTimer } from './hooks/useReadingTimer';

// Types
interface Article {
  id: string,
  title: string;
  summary: string;
  link: string;
  image_url?: string;
  trending?: boolean;
  category?: string;
  bookmark?: boolean;
  created_at: string;
}

interface ArticlesResponse {
  articles: Article[];
}

// Utility function to format time
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Technology');
  const [bookmarkLoader, setBookmarkLoader] = useState(false)
  const [bookmarkLoaderUUID,setBookmarkLoaderUUID]=useState('')
  const [duration,setDuration]=useState('')
  const { formattedTime } = useReadingTimer();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=50');
      const data: ArticlesResponse = await response.json();
      setArticles(data.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Technology', 'Finance', 'Sports', 'Health', 'World', 'Science'];

  const insights = {
    totalArticles: articles.length,
    trendingTopics: articles.filter(article => article.trending === true).length,
    savedForLater: articles.filter(article => article.bookmark === true).length,
    readingTime: `${formattedTime}`
  };

  const updateBookmark = async (article: Article) => {
    const article_id = article["id"]
    const value = !article['bookmark']
    try {
      const response = await fetch('/api/articles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_id: article_id,
          is_bookmarked: value,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bookmark');
      }
      await fetchArticles();
      const result = await response.json();
      console.log('Bookmark synced to database:', result);
      setBookmarkLoader(false)
      setBookmarkLoaderUUID('')
    } catch (error) {
      console.error('Database Sync Error:', error);
      setBookmarkLoader(false)
      alert("Could not save bookmark. Please try again.");
    }
  }

  const handleBookmark = async (article: Article) => {
    setBookmarkLoader(true)
    setBookmarkLoaderUUID(article?.id)
    await updateBookmark(article)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">NewsFlow</h1>
          </div>

          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search news..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
            <div className="w-10 h-10 bg-gray-300 rounded-full" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Top Story */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Story</h2>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-xl mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ) : articles.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-2/5 relative bg-gray-100 p-4">
                {articles[0].image_url ? (
                  <img
                    src={articles[0].image_url}
                    alt={articles[0].title}
                    className="w-full h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-full h-56 flex items-center justify-center text-gray-400 rounded-xl bg-gray-200">
                    <Newspaper className="w-16 h-16" />
                  </div>
                )}
              </div>

              <div className="md:w-3/5 p-8">
                <div className='flex justify-between'>
                  <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full mb-3">
                    Featured News
                  </span>
                  <div>
                    {bookmarkLoader && bookmarkLoaderUUID==articles[0]?.id ? <LoaderCircle className='text-emerald-500 animate-spin' /> :
                      <Bookmark onClick={() => handleBookmark(articles[0])}
                        className={`w-6 h-6 transition-colors cursor-pointer ${articles[0].bookmark === true
                          ? 'text-emerald-500 fill-emerald-500' :
                          'text-emerald-500 fill-none'
                          }`}
                      />
                    }
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {articles[0].title}
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed text-sm line-clamp-3">
                  {articles[0].summary}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDistanceToNow(new Date(articles[0].created_at))}
                  </span>

                  <a
                    href={articles[0].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition"
                  >
                    Read Full Story
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
              No articles available
            </div>
          )}
        </section>

        {/* Quick Insights */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <InsightCard icon={<Newspaper className="w-6 h-6 text-emerald-500" />} title="Total Articles" value={`${insights.totalArticles}+`} description="News articles published this month." />
            <InsightCard icon={<TrendingUp className="w-6 h-6 text-emerald-500" />} title="Trending Topics" value={insights.trendingTopics.toString()} description="Currently popular topics across all categories." />
            <InsightCard icon={<Bookmark className="w-6 h-6 text-emerald-500" />} title="Saved For Later" value={insights.savedForLater.toString()} description="Articles bookmarked for offline reading." />
            <InsightCard icon={<Clock className="w-6 h-6 text-emerald-500" />} title="Reading Time" value={insights.readingTime} description="Estimated time spent reading this week." />
          </div>
          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Left side can be NotificationSettings later */}
            <NotificationSettings />
            <NewsTrendsChart />
          </section>

        </section>

        {/* Explore Categories */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Categories</h2>
          <div className="flex gap-3 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {loading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              ))
              : articles.slice(1, 10).map((article, index) => (
                <NewsCard key={index} article={article} handleBookmark={handleBookmark} bookmarkLoader={bookmarkLoader} bookmarkLoaderUUID={bookmarkLoaderUUID} />
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

function InsightCard({ icon, title, value, description }: InsightCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function NewsCard({ article, handleBookmark,bookmarkLoader,bookmarkLoaderUUID }: { article: Article, handleBookmark: (article: Article) => void,bookmarkLoader:boolean,bookmarkLoaderUUID:string }) {
  return (
    <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">

      <div className=" bg-gray-100 p-3">
        {article.image_url ? (
          <img src={article.image_url} alt={article.title} className="w-full h-40 object-contain rounded-xl" />
        ) : (
          <div className="w-full h-40 flex items-center justify-center text-gray-400 rounded-xl bg-gray-200">
            <Newspaper className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4 z-1"> {/* ABSOLUTE CHILD */}
        {bookmarkLoader && bookmarkLoaderUUID===article.id ? <LoaderCircle className='text-emerald-500 animate-spin' /> :
          <Bookmark onClick={() => handleBookmark(article)}
            className={`w-6 h-6 transition-colors cursor-pointer ${article.bookmark === true
              ? 'text-emerald-500 fill-emerald-500' :
              'text-emerald-500 fill-none'
              }`}
          />
        }
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-600 mb-3 line-clamp-2 text-xs leading-relaxed">
          {article.summary}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(article.created_at))}
          </span>

          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 font-medium hover:text-emerald-600 transition text-xs"
          >
            Read More
          </a>
        </div>
      </div>
    </div>
  );
}