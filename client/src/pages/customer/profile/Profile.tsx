import Breadcrumb from "../../../global/Breadcrumb";
import AdminProfile from "../../admin/Profile";

export default function Profile() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-6 md:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumb items={[{ label: "Profile" }]} />
        <AdminProfile />
      </div>
    </div>
  );
}
