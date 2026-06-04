import {Table, Column, Model, DataType, AllowNull, ForeignKey} from 'sequelize-typescript'
import { OrderStatus } from '../../types'
import Payment from './paymentModel'

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

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    validate: {
      len: {
        args: [4, 20],
        msg: "Shipping address must be between 4 and 20 characters.",
      },
    },
  })
  declare shippingAddress: string;

  @AllowNull(false)
  @Column({
    type: DataType.FLOAT,
  })
  declare totalAmount: number;

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
}

export default Order