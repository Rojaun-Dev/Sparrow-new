import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { users, packages, preAlerts, invoices, payments, companies } from '../db/schema';
import { getMonthRange, getPreviousMonthRange } from '../utils/date-utils';

export class StatisticsRepository {
  constructor(private db: NodePgDatabase<any>) {}

  // Customer Statistics
  async getCustomerStatistics(userId: string, companyId: string) {
    // Get total packages for the customer
    const [packageCountResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(and(eq(packages.userId, userId), eq(packages.companyId, companyId)));

    // Get packages by status
    const packagesByStatus = await this.db
      .select({ 
        status: packages.status, 
        count: sql<number>`count(*)`
      })
      .from(packages)
      .where(and(eq(packages.userId, userId), eq(packages.companyId, companyId)))
      .groupBy(packages.status);

    // Get pending pre-alerts
    const [pendingPreAlertsResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(preAlerts)
      .where(
        and(
          eq(preAlerts.userId, userId),
          eq(preAlerts.companyId, companyId),
          eq(preAlerts.status, 'pending')
        )
      );

    // Get outstanding invoices
    const [outstandingInvoicesResult] = await this.db
      .select({ 
        count: sql<number>`count(*)`, 
        total: sql<number>`sum(${invoices.totalAmount})` 
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.companyId, companyId),
          eq(invoices.status, 'issued')
        )
      );

    // Get monthly package trend (last 6 months)
    const monthlyTrend = await this.getMonthlyPackageTrend(userId, companyId, 6);

    // Get recent payments
    const recentPayments = await this.db
      .select({
        id: payments.id,
        amount: payments.amount,
        date: payments.createdAt,
        status: payments.status
      })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.companyId, companyId)))
      .orderBy(sql`${payments.createdAt} desc`)
      .limit(5);

    return {
      totalPackages: packageCountResult.count || 0,
      packagesByStatus: packagesByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      pendingPreAlerts: pendingPreAlertsResult.count || 0,
      outstandingInvoices: {
        count: outstandingInvoicesResult.count || 0,
        amount: outstandingInvoicesResult.total || 0
      },
      monthlyTrend,
      recentPayments
    };
  }

  // Admin Statistics
  async getAdminStatistics(companyId: string) {
    // Get current date range
    const { startDate, endDate } = getMonthRange();
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousMonthRange();

    // Total packages for company
    const [packageCountResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(eq(packages.companyId, companyId));

    // Packages received this month
    const [packagesThisMonth] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(
        and(
          eq(packages.companyId, companyId),
          gte(packages.createdAt, startDate),
          lt(packages.createdAt, endDate)
        )
      );

    // Packages received last month
    const [packagesLastMonth] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(packages)
      .where(
        and(
          eq(packages.companyId, companyId),
          gte(packages.createdAt, prevStartDate),
          lt(packages.createdAt, prevEndDate)
        )
      );

    // Get packages by status
    const packagesByStatus = await this.db
      .select({ 
        status: packages.status, 
        count: sql<number>`count(*)`
      })
      .from(packages)
      .where(eq(packages.companyId, companyId))
      .groupBy(packages.status);

    // Get pending pre-alerts
    const [pendingPreAlertsResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(preAlerts)
      .where(
        and(
          eq(preAlerts.companyId, companyId),
          eq(preAlerts.status, 'pending')
        )
      );

    // Get revenue stats
    const [revenueResult] = await this.db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          gte(payments.createdAt, startDate),
          lt(payments.createdAt, endDate)
        )
      );

    // Get revenue for previous month
    const [prevRevenueResult] = await this.db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          gte(payments.createdAt, prevStartDate),
          lt(payments.createdAt, prevEndDate)
        )
      );

    // Get total customers
    const [customerCountResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.role, 'customer')
        )
      );

    // Get monthly revenue trend (last 6 months)
    const monthlyRevenueTrend = await this.getMonthlyRevenueTrend(companyId, 6);

    return {
      totalPackages: packageCountResult.count || 0,
      packagesThisMonth: packagesThisMonth.count || 0,
      packagesLastMonth: packagesLastMonth.count || 0,
      packageGrowth: packagesLastMonth.count 
        ? ((packagesThisMonth.count - packagesLastMonth.count) / packagesLastMonth.count) * 100 
        : 0,
      packagesByStatus: packagesByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      pendingPreAlerts: pendingPreAlertsResult.count || 0,
      revenue: {
        current: revenueResult.total || 0,
        previous: prevRevenueResult.total || 0,
        growth: prevRevenueResult.total 
          ? ((revenueResult.total - prevRevenueResult.total) / prevRevenueResult.total) * 100 
          : 0
      },
      customerCount: customerCountResult.count || 0,
      monthlyRevenueTrend
    };
  }

  // Super Admin Statistics
  async getSuperAdminStatistics() {
    // Get current date range
    const { startDate, endDate } = getMonthRange();
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousMonthRange();

    // Total companies
    const [companyCountResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(companies);

    // Total users
    const [userCountResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    // Total packages
    const [packageCountResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(packages);

    // Packages by company
    const packagesByCompany = await this.db
      .select({ 
        companyId: packages.companyId, 
        count: sql<number>`count(*)`
      })
      .from(packages)
      .groupBy(packages.companyId)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    // Get users by company
    const usersByCompany = await this.db
      .select({ 
        companyId: users.companyId, 
        count: sql<number>`count(*)`
      })
      .from(users)
      .groupBy(users.companyId)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    // Get platform revenue
    const [revenueResult] = await this.db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lt(payments.createdAt, endDate)
        )
      );

    // Get revenue for previous month
    const [prevRevenueResult] = await this.db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, prevStartDate),
          lt(payments.createdAt, prevEndDate)
        )
      );

    // Get revenue by company
    const revenueByCompany = await this.db
      .select({ 
        companyId: payments.companyId, 
        total: sql<number>`sum(${payments.amount})` 
      })
      .from(payments)
      .groupBy(payments.companyId)
      .orderBy(sql`sum(${payments.amount}) desc`)
      .limit(5);

    // Get monthly trend for new companies (last 6 months)
    const monthlyCompanyTrend = await this.getMonthlyCompanyTrend(6);

    // Get monthly trend for all revenue (last 6 months)
    const monthlyRevenueTrend = await this.getMonthlyAllRevenueTrend(6);

    return {
      companyCount: companyCountResult.count || 0,
      userCount: userCountResult.count || 0,
      packageCount: packageCountResult.count || 0,
      packagesByCompany,
      usersByCompany,
      revenue: {
        current: revenueResult.total || 0,
        previous: prevRevenueResult.total || 0,
        growth: prevRevenueResult.total 
          ? ((revenueResult.total - prevRevenueResult.total) / prevRevenueResult.total) * 100 
          : 0
      },
      revenueByCompany,
      monthlyCompanyTrend,
      monthlyRevenueTrend
    };
  }

  // Helper methods
  private async getMonthlyPackageTrend(userId: string, companyId: string, months: number) {
    const result = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(packages)
        .where(
          and(
            eq(packages.userId, userId),
            eq(packages.companyId, companyId),
            gte(packages.createdAt, month),
            lt(packages.createdAt, nextMonth)
          )
        );
      
      result.push({
        month: month.toLocaleString('default', { month: 'short' }),
        count: countResult.count || 0
      });
    }
    
    return result;
  }

  private async getMonthlyRevenueTrend(companyId: string, months: number) {
    const result = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const [sumResult] = await this.db
        .select({ total: sql<number>`sum(${payments.amount})` })
        .from(payments)
        .where(
          and(
            eq(payments.companyId, companyId),
            gte(payments.createdAt, month),
            lt(payments.createdAt, nextMonth)
          )
        );
      
      result.push({
        month: month.toLocaleString('default', { month: 'short' }),
        revenue: sumResult.total || 0
      });
    }
    
    return result;
  }

  private async getMonthlyAllRevenueTrend(months: number) {
    const result = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const [sumResult] = await this.db
        .select({ total: sql<number>`sum(${payments.amount})` })
        .from(payments)
        .where(
          and(
            gte(payments.createdAt, month),
            lt(payments.createdAt, nextMonth)
          )
        );
      
      result.push({
        month: month.toLocaleString('default', { month: 'short' }),
        revenue: sumResult.total || 0
      });
    }
    
    return result;
  }

  private async getMonthlyCompanyTrend(months: number) {
    const result = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(
          and(
            gte(companies.createdAt, month),
            lt(companies.createdAt, nextMonth)
          )
        );
      
      result.push({
        month: month.toLocaleString('default', { month: 'short' }),
        count: countResult.count || 0
      });
    }
    
    return result;
  }
} 