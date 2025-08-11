import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link
} from '@react-pdf/renderer';
import { Invoice, SupportedCurrency, ExchangeRateSettings } from '@/lib/api/types';
import { convertCurrency, formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  banner: {
    width: 200,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Helvetica'
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    fontFamily: 'Helvetica'
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 12,
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 5,
    fontFamily: 'Helvetica'
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
    paddingTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col1: {
    width: '25%',
    fontSize: 10,
    color: '#555',
  },
  col2: {
    width: '75%',
    fontSize: 10,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
    paddingTop: 8,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid',
    paddingTop: 8,
    paddingBottom: 8,
  },
  description: {
    width: '60%',
    fontSize: 10,
    paddingRight: 8,
    fontFamily: 'Helvetica'
  },
  amount: {
    width: '20%',
    fontSize: 10,
    textAlign: 'right',
    fontFamily: 'Helvetica'
  },
  statusBadge: {
    width: '20%',
    fontSize: 9,
    paddingLeft: 5,
  },
  total: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#666',
    borderTopStyle: 'solid',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    width: '80%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 11,
    paddingRight: 8,
    fontFamily: 'Helvetica'
  },
  totalAmount: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderTopStyle: 'solid',
    paddingTop: 10,
    fontFamily: 'Helvetica'
  },
  notes: {
    marginTop: 20,
    fontSize: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderTopStyle: 'solid',
    fontFamily: 'Helvetica'
  }
});

// Format currency
const formatCurrency = (
  amount: number | string | null | undefined,
  currency: SupportedCurrency = 'USD',
  exchangeRateSettings?: ExchangeRateSettings
) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (numAmount === null || numAmount === undefined || isNaN(numAmount)) return '$0.00';
  
  // If currency is USD or no exchange rate settings, use simple formatting
  if (currency === 'USD' || !exchangeRateSettings || !exchangeRateSettings.exchangeRate) {
    return `$${numAmount.toFixed(2)}`;
  }
  
  // Convert from USD to the target currency
  const convertedAmount = convertCurrency(
    numAmount,
    'USD',
    currency,
    exchangeRateSettings
  );
  
  // Format with the appropriate currency symbol
  const symbols = {
    USD: '$',
    JMD: 'J$'
  };
  
  return `${symbols[currency]}${convertedAmount.toFixed(2)}`;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Status badge color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "#22c55e";
    case "unpaid":
    case "issued":
      return "#f59e0b";
    case "overdue":
      return "#ef4444";
    case "draft":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

// Format status label
const formatStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

interface InvoicePDFProps {
  invoice: Invoice;
  packages: any[];
  user: any;
  company: any;
  companyLogo?: string | null; // Base64 or data URL
  isUsingBanner?: boolean; // Whether the logo is actually a banner
  currency?: SupportedCurrency;
  exchangeRateSettings?: ExchangeRateSettings;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ 
  invoice, 
  packages, 
  user, 
  company,
  companyLogo,
  isUsingBanner = false,
  currency = 'USD',
  exchangeRateSettings
}) => {
  // Add validation for required props
  if (!invoice || !user || !company) {
    console.warn('InvoicePDF: Missing required props', { invoice: !!invoice, user: !!user, company: !!company });
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Error: Missing required data for PDF generation</Text>
        </Page>
      </Document>
    );
  }

  // Remove deduplication and recalculation logic
  const items = invoice?.items || [];
  const subtotal = invoice?.subtotal ?? 0;
  const totalTax = invoice?.taxAmount ?? 0;
  const total = invoice?.totalAmount ?? 0;
  
  // Format currency with the provided currency and exchange rate settings
  const formatWithCurrency = (amount: number | string | null | undefined) => {
    return formatCurrency(amount, currency, exchangeRateSettings);
  };
  
  // Use app base URL from env
  const appBaseUrl = typeof process !== 'undefined' && process.env && process.env.APP_BASE_URL ? process.env.APP_BASE_URL : '';
  // Only show each package once in the Related Packages section - handle null/undefined packages
  const uniquePackages = Array.isArray(packages) && packages.length > 0
    ? packages.filter((pkg, idx, arr) => pkg && pkg.id && arr.findIndex(p => p && p.id === pkg.id) === idx)
    : [];
  // Group items by description and type, summing their lineTotal values - with validation
  const groupedItemsMap = new Map();
  for (const item of items) {
    if (!item || !item.type || !item.description) {
      console.warn('InvoicePDF: Skipping invalid item', item);
      continue;
    }
    const key = `${item.type}||${item.description}`;
    if (!groupedItemsMap.has(key)) {
      groupedItemsMap.set(key, { ...item });
    } else {
      const existing = groupedItemsMap.get(key);
      existing.lineTotal += Number(item.lineTotal) || 0;
      existing.quantity += Number(item.quantity) || 0;
    }
  }
  const groupedItems = Array.from(groupedItemsMap.values());
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo and Company Info */}
        <View style={styles.header}>
          <View>
            {companyLogo ? (
              <Image src={companyLogo} style={isUsingBanner ? styles.banner : styles.logo} />
            ) : (
              <Text style={styles.companyName}>{company?.name || 'Company Name'}</Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company?.name || 'Company Name'}</Text>
            <Text>{company?.address?.street || ''}</Text>
            <Text>{`${company?.address?.city || ''}, ${company?.address?.state || ''} ${company?.address?.postalCode || ''}`}</Text>
            <Text>{company?.phone || ''}</Text>
            <Text>{company?.email || ''}</Text>
          </View>
        </View>

        {/* Invoice Title and Number */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <View style={styles.invoiceNumberRow}>
            <Text style={styles.invoiceNumber}>Invoice #: {invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceNumber}>
              Status: <Text style={{ color: getStatusColor(invoice.status) }}>{formatStatusLabel(invoice.status)}</Text>
            </Text>
          </View>
          <View style={styles.invoiceNumberRow}>
            <Text style={styles.invoiceNumber}>Issue Date: {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.invoiceNumber}>Due Date: {formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.col1}>Name:</Text>
            <Text style={styles.col2}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.col1}>Email:</Text>
            <Text style={styles.col2}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.col1}>Phone:</Text>
            <Text style={styles.col2}>{user?.phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Invoice Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>Description</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
          {groupedItems && groupedItems.length > 0 ? (
            groupedItems.map((item: any, index: number) => (
              <View key={`item-${index}`} style={styles.tableRow}>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.amount}>{formatWithCurrency(item.lineTotal)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={{ width: '100%', textAlign: 'center', fontSize: 10, color: '#666' }}>
                No detailed items available
              </Text>
            </View>
          )}
          {/* Subtotal and Total Rows */}
          <View style={styles.tableRow}>
            <Text style={styles.description}>Subtotal</Text>
            <Text style={styles.amount}>{formatWithCurrency(subtotal)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.description}>Tax</Text>
            <Text style={styles.amount}>{formatWithCurrency(totalTax)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.description}>Total</Text>
            <Text style={styles.amount}>{formatWithCurrency(total)}</Text>
          </View>
        </View>

        {/* Related Packages */}
        {uniquePackages && uniquePackages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Packages</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.description}>Description</Text>
              <Text style={styles.amount}>Sender</Text>
              <Text style={styles.amount}>Tracking #</Text>
            </View>
            {uniquePackages.map((pkg: any, index: number) => (
              <View key={`package-${index}`} style={styles.tableRow}>
                <Text style={styles.description}>{pkg.description || 'No description'}</Text>
                <Text style={styles.amount}>{pkg.senderInfo?.name || '-'}</Text>
                {/* Render as a clickable link if possible, otherwise as text */}
                {/* @react-pdf/renderer supports <Link> for URLs */}
                <Text style={styles.amount}>
                  {pkg.trackingNumber ? (
                    <Link src={`${appBaseUrl}/admin/packages/${pkg.id}`}>{pkg.trackingNumber}</Link>
                  ) : '-'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Notes:</Text>
            <Text style={{ fontSize: 10 }}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.notes}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Payment Information:</Text>
          <Text style={{ fontSize: 10 }}>
            Please include the invoice number in your payment reference.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business! This invoice was generated on {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF; 