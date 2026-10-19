import {Table, Column, Model, DataType, AllowNull, ForeignKey, BelongsTo} from 'sequelize-typescript'
import { OrderStatus } from '../../types'
import Payment from './paymentModel'
import User from './userModel';

@Table({
  tableName: "orders",
  modelName: "Order",
  timestamps: true,
})
class Order extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        args: [10, 10],
        msg: "Phone number must be exactly 10 characters.",
      },
    },
  })
  declare phoneNumber: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        args: [4, 200],
        msg: "Shipping address must be between 4 and 200 characters.",
      },
    },
  })
  declare shippingAddress: string;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(10, 2),
  })
  declare totalAmount: number;

  // Price breakdown saved when the order is placed (null on orders placed before
  // these columns existed): items subtotal - discount + delivery = totalAmount
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: null })
  declare subtotalAmount: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: null })
  declare shippingFee: number | null;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare discountAmount: number;

  @Column({ type: DataType.STRING(40), allowNull: true, defaultValue: null })
  declare couponCode: string | null;

  @Column({
    // type : DataType.ENUM(...Object.values(OrderStatus)),
    // *OR
    type: DataType.ENUM(
      OrderStatus.Pending,
      OrderStatus.Cancelled,
      OrderStatus.Delivered,
      OrderStatus.Preparation,
      OrderStatus.InTransit,
    ),
    allowNull: false,
    defaultValue: OrderStatus.Pending,
  })
  declare orderStatus: string;

  @ForeignKey(() => Payment)
  @Column({ type: DataType.UUID })
  declare paymentId: string;

  @BelongsTo(() => Payment)
  declare Payment: Payment;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID })
  declare userId: string;

  @BelongsTo(() => User)
  declare User: User;
}

export default Order