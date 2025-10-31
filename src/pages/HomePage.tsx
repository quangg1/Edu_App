import { BookOpen, Presentation, ArrowRight, Sparkles } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: 'multiple-choice' | 'presentation') => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          AI-Powered Teacher Tools
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Save hours of planning time with intelligent tools that help you create engaging assessments and clear rubrics instantly
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onNavigate('multiple-choice')}
          className="group bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-8 hover:border-blue-300 hover:shadow-lg transition-all text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-4 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Multiple Choice Generator
          </h2>
          <p className="text-gray-600 mb-4">
            Create engaging multiple choice questions with detailed explanations. Perfect for quizzes, tests, and practice materials.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">
              Auto-generate
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">
              Answer keys
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">
              Export ready
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('presentation')}
          className="group bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-8 hover:border-purple-300 hover:shadow-lg transition-all text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-4 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Presentation className="w-8 h-8 text-purple-600" />
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Presentation Generator
          </h2>
          <p className="text-gray-600 mb-4">
            Transform your documents into engaging presentations automatically. Create professional slides from PDF or Word files.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full font-medium">
              Auto-format
            </span>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full font-medium">
              PowerPoint export
            </span>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full font-medium">
              Smart layout
            </span>
          </div>
        </button>
      </div>

      <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Why Use AI Teacher Tools?
        </h3>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">Save Time</h4>
            <p className="text-sm text-gray-600">
              Generate quality assessments in seconds instead of hours
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h4 className="font-semibold text-gray-900 mb-2">Stay Consistent</h4>
            <p className="text-sm text-gray-600">
              Maintain high standards across all your materials
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">✨</div>
            <h4 className="font-semibold text-gray-900 mb-2">Focus on Teaching</h4>
            <p className="text-sm text-gray-600">
              Spend less time on admin and more time with students
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
