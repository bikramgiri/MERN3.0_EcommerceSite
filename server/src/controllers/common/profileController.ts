import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import User from "../../database/models/userModel";
import getFullImageUrl from "../../services/imageHandler";
import { cloudinary } from "../../cloudinary";
import { getPublicIdFromAvatar } from "../../services/cloudinaryHelper";

class ProfileController {
  // fetch My Profile
  public static async fetchMyProfile(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await User.findByPk(userId, {
      attributes: ["id", "username", "email", "avatar", "role", "createdAt"],
    });
    if (!profile) {
      res.status(404).json({ message: "Profile not found", field: "userId" });
      return;
    }

    const plainProfile = profile.toJSON();
    const profileWithAvatar = {
      ...plainProfile,
      avatar: plainProfile.avatar ? getFullImageUrl(plainProfile.avatar) : null,
    };

    res.status(200).json({
      message: "Profile fetched successfully",
      data: profileWithAvatar,
    });
  }

  // update My Profile
  public static async updateMyProfile(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "username", "email", "avatar", "role", "createdAt"],
    });
    if (!user) {
      res.status(404).json({ message: "Profile not found", field: "userId" });
      return;
    }

    const { username, email } = req.body;

    if (username && (username.length < 3 || username.length > 20)) {
      res.status(400).json({
        message: "Username must be between 3 and 20 characters",
        field: "username",
      });
      return;
    }

    if (email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        res
          .status(400)
          .json({ message: "Email already in use", field: "email" });
        return;
      }
    }

    const updateProfile = await user.update({ username, email });

    res.status(200).json({
      message: "Profile updated successfully",
      data: updateProfile,
    });
  }

  // Update My Avatar
  public static async updateMyAvatar(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "username", "email", "avatar", "role", "createdAt"],
    });
    if (!user) {
      res.status(404).json({ message: "Profile not found", field: "userId" });
      return;
    }

    let fileName = user.avatar;
    let avatar = fileName ? getFullImageUrl(fileName) : null;

    // handle avatar update if a new file is uploaded
    const cloudinaryResult = (req as any).cloudinaryResult;
    if (cloudinaryResult && cloudinaryResult.secure_url) {
      if (user.avatar) {
        const oldPublicId = getPublicIdFromAvatar(user.avatar);
        if (oldPublicId) {
          cloudinary.uploader.destroy(
            oldPublicId,
            (error: any, result: any) => {
              if (error) {
                console.error(
                  "Error deleting old avatar from Cloudinary:",
                  error,
                );
              } else {
                console.log("Old avatar deleted from Cloudinary:", result);
              }
            },
          );
        }
      }

      avatar = cloudinaryResult.secure_url;
      fileName = cloudinaryResult.public_id;
    }

    const updateAvatar = await user.update({ avatar: fileName });

    const updatedAvatarUrl = {
      ...updateAvatar.toJSON(),
      avatar: avatar,
    };
    res.status(200).json({
      message: "Avatar updated successfully",
      data: updatedAvatarUrl,
    });
  }

  // Delete My Avatar
  public static async deleteMyAvatar(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "username", "email", "avatar", "role", "createdAt"],
    });
    if (!user) {
      res.status(404).json({ message: "Profile not found", field: "userId" });
      return;
    }

    if (user.avatar) {
      const publicId = getPublicIdFromAvatar(user.avatar);
      if (publicId) {
        cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
          if (error) {
            console.error("Error deleting avatar from Cloudinary:", error);
          } else {
            console.log("Avatar deleted from Cloudinary:", result);
          }
        });
      }
    }

    // Update the user's avatar to null
    const updatedUser = await user.update({ avatar: null });

    res.status(200).json({
      message: "Avatar deleted successfully",
      data: updatedUser,
    });
  }
}

export default ProfileController;
