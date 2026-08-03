import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm mb-4 ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-y-1">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center text-sm sm:text-lg font-medium text-[#1A1613] hover:text-[#E6540B] transition-colors whitespace-nowrap"
            aria-label="Home"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
            <span>Home</span>
          </Link>
        </li>

        {/* Dynamic path */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1613]/40 flex-shrink-0"
              aria-hidden="true"
            />
            {item.href ? (
              <Link
                to={item.href}
                className="text-[#1A1613] hover:text-[#E6540B] transition-colors text-sm sm:text-lg font-medium whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[#E6540B] text-sm sm:text-lg font-semibold whitespace-nowrap">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;