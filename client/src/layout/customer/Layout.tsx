import { Outlet } from "react-router-dom";
import Header from "../../components/customer/header/Header";
import Footer from "../../components/customer/footer/Footer";

const Layout = () => {
  return (
    <div className="flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
