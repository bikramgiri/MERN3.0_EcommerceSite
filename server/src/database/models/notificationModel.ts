import { Table, Column, Model, DataType } from "sequelize-typescript";

export type NotificationAudience = "admin" | "customer";

// A saved notification. Customer notifications belong to one user (userId);
// admin notifications are shared by the whole admin team (userId is null).
@Table({
  tableName: "notifications",
  modelName: "notification",
  timestamps: true,
  indexes: [{ fields: ["audience", "userId", "createdAt"] }],
})
class Notification extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { isIn: [["admin", "customer"]] },
  })
  declare audience: NotificationAudience;

  @Column({ type: DataType.UUID, allowNull: true, defaultValue: null })
  declare userId: string | null;

  // e.g. "order-status", "new-order", "review-reply" (lets the UI pick an icon)
  @Column({ type: DataType.STRING, allowNull: false })
  declare type: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare message: string;

  // Where clicking the notification should go (a path in the app)
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: null })
  declare link: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isRead: boolean;
}

export default Notification;
