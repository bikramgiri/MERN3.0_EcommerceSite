import {
      Table,
      Column,
      Model,
      DataType,
      BelongsTo,
      ForeignKey
} from 'sequelize-typescript';
import User from './userModel';
import Product from './productModel';

@Table({
      tableName: 'carts',
      modelName: 'cart',
      timestamps: true,
      indexes: [
            {
                  unique: true,
                  fields: ['userId', 'productId']
            }
      ]
})

class Cart extends Model {
      @Column({
            primaryKey : true,
            type : DataType.UUID,
            defaultValue : DataType.UUIDV4
      })
      declare id : string;

      @Column({
            type : DataType.INTEGER,
            defaultValue : 1,
            allowNull : false
      })
      declare quantity : number;

      @ForeignKey(() => User)
      @Column({
            type : DataType.UUID,
            allowNull : false
      })
      declare userId : string;

      @ForeignKey(() => Product)
      @Column({
            type : DataType.UUID,
            allowNull : false
      })
      declare productId : string;

      @BelongsTo(() => User)
      declare user : User;

      @BelongsTo(() => Product)
      declare product : Product;
}

export default Cart;