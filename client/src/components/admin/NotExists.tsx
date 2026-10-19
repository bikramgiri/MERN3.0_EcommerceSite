import { Link } from "react-router-dom";

const NotExists = () => {
  return (
    <div className="py-40 flex items-center justify-center bg-gray-50 dark:bg-[#14110F]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-[#F5EFE6] mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-[#F5EFE6]/70 mb-8">Page not found</p>
        <Link
          to="/admin-dashboard"
          className="px-6 py-3 bg-[#E6540B] hover:bg-[#d44c0a] text-white rounded-xl font-semibold transition-colors"
        >
          Go Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotExists;