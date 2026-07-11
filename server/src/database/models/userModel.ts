import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
} from "sequelize-typescript";
import { UserRole } from "../../types";
import Product from "./productModel";
import { Association, BelongsToManyAddAssociationMixin, BelongsToManyHasAssociationMixin, BelongsToManyRemoveAssociationMixin } from "sequelize";

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
  })
  declare username: string;

  @Column({
    type: DataType.STRING,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
  })
  declare password: string;

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
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isVerified: boolean;

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

  declare addWishlistProduct: BelongsToManyAddAssociationMixin<Product, string>;
  declare removeWishlistProduct: BelongsToManyRemoveAssociationMixin<Product, string>;
  declare hasWishlistProduct: BelongsToManyHasAssociationMixin<Product, string>;

  declare static associations: { 
    WishlistProducts: Association<User, Product>;
  };
}

export default User;
