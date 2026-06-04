import {Table, Column, Model, DataType, AllowNull} from 'sequelize-typescript'
import { PaymentMethod, PaymentStatus } from '../../types'

@Table({
    tableName : "payments", 
    modelName : "Payment", 
    timestamps : true
})

class Payment extends Model{
    @Column({
        primaryKey : true, 
        type : DataType.UUID, 
        defaultValue : DataType.UUIDV4 
    })
    declare id:string

    @Column({
            type : DataType.ENUM(...Object.values(PaymentMethod)), 
            // *OR
            // type : DataType.ENUM(PaymentMethod.COD, PaymentMethod.Khalti, PaymentMethod.Esewa),
            allowNull : false,
            defaultValue : PaymentMethod.COD
    })
    declare paymentMethod:string

    @AllowNull(false)
    @Column({
        // type : DataType.ENUM(...Object.values(PaymentStatus)), 
        // *OR
        type : DataType.ENUM(PaymentStatus.Pending, PaymentStatus.Paid, PaymentStatus.Failed),
        defaultValue : PaymentStatus.Pending

    })
    declare paymentStatus:string

    @AllowNull(true)
    @Column({
        type : DataType.STRING,
    })
    declare pidx:string | null; // Payment ID from the gateway, optional for COD
}

export default Payment