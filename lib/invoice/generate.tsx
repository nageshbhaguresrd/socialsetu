import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';

interface InvoiceItem {
  description: string;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientBusiness: string;
  clientCity: string;
  items: InvoiceItem[];
  gstNumber?: string;
  agencyName: 'SocialSetu Digital';
  agencyPhone: '+91 9876543210';
  agencyEmail: 'hello@socialsetu.com';
}

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottom: '2px solid #6C63FF',
    paddingBottom: 20,
  },
  agencyName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#6C63FF',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#333',
  },
  invoiceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontSize: 11,
  },
  billTo: {
    marginBottom: 30,
  },
  billToTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    color: '#333',
  },
  billToDetails: {
    fontSize: 11,
    lineHeight: 1.4,
  },
  itemsTable: {
    marginBottom: 30,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 8,
  },
  tableHeader: {
    fontWeight: 700,
    color: '#333',
  },
  descriptionCol: {
    width: '70%',
  },
  amountCol: {
    width: '30%',
    textAlign: 'right',
  },
  totals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 12,
  },
  totalLabel: {
    fontWeight: 700,
    color: '#333',
  },
  totalValue: {
    fontWeight: 700,
    fontSize: 14,
    color: '#6C63FF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 20,
  },
});

export async function generateInvoice(data: InvoiceData): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.agencyName}>SocialSetu Digital</Text>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text>Invoice #{data.invoiceNumber}</Text>
            <Text>Date: {data.date}</Text>
          </View>
        </View>

        <View style={styles.billTo}>
          <Text style={styles.billToTitle}>Bill To:</Text>
          <Text style={styles.billToDetails}>
            {data.clientName}
            {'\n'}
            {data.clientBusiness}, {data.clientCity}
          </Text>
        </View>

        <View style={styles.itemsTable}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.descriptionCol}>Description</Text>
            <Text style={styles.amountCol}>Amount</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.descriptionCol}>{item.description}</Text>
              <Text style={styles.amountCol}>₹{item.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>₹{data.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>GST (18%):</Text>
            <Text>₹{Math.round(data.items.reduce((sum, item) => sum + item.amount, 0) * 0.18).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 12 }]}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>₹{Math.round(data.items.reduce((sum, item) => sum + item.amount, 0) * 1.18).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text>Thanks for your business!</Text>
            <Text>SocialSetu Digital</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text>+91 9876543210</Text>
            <Text>hello@socialsetu.com</Text>
            {data.gstNumber && <Text>GST: {data.gstNumber}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );

  const pdfBytes = await pdf(doc).toBuffer();

  return Buffer.from(pdfBytes);
}
