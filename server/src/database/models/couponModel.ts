import { Table, Column, Model, DataType } from "sequelize-typescript";

export type DiscountType = "PERCENT" | "FIXED";

@Table({
  tableName: "coupons",
  modelName: "Coupon",
  timestamps: true,
})
class Coupon extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  // Always stored in upper case, so codes match whatever case the shopper types
  @Column({ type: DataType.STRING(40), allowNull: false, unique: true })
  declare code: string;

  // Short note shown to the shopper when the code is applied, e.g. "10% off for new customers"
  @Column({ type: DataType.STRING(200), allowNull: false, defaultValue: "" })
  declare description: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { isIn: [["PERCENT", "FIXED"]] },
  })
  declare discountType: DiscountType;

  // Percentage (1–100) for PERCENT, rupees for FIXED
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare discountValue: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare minOrderAmount: number;

  // Upper limit for percentage discounts (null = no limit)
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: null })
  declare maxDiscountAmount: number | null;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare startsAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare expiresAt: Date | null;

  // Total redemptions allowed across all customers (null = unlimited)
  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: null })
  declare usageLimit: number | null;

  // Redemptions allowed per customer (null = unlimited)
  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 1 })
  declare perUserLimit: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  // Only customers who haven't ordered before can use it
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare firstOrderOnly: boolean;

  // Offered to new customers: in their welcome notification and at their first checkout (one coupon at a time)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare showToNewCustomers: boolean;

  // Shown in the announcement bar at the top of the storefront (one coupon at a time)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare showOnSite: boolean;

  // Custom announcement text, e.g. "Dashain sale: 15% off everything" (empty = generated from the discount)
  @Column({ type: DataType.STRING(120), allowNull: false, defaultValue: "" })
  declare bannerText: string;

  // Last time the code was emailed to newsletter subscribers
  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare lastEmailedAt: Date | null;
}

export default Coupon;
