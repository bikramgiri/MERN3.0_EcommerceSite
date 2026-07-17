import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  AllowNull,
  BelongsTo,
} from "sequelize-typescript";
import User from "./userModel";
import Product from "./productModel";

@Table({
  tableName: "wishlists",
  modelName: "Wishlist",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["userId", "productId"] },
  ],
})
class Wishlist extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare productId: string;

  @BelongsTo(() => Product)
  declare product: Product;
}

export default Wishlist;
