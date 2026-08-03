import { X, Loader2, Plus, Edit } from "lucide-react";
import { UserData } from "../../../../types/customer/authTypes";

interface ProfileFormModalProps {
  type: "edit" | "add";
  profile?: UserData | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onDiscard: () => void;
  isSubmitting: boolean;
  formData: UserData;
}

const ProfileFormModal = ({
  type,
  profile,
  onClose,
  onSubmit,
  onChange,
  onDiscard,
  isSubmitting,
  formData,
}: ProfileFormModalProps) => {
  const isEdit = type === "edit";

  const isFormInvalid = () => {
    if (isEdit) {
      const noChange =
        formData.username.trim() === (profile?.username || "") &&
        formData.email.trim() === (profile?.email || "");

      return noChange;
    }

    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1613]/50 px-4 overflow-y-auto font-['Inter',sans-serif]">
      <div className="w-full max-w-xl my-8 bg-[#FDF8ED] rounded-sm shadow-xl border border-[#1A1613]/10 flex flex-col max-h-[76vh]">
        <div className="flex items-center justify-between px-8 py-5 bg-orange-400 rounded-t-sm">
          <h2 className="font-['Fraunces',serif] text-2xl font-semibold text-[#FDF8ED]">
            {isEdit ? "Edit Profile" : "Add New Profile"}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-full hover:bg-[#FDF8ED]/10 transition"
          >
            <X className="h-6 w-6 text-[#FDF8ED]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FDF8ED]">
          <form onSubmit={onSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.15em] text-[#1A1613]/60 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={onChange}
                className="w-full px-3 py-3 bg-white border border-[#1A1613]/15 rounded-sm text-[#1A1613] focus:ring-1 focus:ring-[#E6540B]/30 focus:border-[#E6540B] outline-none transition-all placeholder-[#1A1613]/35"
              />
            </div>

            <div>
              <label className="block text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.15em] text-[#1A1613]/60 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={onChange}
                className="w-full px-3 py-3 bg-white border border-[#1A1613]/15 rounded-sm text-[#1A1613] focus:ring-1 focus:ring-[#E6540B]/30 focus:border-[#E6540B] outline-none transition-all placeholder-[#1A1613]/35"
              />
            </div>

            <div className="flex gap-4 pt-6 pb-6 sticky bottom-0 bg-[#FDF8ED] border-t border-[#1A1613]/10">
              <button
                type="submit"
                disabled={isSubmitting || isFormInvalid()}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[#FDF8ED] font-medium rounded-sm transition ${
                  isSubmitting || isFormInvalid()
                    ? "bg-[#E6540B]/40 cursor-not-allowed"
                    : "bg-[#E6540B] hover:bg-[#c94806] cursor-pointer"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin inline-block w-5 h-5 mr-2" />
                    {isEdit ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {isEdit ? (
                      <Edit className="inline-block w-4 h-4" />
                    ) : (
                      <Plus className="inline-block w-4 h-4" />
                    )}
                    {isEdit ? "Update Profile" : "Add Profile"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDiscard}
                className="cursor-pointer flex-1 px-6 py-3 border border-[#1A1613]/20 text-[#1A1613] font-medium rounded-sm hover:bg-[#1A1613]/5 transition"
              >
                <X className="inline-block w-5 h-5 mr-2" />
                Discard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileFormModal;
