import React from 'react';
import { 
  Document as PDFDocument, 
  Page as PDFPage, 
  Text as PDFText, 
  View as PDFView, 
  StyleSheet, 
  Image as PDFImage,
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
  <PDFDocument>
    <PDFPage size="A4" style={styles.page}>
      {/* Header with Logo and Company Info */}
      <PDFView style={styles.header}>
        <PDFView>
          {company?.logoUrl ? (
            <PDFImage src={company.logoUrl} style={styles.logo} />
          ) : (
            <PDFText style={styles.companyName}>{company?.name || 'Company Name'}</PDFText>
          )}
        </PDFView>
        <PDFView style={styles.companyInfo}>
          <PDFText style={styles.companyName}>{company?.name || 'Company Name'}</PDFText>
          <PDFText>{company?.address?.street || ''}</PDFText>
          <PDFText>{`${company?.address?.city || ''}, ${company?.address?.state || ''} ${company?.address?.postalCode || ''}`}</PDFText>
          <PDFText>{company?.phone || ''}</PDFText>
          <PDFText>{company?.email || ''}</PDFText>
        </PDFView>
      </PDFView>

      {/* Invoice Title and Number */}
      <PDFView style={{ marginBottom: 20 }}>
        <PDFText style={styles.invoiceTitle}>INVOICE</PDFText>
        <PDFView style={styles.invoiceNumberRow}>
          <PDFText style={styles.invoiceNumber}>Invoice #: {invoice.invoiceNumber}</PDFText>
          <PDFText style={styles.invoiceNumber}>
            Status: <PDFText style={{ color: getStatusColor(invoice.status) }}>{formatStatusLabel(invoice.status)}</PDFText>
          </PDFText>
        </PDFView>
        <PDFView style={styles.invoiceNumberRow}>
          <PDFText style={styles.invoiceNumber}>Issue Date: {formatDate(invoice.issueDate)}</PDFText>
          <PDFText style={styles.invoiceNumber}>Due Date: {formatDate(invoice.dueDate)}</PDFText>
        </PDFView>
      </PDFView>

      {/* Customer Information */}
      <PDFView style={styles.section}>
        <PDFText style={styles.sectionTitle}>Customer Information</PDFText>
        <PDFView style={styles.infoRow}>
          <PDFText style={styles.col1}>Name:</PDFText>
          <PDFText style={styles.col2}>{user?.firstName} {user?.lastName}</PDFText>
        </PDFView>
        <PDFView style={styles.infoRow}>
          <PDFText style={styles.col1}>Email:</PDFText>
          <PDFText style={styles.col2}>{user?.email}</PDFText>
        </PDFView>
        <PDFView style={styles.infoRow}>
          <PDFText style={styles.col1}>Phone:</PDFText>
          <PDFText style={styles.col2}>{user?.phone || 'N/A'}</PDFText>
        </PDFView>
      </PDFView>

      {/* Invoice Items */}
      <PDFView style={styles.section}>
        <PDFText style={styles.sectionTitle}>Invoice Items</PDFText>
        <PDFView style={styles.tableHeader}>
          <PDFText style={styles.description}>Description</PDFText>
          <PDFText style={styles.amount}>Amount</PDFText>
        </PDFView>
        
        {invoice.items && invoice.items.length > 0 ? (
          invoice.items.map((item: any, index: number) => (
            <PDFView key={`item-${index}`} style={styles.tableRow}>
              <PDFText style={styles.description}>{item.description}</PDFText>
              <PDFText style={styles.amount}>
                {formatCurrency(item.lineTotal)}
              </PDFText>
            </PDFView>
          ))
        ) : (
          <PDFView style={styles.tableRow}>
            <PDFText style={{ width: '100%', textAlign: 'center', fontSize: 10, color: '#666' }}>
              No detailed items available
            </PDFText>
          </PDFView>
        )}
        
        <PDFView style={styles.tableRow}>
          <PDFText style={[styles.description, { textAlign: 'right', fontWeight: 'bold' }]}>Subtotal:</PDFText>
          <PDFText style={styles.amount}>{formatCurrency(invoice.subtotal)}</PDFText>
        </PDFView>
        
        <PDFView style={styles.tableRow}>
          <PDFText style={[styles.description, { textAlign: 'right', fontWeight: 'bold' }]}>Tax:</PDFText>
          <PDFText style={styles.amount}>{formatCurrency(invoice.taxAmount)}</PDFText>
        </PDFView>
        
        <PDFView style={styles.total}>
          <PDFText style={styles.totalLabel}>Total:</PDFText>
          <PDFText style={styles.totalAmount}>{formatCurrency(invoice.totalAmount)}</PDFText>
        </PDFView>
      </PDFView>

      {/* Related Packages */}
      {packages && packages.length > 0 && (
        <PDFView style={styles.section}>
          <PDFText style={styles.sectionTitle}>Related Packages</PDFText>
          <PDFView style={styles.tableHeader}>
            <PDFText style={styles.description}>Tracking #</PDFText>
            <PDFText style={{ width: '20%', fontSize: 10 }}>Status</PDFText>
            <PDFText style={styles.amount}>Description</PDFText>
          </PDFView>
          
          {packages.map((pkg: any, index: number) => (
            <PDFView key={`package-${index}`} style={styles.tableRow}>
              <PDFText style={styles.description}>{pkg.trackingNumber}</PDFText>
              <PDFText style={[
                styles.statusBadge, 
                { color: getStatusColor(pkg.status) }
              ]}>
                {formatStatusLabel(pkg.status)}
              </PDFText>
              <PDFText style={styles.amount}>{pkg.description || 'No description'}</PDFText>
            </PDFView>
          ))}
        </PDFView>
      )}

      {/* Notes */}
      {invoice.notes && (
        <PDFView style={styles.notes}>
          <PDFText style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Notes:</PDFText>
          <PDFText style={{ fontSize: 10 }}>{invoice.notes}</PDFText>
        </PDFView>
      )}

      {/* Payment Information */}
      <PDFView style={styles.notes}>
        <PDFText style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Payment Information:</PDFText>
        <PDFText style={{ fontSize: 10 }}>
          Please include the invoice number in your payment reference.
        </PDFText>
      </PDFView>

      {/* Footer */}
      <PDFView style={styles.footer}>
        <PDFText>Thank you for your business! This invoice was generated on {new Date().toLocaleDateString()}</PDFText>
      </PDFView>
    </PDFPage>
  </PDFDocument>
);

export default InvoicePDF; 