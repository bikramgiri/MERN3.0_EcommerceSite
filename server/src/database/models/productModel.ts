import {Table, Column, Model, DataType, AllowNull} from 'sequelize-typescript'

@Table({
    tableName : "products", 
    modelName : "Product", 
    timestamps : true
})

class Product extends Model{
    @Column({
        primaryKey : true, 
        type : DataType.UUID, 
        defaultValue : DataType.UUIDV4 
    })
    declare id:string

    @AllowNull(false)
    @Column({
        type : DataType.STRING
    })
    declare productName:string

    @AllowNull(true)
    @Column({
        type : DataType.STRING
    })
    declare productImage:string

    @AllowNull(false)
    @Column({
        type : DataType.TEXT 
    })
    declare productDescription:string

    @AllowNull(false)
    @Column({
        type : DataType.FLOAT 
    })
    declare productPrice:number

    @AllowNull(false)
    @Column({
        type : DataType.INTEGER
    })
    declare productStock:number

    @AllowNull(false)
    @Column({
        type : DataType.INTEGER
    })
    declare productDiscount:number
}

export default Product