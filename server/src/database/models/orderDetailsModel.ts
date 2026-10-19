import {Table, Column, Model, DataType, AllowNull, BelongsTo, ForeignKey} from 'sequelize-typescript'
import Order from './orderModel';
import Product from './productModel';

@Table({
    tableName : "order_details", 
    modelName : "OrderDetails", 
    timestamps : true
})

class OrderDetails extends Model{
    @Column({
        primaryKey : true, 
        type : DataType.UUID, 
        defaultValue : DataType.UUIDV4 
    })
    declare id:string

    @AllowNull(false)
    @Column({
        type : DataType.INTEGER,
        validate: { min: { args: [1], msg: "Quantity must be at least 1." } }
    })
    declare quantity:number

  // Price of one item when it was ordered, so later price changes don't rewrite past orders
  // (null on lines saved before this column existed)
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: null })
  declare unitPrice: number | null;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID })
  declare orderId: string;

  @BelongsTo(() => Order)
  declare Order: Order;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID })
  declare productId: string;

  @BelongsTo(() => Product)
  declare Product: Product;
}

export default OrderDetails