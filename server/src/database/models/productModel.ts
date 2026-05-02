import {Table, Column, Model, DataType, AllowNull, ForeignKey, BelongsTo} from 'sequelize-typescript'
import Category from './categoryModel'
import User from './userModel'

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

    @ForeignKey(() => Category)
    @AllowNull(false)
    @Column({ type: DataType.UUID })
    declare categoryId: string

    @ForeignKey(() => User)
    @AllowNull(false)
    @Column({ type: DataType.UUID })
    declare userId: string

    @BelongsTo(() => Category)
    declare category: Category

    @BelongsTo(() => User)
    declare owner: User
}

export default Product