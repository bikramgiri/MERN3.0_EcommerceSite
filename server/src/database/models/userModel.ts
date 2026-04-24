import {Table, Column, Model, DataType, AllowNull} from 'sequelize-typescript'

@Table({
    tableName : "users", 
    modelName : "User", 
    timestamps : true
})

class User extends Model{
    @Column({
        primaryKey : true, 
        type : DataType.UUID, // Universally Unique Identifier
        defaultValue : DataType.UUIDV4 // Automatically generates a unique UUID when a new record is created
    })
    declare id:string

    @Column({
        type : DataType.STRING
    })
    declare username:string

    @Column({
        type : DataType.STRING
    })
    declare email:string

    @Column({
        type : DataType.STRING
    })
    declare password:string 

    @Column({
        type : DataType.ENUM('customer','admin'), 
        defaultValue : 'customer'
    })
    declare role:string

    @AllowNull(true)
    @Column({
        type : DataType.STRING,
    })
    declare otp:string | null

    @AllowNull(true)
    @Column({
        type : DataType.DATE,
    })
    declare otpGeneratedTime:Date | null

    @AllowNull(true)
    @Column({
        type : DataType.STRING,
    })
    declare resetPasswordToken:string | null
}

export default User