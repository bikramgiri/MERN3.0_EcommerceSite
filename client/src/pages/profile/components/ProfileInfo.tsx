import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchProfile } from "../../../store/auth/authSlice";
import { toast } from "react-toastify";
import { UserData } from "../../../types/authTypes";
import Avatar from "./Avatar";
import EditProfile from "../EditProfile";

export default function ProfileInfo() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const [showModal, setShowModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserData | null>(null);

  const openEditModal = (profile: UserData) => {
    setSelectedProfile(profile);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProfile(null);
  };

  const handleSuccess = () => {
    dispatch(fetchProfile());
    toast.success("Profile updated successfully!");
  };

  return (
    <>
      <div className="flex flex-col gap-2 font-['Inter',sans-serif]">
        <div className="flex items-center justify-between">
          <h4 className="font-['Fraunces',serif] text-2xl font-semibold text-[#1A1613]">
            Personal Information
          </h4>
          <button
            onClick={() => openEditModal(user)}
            className="flex cursor-pointer items-center gap-2 rounded-sm bg-[#E6540B] px-4 py-2 text-sm font-medium text-[#FDF8ED] hover:bg-[#c94806] transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>

        <Avatar />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 2xl:gap-x-32 border-t border-[#1A1613]/10 pt-5">
          <div>
            <p className="mb-1 text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.15em] text-[#1A1613]/55">
              Name
            </p>
            <p className="text-lg font-medium text-[#1A1613]">
              {user?.username || "Admin"}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.15em] text-[#1A1613]/55">
              Email address
            </p>
            <p className="text-lg font-medium text-[#1A1613] break-all">
              {user?.email || "user@gmail.com"}
            </p>
          </div>
        </div>
      </div>

      {showModal && selectedProfile && (
        <EditProfile
          user={selectedProfile}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}