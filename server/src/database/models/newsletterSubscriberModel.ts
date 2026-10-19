import { Table, Column, Model, DataType } from "sequelize-typescript";

export type SubscriberStatus = "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";

@Table({
  tableName: "newsletter_subscribers",
  modelName: "newsletterSubscriber",
  timestamps: true,
})
class NewsletterSubscriber extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  // PENDING until the subscriber clicks the link in the confirmation email
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "PENDING",
    validate: { isIn: [["PENDING", "CONFIRMED", "UNSUBSCRIBED"]] },
  })
  declare status: SubscriberStatus;

  // SHA-256 hash of the confirmation token (the raw token is only in the email)
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: null })
  declare confirmTokenHash: string | null;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare confirmTokenExpiresAt: Date | null;

  // Kept in plain form so every newsletter email can include an unsubscribe link
  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  declare unsubscribeToken: string | null;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare confirmedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  declare unsubscribedAt: Date | null;
}

export default NewsletterSubscriber;
