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
        validate : {
            len : {
                args : [1, 10],
                msg : "Quantity must be between 1 and 10 characters."
            }
        }
    })
    declare quantity:number

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