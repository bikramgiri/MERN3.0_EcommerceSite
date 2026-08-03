import Breadcrumb from "../../../global/Breadcrumb";
import ProfileInfo from "./components/ProfileInfo";

export default function Profile() {
  return (
    <div className="bg-gray-50 py-6 md:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Profile" }]} />

        <div className="border-2 border-gray-200 bg-white p-4 sm:p-5 lg:p-6 rounded-md">
          <ProfileInfo />
        </div>
      </div>
    </div>
  );
}
