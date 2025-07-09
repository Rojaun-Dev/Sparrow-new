import { sql, and, eq, gte, lt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { packages, packageStatusEnum } from '../db/schema/packages';
import { preAlerts } from '../db/schema/pre-alerts';
import { invoices } from '../db/schema/invoices';
import { payments } from '../db/schema/payments';
import { users } from '../db/schema/users';
import { companies } from '../db/schema/companies';
import { companySettings } from '../db/schema/company-settings';
import { getMonthRange, getPreviousMonthRange } from '../utils/date-utils';

export class StatisticsRepository {
  constructor(private db: NodePgDatabase<any>) {}

  // Customer Statistics
  async getCustomerStatistics(userId: string, companyId: string, currency: 'USD' | 'JMD' = 'USD') {
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

    // Get exchange rate settings for currency conversion
    const exchangeRateSettings = await this.getExchangeRateSettings(companyId);
    const exchangeRate = exchangeRateSettings?.exchangeRate || 1;
    const baseCurrency = exchangeRateSettings?.baseCurrency || 'USD';

    // Get recent payments
    const recentPayments = await this.db
      .select({
        id: payments.id,
        amount: payments.amount,
        date: payments.createdAt,
        status: payments.status,
        meta: payments.meta
      })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.companyId, companyId)))
      .orderBy(sql`${payments.createdAt} desc`)
      .limit(5);

    // Convert payment amounts if needed
    const convertedRecentPayments = recentPayments.map(payment => {
      let amount = parseFloat(payment.amount.toString());
      
      // Check if payment has currency metadata
      const meta = payment.meta as Record<string, any> | undefined;
      const paymentCurrency = meta?.currency || baseCurrency;
      
      // Convert from payment currency to requested currency
      if (paymentCurrency !== currency) {
        if (paymentCurrency === 'JMD' && currency === 'USD') {
          // Convert JMD to USD (divide by rate)
          amount = amount / exchangeRate;
        } else if (paymentCurrency === 'USD' && currency === 'JMD') {
          // Convert USD to JMD (multiply by rate)
          amount = amount * exchangeRate;
        }
      }
      
      return {
        ...payment,
        amount,
        originalCurrency: paymentCurrency
      };
    });

    // Convert outstanding invoice amounts if needed
    let outstandingInvoicesAmount = outstandingInvoicesResult.total ? parseFloat(outstandingInvoicesResult.total.toString()) : 0;
    if (currency === 'JMD' && baseCurrency === 'USD') {
      outstandingInvoicesAmount = outstandingInvoicesAmount * exchangeRate;
    } else if (currency === 'USD' && baseCurrency === 'JMD') {
      outstandingInvoicesAmount = outstandingInvoicesAmount / exchangeRate;
    }

    return {
      totalPackages: packageCountResult.count || 0,
      packagesByStatus: packagesByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      pendingPreAlerts: pendingPreAlertsResult.count || 0,
      outstandingInvoices: {
        count: outstandingInvoicesResult.count || 0,
        amount: outstandingInvoicesAmount
      },
      monthlyTrend,
      recentPayments: convertedRecentPayments,
      currency: currency
    };
  }

  // Admin Statistics
  async getAdminStatistics(companyId: string, currency: 'USD' | 'JMD' = 'USD') {
    // Get current date range
    const { startDate, endDate } = getMonthRange();
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousMonthRange();

    // Get exchange rate settings for currency conversion
    const exchangeRateSettings = await this.getExchangeRateSettings(companyId);
    const exchangeRate = exchangeRateSettings?.exchangeRate || 1;
    const baseCurrency = exchangeRateSettings?.baseCurrency || 'USD';

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

    // Get all payments with their meta information to handle currency conversion
    const paymentsThisMonth = await this.db
      .select({
        amount: payments.amount,
        meta: payments.meta
      })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          eq(payments.status, 'completed'),
          gte(payments.createdAt, startDate),
          lt(payments.createdAt, endDate)
        )
      );

    const paymentsLastMonth = await this.db
      .select({
        amount: payments.amount,
        meta: payments.meta
      })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          eq(payments.status, 'completed'),
          gte(payments.createdAt, prevStartDate),
          lt(payments.createdAt, prevEndDate)
        )
      );

    // Convert and sum current month revenue
    let currentMonthRevenue = 0;
    paymentsThisMonth.forEach(payment => {
      let amount = parseFloat(payment.amount.toString() || '0');
      const meta = payment.meta as Record<string, any> | undefined;
      const paymentCurrency = meta?.currency || baseCurrency;
      
      // First convert to common base currency if needed
      if (paymentCurrency !== baseCurrency) {
        if (paymentCurrency === 'JMD' && baseCurrency === 'USD') {
          amount = amount / (meta?.exchangeRate || exchangeRate);
        } else if (paymentCurrency === 'USD' && baseCurrency === 'JMD') {
          amount = amount * (meta?.exchangeRate || exchangeRate);
        }
      }
      
      // Then convert to requested currency if needed
      if (baseCurrency !== currency) {
        if (baseCurrency === 'USD' && currency === 'JMD') {
          amount = amount * exchangeRate;
        } else if (baseCurrency === 'JMD' && currency === 'USD') {
          amount = amount / exchangeRate;
        }
      }
      
      currentMonthRevenue += amount;
    });

    // Convert and sum previous month revenue
    let previousMonthRevenue = 0;
    paymentsLastMonth.forEach(payment => {
      let amount = parseFloat(payment.amount.toString() || '0');
      const meta = payment.meta as Record<string, any> | undefined;
      const paymentCurrency = meta?.currency || baseCurrency;
      
      // First convert to common base currency if needed
      if (paymentCurrency !== baseCurrency) {
        if (paymentCurrency === 'JMD' && baseCurrency === 'USD') {
          amount = amount / (meta?.exchangeRate || exchangeRate);
        } else if (paymentCurrency === 'USD' && baseCurrency === 'JMD') {
          amount = amount * (meta?.exchangeRate || exchangeRate);
        }
      }
      
      // Then convert to requested currency if needed
      if (baseCurrency !== currency) {
        if (baseCurrency === 'USD' && currency === 'JMD') {
          amount = amount * exchangeRate;
        } else if (baseCurrency === 'JMD' && currency === 'USD') {
          amount = amount / exchangeRate;
        }
      }
      
      previousMonthRevenue += amount;
    });

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

    // Get monthly revenue trend with currency conversion
    const monthlyRevenueTrend = await this.getMonthlyRevenueTrend(companyId, 6, currency);

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
        current: currentMonthRevenue,
        previous: previousMonthRevenue,
        growth: previousMonthRevenue 
          ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
          : 0
      },
      customerCount: customerCountResult.count || 0,
      monthlyRevenueTrend,
      currency: currency, // Include the currency in the response
      exchangeRate: exchangeRate // Include the exchange rate for client-side calculations if needed
    };
  }

  // Super Admin Statistics
  async getSuperAdminStatistics(currency: 'USD' | 'JMD' = 'USD') {
    // Get current date range
    const { startDate, endDate } = getMonthRange();
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousMonthRange();

    // For super admin, we'll use a default exchange rate
    const exchangeRate = 158.5; // Default exchange rate if not specified

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

    // Get payments with meta for currency conversion
    const paymentsThisMonth = await this.db
      .select({
        amount: payments.amount,
        meta: payments.meta
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'completed'),
          gte(payments.createdAt, startDate),
          lt(payments.createdAt, endDate)
        )
      );

    const paymentsLastMonth = await this.db
      .select({
        amount: payments.amount,
        meta: payments.meta
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'completed'),
          gte(payments.createdAt, prevStartDate),
          lt(payments.createdAt, prevEndDate)
        )
      );

    // Convert and sum current month revenue
    let currentMonthRevenue = 0;
    paymentsThisMonth.forEach(payment => {
      let amount = parseFloat(payment.amount.toString() || '0');
      const meta = payment.meta as Record<string, any> | undefined;
      const paymentCurrency = meta?.currency || 'USD';
      
      // Convert to requested currency
      if (paymentCurrency !== currency) {
        if (paymentCurrency === 'JMD' && currency === 'USD') {
          amount = amount / (meta?.exchangeRate || exchangeRate);
        } else if (paymentCurrency === 'USD' && currency === 'JMD') {
          amount = amount * (meta?.exchangeRate || exchangeRate);
        }
      }
      
      currentMonthRevenue += amount;
    });

    // Convert and sum previous month revenue
    let previousMonthRevenue = 0;
    paymentsLastMonth.forEach(payment => {
      let amount = parseFloat(payment.amount.toString() || '0');
      const meta = payment.meta as Record<string, any> | undefined;
      const paymentCurrency = meta?.currency || 'USD';
      
      // Convert to requested currency
      if (paymentCurrency !== currency) {
        if (paymentCurrency === 'JMD' && currency === 'USD') {
          amount = amount / (meta?.exchangeRate || exchangeRate);
        } else if (paymentCurrency === 'USD' && currency === 'JMD') {
          amount = amount * (meta?.exchangeRate || exchangeRate);
        }
      }
      
      previousMonthRevenue += amount;
    });

    // Get revenue by company with currency conversion
    const revenueByCompanyRaw = await this.db
      .select({ 
        companyId: payments.companyId, 
        amount: payments.amount,
        meta: payments.meta
      })
      .from(payments)
      .where(eq(payments.status, 'completed'));

    // Process and group by company with currency conversion
    const revenueByCompanyMap = new Map<string, number>();
    revenueByCompanyRaw.forEach(payment => {
      const companyId = payment.companyId;
      let amount = parseFloat(payment.amount.toString() || '0');
      const meta = payment.meta as Record<string, any> | undefined;
      const paymentCurrency = meta?.currency || 'USD';
      
      // Convert to requested currency
      if (paymentCurrency !== currency) {
        if (paymentCurrency === 'JMD' && currency === 'USD') {
          amount = amount / (meta?.exchangeRate || exchangeRate);
        } else if (paymentCurrency === 'USD' && currency === 'JMD') {
          amount = amount * (meta?.exchangeRate || exchangeRate);
        }
      }
      
      const currentTotal = revenueByCompanyMap.get(companyId) || 0;
      revenueByCompanyMap.set(companyId, currentTotal + amount);
    });

    // Convert map to array and sort
    const revenueByCompany = Array.from(revenueByCompanyMap.entries())
      .map(([companyId, total]) => ({ companyId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Get monthly trend for new companies (last 6 months)
    const monthlyCompanyTrend = await this.getMonthlyCompanyTrend(6);

    // Get monthly trend for all revenue (last 6 months)
    const monthlyRevenueTrend = await this.getMonthlyAllRevenueTrend(6, currency);

    return {
      companyCount: companyCountResult.count || 0,
      userCount: userCountResult.count || 0,
      packageCount: packageCountResult.count || 0,
      packagesByCompany,
      usersByCompany,
      revenue: {
        current: currentMonthRevenue,
        previous: previousMonthRevenue,
        growth: previousMonthRevenue 
          ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
          : 0
      },
      revenueByCompany,
      monthlyCompanyTrend,
      monthlyRevenueTrend,
      currency: currency, // Include the currency in the response
      exchangeRate: exchangeRate // Include the exchange rate for client-side calculations if needed
    };
  }

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

  private async getMonthlyRevenueTrend(companyId: string, months: number, currency: 'USD' | 'JMD' = 'USD') {
    const result = [];
    const today = new Date();
    
    // Get exchange rate settings for currency conversion
    const exchangeRateSettings = await this.getExchangeRateSettings(companyId);
    const exchangeRate = exchangeRateSettings?.exchangeRate || 1;
    const baseCurrency = exchangeRateSettings?.baseCurrency || 'USD';
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      // Get payments with meta information for currency conversion
      const paymentsForMonth = await this.db
        .select({
          amount: payments.amount,
          meta: payments.meta
        })
        .from(payments)
        .where(
          and(
            eq(payments.companyId, companyId),
            eq(payments.status, 'completed'),
            gte(payments.createdAt, month),
            lt(payments.createdAt, nextMonth)
          )
        );
      
      // Calculate revenue with currency conversion
      let monthlyRevenue = 0;
      paymentsForMonth.forEach(payment => {
        let amount = parseFloat(payment.amount.toString() || '0');
        const meta = payment.meta as Record<string, any> | undefined;
        const paymentCurrency = meta?.currency || baseCurrency;
        
        // First convert to common base currency if needed
        if (paymentCurrency !== baseCurrency) {
          if (paymentCurrency === 'JMD' && baseCurrency === 'USD') {
            amount = amount / (meta?.exchangeRate || exchangeRate);
          } else if (paymentCurrency === 'USD' && baseCurrency === 'JMD') {
            amount = amount * (meta?.exchangeRate || exchangeRate);
          }
        }
        
        // Then convert to requested currency if needed
        if (baseCurrency !== currency) {
          if (baseCurrency === 'USD' && currency === 'JMD') {
            amount = amount * exchangeRate;
          } else if (baseCurrency === 'JMD' && currency === 'USD') {
            amount = amount / exchangeRate;
          }
        }
        
        monthlyRevenue += amount;
      });
      
      result.push({
        month: month.toLocaleString('default', { month: 'short' }),
        revenue: monthlyRevenue
      });
    }
    
    return result;
  }

  private async getMonthlyAllRevenueTrend(months: number, currency: 'USD' | 'JMD' = 'USD') {
    const result = [];
    const today = new Date();
    const defaultExchangeRate = 158.5; // Default exchange rate for super admin view
    
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      // Get payments with meta information for currency conversion
      const paymentsForMonth = await this.db
        .select({
          amount: payments.amount,
          meta: payments.meta
        })
        .from(payments)
        .where(
          and(
            eq(payments.status, 'completed'),
            gte(payments.createdAt, month),
            lt(payments.createdAt, nextMonth)
          )
        );
      
      // Calculate revenue with currency conversion
      let monthlyRevenue = 0;
      paymentsForMonth.forEach(payment => {
        let amount = parseFloat(payment.amount.toString() || '0');
        const meta = payment.meta as Record<string, any> | undefined;
        const paymentCurrency = meta?.currency || 'USD';
        
        // Convert to requested currency
        if (paymentCurrency !== currency) {
          if (paymentCurrency === 'JMD' && currency === 'USD') {
            amount = amount / (meta?.exchangeRate || defaultExchangeRate);
          } else if (paymentCurrency === 'USD' && currency === 'JMD') {
            amount = amount * (meta?.exchangeRate || defaultExchangeRate);
          }
        }
        
        monthlyRevenue += amount;
      });
      
      result.push({
        month: month.toLocaleString('default', { month: 'short' }),
        revenue: monthlyRevenue
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

  // Helper method to get exchange rate settings for a company
  private async getExchangeRateSettings(companyId: string) {
    const [settings] = await this.db
      .select({
        exchangeRateSettings: companySettings.exchangeRateSettings
      })
      .from(companySettings)
      .where(eq(companySettings.companyId, companyId));

    if (settings && settings.exchangeRateSettings) {
      return settings.exchangeRateSettings as {
        baseCurrency: 'USD' | 'JMD';
        targetCurrency: 'USD' | 'JMD';
        exchangeRate: number;
        lastUpdated: string;
        autoUpdate: boolean;
      };
    }

    // Return default settings if none found
    return {
      baseCurrency: 'USD',
      targetCurrency: 'JMD',
      exchangeRate: 158.5,
      lastUpdated: new Date().toISOString(),
      autoUpdate: false
    };
  }
} 