import { Outlet } from "react-router-dom";
import Header from "../../components/customer/header/Header";
import Footer from "../../components/customer/footer/Footer";
import MaintenanceBanner from "../../components/customer/header/components/MaintenanceBanner";
import AnnouncementBar from "../../components/customer/header/components/AnnouncementBar";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8ED]">
      <Header />
      {/* The visible banner lives in the fixed header; this keeps page content below it */}
      <MaintenanceBanner placeholder />
      <AnnouncementBar placeholder />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
