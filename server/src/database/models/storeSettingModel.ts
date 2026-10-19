import { Table, Column, Model, DataType } from "sequelize-typescript";

// Single-row table (id is always 1) holding store-wide settings managed by the admin
@Table({
  tableName: "store_settings",
  modelName: "storeSetting",
  timestamps: true,
})
class StoreSetting extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare id: number;

  // Store details
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "Truvora" })
  declare storeName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "support@truvora.com",
  })
  declare supportEmail: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "+977 9801234567",
  })
  declare supportPhone: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "Kathmandu, Bagmati, Nepal",
  })
  declare address: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "NPR (Rs.)" })
  declare currency: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "TRV-" })
  declare orderPrefix: string;

  // Social media profile links shown in the storefront footer (empty = hidden)
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "" })
  declare facebookUrl: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "" })
  declare instagramUrl: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "" })
  declare xUrl: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "" })
  declare linkedinUrl: string;

  // Orders & shipping
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 100 })
  declare standardShippingFee: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 2000 })
  declare freeShippingThreshold: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare enableCod: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare enableOnlinePayment: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 5 })
  declare lowStockThreshold: number;

  // Delivery estimates and return window shown in the FAQ, Terms and About page
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "Kathmandu Valley" })
  declare localDeliveryArea: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "1–2 business days" })
  declare localDeliveryTime: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: "3–5 business days" })
  declare otherDeliveryTime: string;

  // Days after delivery to report a damaged, faulty or wrong item (0 = not shown)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 7 })
  declare returnWindowDays: number;

  // Admin notifications
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare orderNotificationsEmail: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare lowStockAlertsEmail: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare customerReviewAlerts: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare dashboardSoundAlerts: boolean;

  // Maintenance
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare maintenanceMode: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue:
      "We are currently updating our store to serve you better. We'll be back shortly!",
  })
  declare maintenanceMessage: string;

  // Admin who last changed the settings
  @Column({ type: DataType.UUID, allowNull: true, defaultValue: null })
  declare updatedBy: string | null;
}

export default StoreSetting;
