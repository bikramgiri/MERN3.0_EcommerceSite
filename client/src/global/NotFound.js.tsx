import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link
          to="/"
          className="px-6 py-3 bg-[#E6540B] hover:bg-[#E6540B]/80 text-white rounded-xl font-semibold transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;