import { useParams } from 'react-router-dom';
import SingleProduct from './components/product/SingleProduct'
import Review from './components/review/Review';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();

  if (!id || id === 'undefined') {
    return (
      <div className="text-center py-20 text-xl text-red-600">
        Invalid or missing product ID in URL
      </div>
    );
  }

  return (
    <>
      {/* key resets quantity, review filters and paging when moving to another product */}
      <SingleProduct key={`product-${id}`} productId={id} />
      <Review key={`reviews-${id}`} productId={id} />
    </>
  );
};

export default ProductDetails;