import { useAppSelector } from "./hooks";
import { UserRole } from "../types/customer/authTypes";

/**
 * True when the signed-in user is an admin. Admins can browse the storefront,
 * but cart, wishlist and checkout are customer-only.
 */
const useIsAdmin = () => {
  const role = useAppSelector((state) => state.auth.user?.role);
  return role === UserRole.Admin;
};

export default useIsAdmin;
