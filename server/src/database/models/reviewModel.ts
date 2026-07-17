import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from "sequelize-typescript";
import User from "./userModel";
import Product from "./productModel";

@Table({
  tableName: "reviews",
  modelName: "review",
  timestamps: true,
})
class Review extends Model {
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
  declare User: User;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare productId: string;

  @BelongsTo(() => Product)
  declare Product: Product;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
  len: {
    args: [5, 100],
    msg: "Review must be between 5 and 100 characters.",
  },
},
  })
  declare message: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: "Rating must be at least 1.",
      },
      max: {
        args: [5],
        msg: "Rating must be at most 5.",
      },
    },
  })
  declare rating: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  declare reviewImage: string | null;
}

export default Review;
