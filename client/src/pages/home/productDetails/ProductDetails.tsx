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
      <SingleProduct productId={id} />
      <Review productId={id} />
    </>
  );
};

export default ProductDetails;