import {Table, Column, Model, DataType, AllowNull} from 'sequelize-typescript'

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
}

export default OrderDetails