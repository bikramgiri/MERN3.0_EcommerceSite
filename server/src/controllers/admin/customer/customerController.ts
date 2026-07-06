import { Request, Response } from "express";
import User from "../../../database/models/userModel";
import { AuthRequest } from "../../../middleware/authMiddleware";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";

class CustomerController {
  // Fetch all customers
  // public static async fetchAllCustomers(req: Request, res: Response): Promise<void> {
  //       const users = await User.findAll({where: {role: 'customer'}, attributes:{exclude: ['password', 'otp', 'otpGeneratedTime', 'resetPasswordToken', 'createdAt', 'updatedAt']}});
  //       if (users.length === 0) {
  //             res.status(404).json({
  //                   message: "No customers found",
  //                   field: "users"
  //              }
  //             );
  //             return;
  //       }

  //       res.status(200).json({
  //             message: "Customers fetched successfully",
  //             totalCustomers: users.length,
  //             data: users
  //        });
  //        return;
  // }

  public static async fetchAllCustomers(
    req: Request,
    res: Response,
  ): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: { role: "customer" },
      attributes: {
        exclude: [
          "password",
          "otp",
          "otpGeneratedTime",
          "resetPasswordToken",
          "createdAt",
          "updatedAt",
        ],
      },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    if (count === 0) {
      res.status(404).json({ message: "No customers found", field: "users" });
      return;
    }

    res.status(200).json({
      message: "Customers fetched successfully",
      totalCustomers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: users,
    });
  }

  // Delete a customer
  public static async deleteCustomer(req: AuthRequest, res: Response) {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        message: "Customer ID is required",
        field: "id",
      });
    }

    const user = await User.findByPk(userId as string);
    if (!user || user.role !== "customer") {
      return res
        .status(404)
        .json({ message: "Customer not found", field: "user" });
    }

    // Delete avatar from Cloudinary before removing the user
    if (user.avatar) {
      const publicId = getPublicIdFromAvatar(user.avatar);
      if (publicId) {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log("Customer avatar deleted from Cloudinary:", result);
        } catch (error) {
          console.error("Error deleting customer avatar from Cloudinary:", error);
        }
      }
    }

    await user.destroy();

    return res.status(200).json({
      message: "Customer deleted successfully",
    });
  }
}

export default CustomerController;
