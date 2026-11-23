import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
} from "sequelize-typescript";
import { UserRole } from "../../types";
import Product from "./productModel";
import { Association} from "sequelize";

@Table({
  tableName: "users",
  modelName: "User",
  timestamps: true,
})
class User extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID, // Universally Unique Identifier
    defaultValue: DataType.UUIDV4, // Automatically generates a unique UUID when a new record is created
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  // Null for accounts created with Google sign-in (until a password is set via Forgot password)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare password: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare avatar: string;

  @Column({
    type: DataType.ENUM(UserRole.Customer, UserRole.Admin),
    defaultValue: UserRole.Customer,
  })
  declare role: UserRole;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare googleId: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isVerified: boolean;

  // Blocked customers can't sign in or use their account; their orders and reviews stay
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isBlocked: boolean;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare blockedAt: Date | null;

  // Login tokens issued before this moment stop working (signs out every device after a password change)
  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare passwordChangedAt: Date | null;

  // A new email waiting for its code to be entered; the account keeps the old email until then
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: null })
  declare pendingEmail: string | null;

  // SHA-256 of the 6-digit code sent to pendingEmail, and when it was sent
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: null })
  declare pendingEmailCodeHash: string | null;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare pendingEmailCodeAt: Date | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
  })
  declare emailVerificationToken: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
  })
  declare emailVerificationTokenGeneratedTime: Date | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
  })
  declare otp: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
  })
  declare otpGeneratedTime: Date | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
  })
  declare resetPasswordToken: string | null;

  declare static associations: {
    WishlistProducts: Association<User, Product>;
  };
}

export default User;
