import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';
import { Invoice } from '@/lib/api/types';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/fonts/fontawesome-webfont.ttf', fontWeight: 'bold' }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Roboto'
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
  companyInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
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
  },
  amount: {
    width: '20%',
    fontSize: 10,
    textAlign: 'right',
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
  },
  totalAmount: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 11,
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
  },
  notes: {
    marginTop: 20,
    fontSize: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderTopStyle: 'solid',
  }
});

// Format currency
const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${numAmount.toFixed(2)}`;
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
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, packages, user, company }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo and Company Info */}
      <View style={styles.header}>
        <View>
          {company?.logoUrl ? (
            <Image src={company.logoUrl} style={styles.logo} />
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
        
        {invoice.items && invoice.items.length > 0 ? (
          invoice.items.map((item: any, index: number) => (
            <View key={`item-${index}`} style={styles.tableRow}>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.amount}>
                {formatCurrency(item.lineTotal)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.tableRow}>
            <Text style={{ width: '100%', textAlign: 'center', fontSize: 10, color: '#666' }}>
              No detailed items available
            </Text>
          </View>
        )}
        
        <View style={styles.tableRow}>
          <Text style={[styles.description, { textAlign: 'right', fontWeight: 'bold' }]}>Subtotal:</Text>
          <Text style={styles.amount}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        
        <View style={styles.tableRow}>
          <Text style={[styles.description, { textAlign: 'right', fontWeight: 'bold' }]}>Tax:</Text>
          <Text style={styles.amount}>{formatCurrency(invoice.taxAmount)}</Text>
        </View>
        
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(invoice.totalAmount)}</Text>
        </View>
      </View>

      {/* Fee Breakdown */}
      {invoice.feeBreakdown && Object.keys(invoice.feeBreakdown).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>Type</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>
          {Object.entries(invoice.feeBreakdown).map(([type, amount], idx) => (
            <View key={`fee-${type}`} style={styles.tableRow}>
              <Text style={styles.description}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              <Text style={styles.amount}>{formatCurrency(amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Related Packages */}
      {packages && packages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Packages</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>Tracking #</Text>
            <Text style={{ width: '20%', fontSize: 10 }}>Status</Text>
            <Text style={styles.amount}>Description</Text>
          </View>
          
          {packages.map((pkg: any, index: number) => (
            <View key={`package-${index}`} style={styles.tableRow}>
              <Text style={styles.description}>{pkg.trackingNumber}</Text>
              <Text style={[
                styles.statusBadge, 
                { color: getStatusColor(pkg.status) }
              ]}>
                {formatStatusLabel(pkg.status)}
              </Text>
              <Text style={styles.amount}>{pkg.description || 'No description'}</Text>
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

export default InvoicePDF; 