import { and, eq, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { payments, paymentStatusEnum } from '../db/schema/payments';
import { invoices } from '../db/schema/invoices';

export class PaymentsRepository extends BaseRepository<typeof payments> {
  constructor() {
    super(payments);
  }

  /**
   * Find all payments for a specific invoice
   */
  async findByInvoiceId(invoiceId: string, companyId: string) {
    return this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.invoiceId, invoiceId),
          eq(payments.companyId, companyId)
        )
      );
  }

  /**
   * Find all payments for a specific user
   */
  async findByUserId(userId: string, companyId: string) {
    return this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.companyId, companyId)
        )
      );
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: typeof paymentStatusEnum.enumValues[number], companyId: string) {
    return this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, status),
          eq(payments.companyId, companyId)
        )
      );
  }

  /**
   * Process a refund for a payment
   */
  async processRefund(paymentId: string, companyId: string) {
    return this.db.transaction(async (tx) => {
      // Update payment status to refunded
      const updatedPayment = await tx
        .update(payments)
        .set({
          status: 'refunded',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(payments.id, paymentId),
            eq(payments.companyId, companyId)
          )
        )
        .returning();

      if (updatedPayment.length === 0) {
        throw new Error('Payment not found');
      }

      // Get the corresponding invoice
      const invoice = await tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, updatedPayment[0].invoiceId),
            eq(invoices.companyId, companyId)
          )
        )
        .limit(1);

      if (invoice.length === 0) {
        throw new Error('Associated invoice not found');
      }

      // Update invoice status if needed (logic will depend on business rules)
      // For example, if this was the only payment, we might revert to 'issued' status
      // This is just an example and may need adjustment based on your business logic
      await tx
        .update(invoices)
        .set({
          status: 'issued',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invoices.id, updatedPayment[0].invoiceId),
            eq(invoices.companyId, companyId)
          )
        );

      return updatedPayment[0];
    });
  }

  /**
   * Get total payments received within a date range
   */
  async getTotalPaymentsInPeriod(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await this.db
      .select({
        total: sql<string>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          eq(payments.status, 'completed'),
          sql`${payments.paymentDate} >= ${startDate}`,
          sql`${payments.paymentDate} <= ${endDate}`
        )
      );

    return result[0]?.total ? parseFloat(result[0].total) : 0;
  }
} 