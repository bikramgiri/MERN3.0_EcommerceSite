import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import User from "../../database/models/userModel";
import getFullImageUrl from "../../services/imageHandler";
import { cloudinary } from "../../cloudinary";
import { getPublicIdFromAvatar } from "../../services/cloudinaryHelper";
import crypto from "crypto";
import generateOtp from "../../services/generateOtp";
import { sendMail } from "../../services/sendMail";
import { getStoreSettings } from "../../services/storeSettingsService";

const EMAIL_CODE_MINUTES = 15;
const EMAIL_CODE_RESEND_SECONDS = 60;
const MAX_EMAIL_CODE_ATTEMPTS = 5;
const emailCodeAttempts = new Map<string, number>(); // userId -> wrong codes for the current request
const hashCode = (code: string) => crypto.createHash("sha256").update(code).digest("hex");
const PROFILE_FIELDS = ["id", "username", "email", "avatar", "role", "createdAt", "pendingEmail"];

const presentProfile = (user: User) => {
  const plain = user.toJSON();
  return {
    id: plain.id,
    username: plain.username,
    email: plain.email,
    role: plain.role,
    createdAt: plain.createdAt,
    pendingEmail: plain.pendingEmail ?? null,
    avatar: plain.avatar ? getFullImageUrl(plain.avatar) : null,
  };
};

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

    const profile = await User.findByPk(userId, { attributes: PROFILE_FIELDS });
    if (!profile) {
      res.status(404).json({ message: "Profile not found", field: "userId" });
      return;
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      data: presentProfile(profile),
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

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "Profile not found", field: "userId" });
      return;
    }

    const username = typeof req.body?.username === "string" ? req.body.username.trim() : undefined;
    // Saved lowercase, the same way login looks it up (a mixed-case address would lock the user out)
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : undefined;

    if (email !== undefined && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      res.status(400).json({ message: "Please enter a valid email address", field: "email" });
      return;
    }

    if (username !== undefined && (username.length < 3 || username.length > 20)) {
      res.status(400).json({
        message: "Username must be between 3 and 20 characters",
        field: "username",
      });
      return;
    }

    const emailChanging = email !== undefined && email !== user.email;
    if (emailChanging) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        res
          .status(400)
          .json({ message: "Email already in use", field: "email" });
        return;
      }
      if (
        user.pendingEmail === email &&
        user.pendingEmailCodeAt &&
        Date.now() - user.pendingEmailCodeAt.getTime() < EMAIL_CODE_RESEND_SECONDS * 1000
      ) {
        res.status(429).json({ message: "We just sent a code to this address. Please wait a minute before asking for another.", field: "email" });
        return;
      }
    }

    // The name changes straight away
    if (username !== undefined) user.username = username;

    // A new email only takes effect once the code sent to it is entered (proves the address is theirs
    // and has no typo, since order emails and password resets go there)
    let codeSentTo: string | null = null;
    if (emailChanging) {
      const code = generateOtp();
      user.pendingEmail = email!;
      user.pendingEmailCodeHash = hashCode(code);
      user.pendingEmailCodeAt = new Date();
      emailCodeAttempts.delete(user.id);
      const { storeName } = await getStoreSettings();
      try {
        await sendMail({
          to: email!,
          subject: `Confirm your new email for ${storeName || "Truvora"}`,
          text: `Your code to confirm this email address is ${code}. It's valid for ${EMAIL_CODE_MINUTES} minutes.\n\nIf you didn't ask to change your email, you can ignore this message.`,
        });
      } catch (error) {
        console.error("Email change code failed to send:", error);
        res.status(502).json({ message: "We couldn't send a code to that address. Check it and try again.", field: "email" });
        return;
      }
      codeSentTo = email!;
    }

    await user.save();
    res.status(200).json({
      message: codeSentTo
        ? `We sent a 6-digit code to ${codeSentTo}. Enter it to finish changing your email.`
        : "Profile updated successfully",
      data: presentProfile(user),
      pendingEmail: user.pendingEmail ?? null,
    });
  }

  // Finish an email change with the code sent to the new address
  public static async confirmEmailChange(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user?.id ? await User.findByPk(req.user.id) : null;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!user.pendingEmail || !user.pendingEmailCodeHash || !user.pendingEmailCodeAt) {
      res.status(400).json({ message: "There's no email change waiting to be confirmed.", field: "code" });
      return;
    }
    if (Date.now() - user.pendingEmailCodeAt.getTime() > EMAIL_CODE_MINUTES * 60 * 1000) {
      res.status(400).json({ message: "This code has expired. Save the new email again to get a new code.", field: "code" });
      return;
    }
    if (!/^\d{6}$/.test(code) || hashCode(code) !== user.pendingEmailCodeHash) {
      const attempts = (emailCodeAttempts.get(user.id) ?? 0) + 1;
      if (attempts >= MAX_EMAIL_CODE_ATTEMPTS) {
        emailCodeAttempts.delete(user.id);
        user.pendingEmail = null;
        user.pendingEmailCodeHash = null;
        user.pendingEmailCodeAt = null;
        await user.save();
        res.status(400).json({ message: "Too many wrong codes. Save the new email again to get a new code.", field: "code" });
        return;
      }
      emailCodeAttempts.set(user.id, attempts);
      res.status(400).json({ message: "That code isn't right. Check the email and try again.", field: "code" });
      return;
    }

    // Someone may have taken the address since the code was sent
    const taken = await User.findOne({ where: { email: user.pendingEmail } });
    if (taken && taken.id !== user.id) {
      res.status(409).json({ message: "This email is now used by another account.", field: "code" });
      return;
    }

    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.isVerified = true;
    user.pendingEmail = null;
    user.pendingEmailCodeHash = null;
    user.pendingEmailCodeAt = null;
    await user.save();
    emailCodeAttempts.delete(user.id);

    // Tell the old address, in case the change wasn't the owner's doing
    const { storeName, supportEmail } = await getStoreSettings();
    sendMail({
      to: oldEmail,
      subject: `Your ${storeName || "Truvora"} email was changed`,
      text: `The email on your account was changed to ${user.email}.\n\nIf you didn't do this, contact us${supportEmail ? ` at ${supportEmail}` : ""} straight away.`,
    }).catch((error) => console.error("Email change notice failed to send:", error));

    res.status(200).json({ message: "Your email has been changed.", data: presentProfile(user) });
  }

  // Drop an email change that hasn't been confirmed
  public static async cancelEmailChange(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user?.id ? await User.findByPk(req.user.id) : null;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    user.pendingEmail = null;
    user.pendingEmailCodeHash = null;
    user.pendingEmailCodeAt = null;
    await user.save();
    emailCodeAttempts.delete(user.id);
    res.status(200).json({ message: "Email change cancelled.", data: presentProfile(user) });
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
