// import { useSidebar } from "../context/SidebarContext";

// export default function SidebarWidget() {
//     const { isExpanded, isMobileOpen, isHovered} = useSidebar();
  
//   return (
//      <div className="border-t border-gray-200  p-4 mt-auto">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 text-2xl rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
//             A
//           </div>
//           {(isExpanded || isHovered || isMobileOpen) && (
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-medium text-gray-700 truncate">
//                 Admin User
//               </p>
//               <p className="text-xs text-gray-600 truncate">
//                 admin@gmail.com
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//   );
// }



import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/hooks";
import { logoutUser } from "../../store/auth/authSlice";
import { useSidebar } from "../../context/SidebarContext";

export default function SidebarWidget() {
      const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isExpanded, isMobileOpen, isHovered} = useSidebar();
        const handleLogOut = () => {
        dispatch(logoutUser());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login?logout=true");
      };
  
  return (
     <div onClick={handleLogOut} className="border-t border-gray-300 cursor-pointer transition-colors hover:bg-red-50 p-4 mt-auto">
        <div className="flex text-red-600 items-center gap-2">
          <div className="flex-shrink-0 px-3">
            <LogOut className="h-7 w-7" />
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="min-w-0">
              <p 
              className="focus:outline-none focus:ring-0 cursor-pointer text-xl font-medium truncate items-center">
               Log out
              </p>
            </div>
          )}
        </div>
      </div>
  );
}
