import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, X, Save, Search, LogOut } from 'lucide-react';
import jsPDF from 'jspdf';
import { supabase } from "../config/supabase";
import LOGO from "../assets/logo.png"

export default function Home() {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [activeTab, setActiveTab] = useState('customers');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    notes: ''
  });

  const [quoteForm, setQuoteForm] = useState({
    customer_id: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'draft',
    notes: ''
  });

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'quotes') {
      fetchQuotes();
      if (customers.length === 0) fetchCustomers();
    }
  }, [activeTab]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Error logging out: ' + error.message);
    } else {
      window.location.href = '/'; // Redirect to login page
    }
  };

  /* ------------------ CUSTOMER CRUD ------------------ */
  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customer')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      alert('Error loading customers');
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.email) {
      alert('Name and email are required');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('customer')
      .insert([customerForm])
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer: ' + error.message);
    } else {
      setCustomers([data, ...customers]);
      setCustomerForm({ name: '', email: '', phone: '', company: '' });
      setShowCustomerForm(false);
      alert('Customer added successfully!');
    }
    setLoading(false);
  };

  const handleUpdateCustomer = async () => {
    if (!customerForm.name || !customerForm.email) {
      alert('Name and email are required');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('customer')
      .update(customerForm)
      .eq('id', editingCustomer.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer: ' + error.message);
    } else {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? data : c));
      setEditingCustomer(null);
      setCustomerForm({ name: '', email: '', phone: '', company: '' });
      setShowCustomerForm(false);
      alert('Customer updated successfully!');
    }
    setLoading(false);
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Delete this customer? This will also delete all associated invoices and quotes.')) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('customer')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer: ' + error.message);
    } else {
      setCustomers(customers.filter(c => c.id !== id));
      alert('Customer deleted successfully!');
    }
    setLoading(false);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || ''
    });
    setShowCustomerForm(true);
  };

  /* ------------------ INVOICE CRUD ------------------ */
  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoice')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      alert('Error loading invoices');
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const items = [...invoiceForm.items];
    items[index][field] = value;
    setInvoiceForm({ ...invoiceForm, items });
  };

  const removeInvoiceItem = (index) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () =>
    invoiceForm.items
      .reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0)
      .toFixed(2);

  /* ------------------ QUOTE CRUD ------------------ */
  const fetchQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quote')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      alert('Error loading quotes');
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  };

  const addQuoteItem = () => {
    setQuoteForm({
      ...quoteForm,
      items: [...quoteForm.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const updateQuoteItem = (index, field, value) => {
    const items = [...quoteForm.items];
    items[index][field] = value;
    setQuoteForm({ ...quoteForm, items });
  };

  const removeQuoteItem = (index) => {
    setQuoteForm({
      ...quoteForm,
      items: quoteForm.items.filter((_, i) => i !== index)
    });
  };

  const calculateQuoteTotal = () =>
    quoteForm.items
      .reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0)
      .toFixed(2);

  const generateQuoteNumber = () => {
    const timestamp = Date.now();
    return `QUO-${timestamp.toString().slice(-8)}`;
  };

  const handleGenerateQuote = async () => {
    if (!quoteForm.customer_id) {
      alert('Select a customer');
      return;
    }
    if (!quoteForm.expiry_date) {
      alert('Select an expiry date');
      return;
    }

    const quoteData = {
      quote_number: editingQuote ? editingQuote.quote_number : generateQuoteNumber(),
      customer_id: parseInt(quoteForm.customer_id),
      issue_date: quoteForm.issue_date,
      expiry_date: quoteForm.expiry_date,
      status: quoteForm.status,
      total: parseFloat(calculateQuoteTotal()),
      items: quoteForm.items,
      notes: quoteForm.notes || null
    };

    setLoading(true);

    if (editingQuote) {
      const { data, error } = await supabase
        .from('quote')
        .update(quoteData)
        .eq('id', editingQuote.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote:', error);
        alert('Error updating quote: ' + error.message);
      } else {
        setQuotes(quotes.map(q => q.id === editingQuote.id ? data : q));
        resetQuoteForm();
        alert('Quote updated successfully!');
      }
    } else {
      const { data, error } = await supabase
        .from('quote')
        .insert([quoteData])
        .select()
        .single();

      if (error) {
        console.error('Error creating quote:', error);
        alert('Error creating quote: ' + error.message);
      } else {
        setQuotes([data, ...quotes]);
        resetQuoteForm();
        setActiveTab('quotes');
        alert('Quote created successfully!');
      }
    }

    setLoading(false);
  };

  const handleEditQuote = (quote) => {
    setEditingQuote(quote);
    setQuoteForm({
      customer_id: quote.customer_id.toString(),
      items: quote.items,
      issue_date: quote.issue_date,
      expiry_date: quote.expiry_date,
      status: quote.status,
      notes: quote.notes || ''
    });
    setShowQuoteForm(true);
  };

  const handleDeleteQuote = async (id) => {
    if (!window.confirm('Delete this quote?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('quote')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quote:', error);
      alert('Error deleting quote: ' + error.message);
    } else {
      setQuotes(quotes.filter(q => q.id !== id));
      alert('Quote deleted successfully!');
    }
    setLoading(false);
  };

  const resetQuoteForm = () => {
    setQuoteForm({
      customer_id: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      status: 'draft',
      notes: ''
    });
    setShowQuoteForm(false);
    setEditingQuote(null);
  };

  const handleConvertToInvoice = async (quote) => {
    if (!window.confirm('Convert this quote to an invoice?')) return;

    const invoiceData = {
      invoice_number: generateInvoiceNumber(),
      customer_id: quote.customer_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: quote.expiry_date,
      status: 'draft',
      total: quote.total,
      items: quote.items,
      notes: quote.notes || null
    };

    setLoading(true);
    const { data, error } = await supabase
      .from('invoice')
      .insert([invoiceData])
      .select()
      .single();

    if (error) {
      console.error('Error converting quote to invoice:', error);
      alert('Error converting quote: ' + error.message);
    } else {
      await supabase.from('quote').update({ status: 'accepted' }).eq('id', quote.id);
      setQuotes(quotes.map(q => q.id === quote.id ? { ...q, status: 'accepted' } : q));
      setInvoices([data, ...invoices]);
      alert('Quote converted to invoice successfully!');
    }
    setLoading(false);
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    return `INV-${timestamp.toString().slice(-8)}`;
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceForm.customer_id) {
      alert('Select a customer');
      return;
    }
    if (!invoiceForm.due_date) {
      alert('Select a due date');
      return;
    }

    const invoiceData = {
      invoice_number: editingInvoice ? editingInvoice.invoice_number : generateInvoiceNumber(),
      customer_id: parseInt(invoiceForm.customer_id),
      issue_date: invoiceForm.issue_date,
      due_date: invoiceForm.due_date,
      status: invoiceForm.status,
      total: parseFloat(calculateTotal()),
      items: invoiceForm.items,
      notes: invoiceForm.notes || null
    };

    setLoading(true);

    if (editingInvoice) {
      // Update existing invoice
      const { data, error } = await supabase
        .from('invoice')
        .update(invoiceData)
        .eq('id', editingInvoice.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
        alert('Error updating invoice: ' + error.message);
      } else {
        setInvoices(invoices.map(inv => inv.id === editingInvoice.id ? data : inv));
        resetInvoiceForm();
        alert('Invoice updated successfully!');
      }
    } else {
      // Create new invoice
      const { data, error } = await supabase
        .from('invoice')
        .insert([invoiceData])
        .select()
        .single();

      if (error) {
        console.error('Error creating invoice:', error);
        alert('Error creating invoice: ' + error.message);
      } else {
        setInvoices([data, ...invoices]);
        resetInvoiceForm();
        setActiveTab('invoices');
        alert('Invoice created successfully!');
      }
    }

    setLoading(false);
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      customer_id: invoice.customer_id.toString(),
      items: invoice.items,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      notes: invoice.notes || ''
    });
    setShowInvoiceForm(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice?')) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('invoice')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice: ' + error.message);
    } else {
      setInvoices(invoices.filter(inv => inv.id !== id));
      alert('Invoice deleted successfully!');
    }
    setLoading(false);
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      customer_id: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'draft',
      notes: ''
    });
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  /* ------------------ PDF EXPORT ------------------ */
  const filteredCustomers = customers.filter(c =>
    `${c.name} ${c.email} ${c.company || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerById = (id) => customers.find(c => c.id === id);

const exportInvoicePDF = (invoice) => {
    const doc = new jsPDF();
    const customer = getCustomerById(invoice.customer_id);
    let y = 20;

    // Logo (top left corner) - 60x150 dimensions
    doc.addImage(LOGO, 'PNG', 14, y, 80, 20);
    
    // Business Info (top right corner)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('I-Vision Corp', 196, y, { align: 'right' });
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reg No: 2019/567510/07`, 196, y, { align: 'right' });
    y += 5;
    doc.text(`Tax No: 9717746177`, 196, y, { align: 'right' });
    y += 5;
    doc.text('hello@ivisioncorp.co.za', 196, y, { align: 'right' });
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #: ${invoice.invoice_number}`, 196, y, { align: 'right' });

    // Reset y for Bill To section (below logo)
    y = 55;

    // Bill To section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 14, y);
    y += 5;
    doc.text(customer.company, 14, y);
    y += 5;
    doc.text(customer.email, 14, y);
    
    // Items table header
    y += 20;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 14, y);
    doc.text('Qty', 120, y);
    doc.text('Price', 140, y);
    doc.text('Total', 170, y);
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    
    // Items
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    invoice.items.forEach(item => {
      y += 8;
      const desc = item.description.length > 40 ? item.description.substring(0, 40) + '...' : item.description;
      doc.text(desc, 14, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(`R${item.price.toFixed(2)}`, 140, y);
      doc.text(`R${(item.quantity * item.price).toFixed(2)}`, 170, y);
    });
    
    // Total
    y += 12;
    doc.setLineWidth(0.5);
    doc.line(120, y, 196, y);
    y += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: R${invoice.total}`, 140, y);
    
    // Notes
    if (invoice.notes) {
      y += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(invoice.notes, 180);
      doc.text(splitNotes, 14, y);
      y += splitNotes.length * 5;
    }

    // Thank you note
    y += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text('Thank you for your business!', 105, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Banking Details
    y += 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Banking Details:', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank: Standard Bank`, 14, y);
    y += 5;
    doc.text(`Account Name: I VISION CORP`, 14, y);
    y += 5;
    doc.text(`Account Number: 10 16 630 158 0`, 14, y);
    y += 5;
    doc.text(`Branch Code: 1255`, 14, y);
    y += 5;
    doc.text(`Account Type: Cheque`, 14, y);
    y += 5;
    doc.text(`Reference: ${invoice.invoice_number}`, 14, y);

    // Save the PDF
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
  };

  const exportQuotePDF = (quote) => {
    const doc = new jsPDF();
    const customer = getCustomerById(quote.customer_id);
    let y = 20;

    // Logo (top left corner)
    doc.addImage(LOGO, 'PNG', 14, y, 80, 20);

    // Business Info (top right corner)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('I-Vision Corp', 196, y, { align: 'right' });
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reg No: 2019/567510/07`, 196, y, { align: 'right' });
    y += 5;
    doc.text(`Tax No: 9717746177`, 196, y, { align: 'right' });
    y += 5;
    doc.text('hello@ivisioncorp.co.za', 196, y, { align: 'right' });
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Quote #: ${quote.quote_number}`, 196, y, { align: 'right' });

    // Reset y for Quote For section (below logo)
    y = 55;

    // Quote For section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTE FOR:', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.name, 14, y);
    y += 5;
    if (customer.company) { doc.text(customer.company, 14, y); y += 5; }
    doc.text(customer.email, 14, y);

    // Items table header
    y += 20;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 14, y);
    doc.text('Qty', 120, y);
    doc.text('Price', 140, y);
    doc.text('Total', 170, y);
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);

    // Items
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    quote.items.forEach(item => {
      y += 8;
      const desc = item.description.length > 40 ? item.description.substring(0, 40) + '...' : item.description;
      doc.text(desc, 14, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(`R${item.price.toFixed(2)}`, 140, y);
      doc.text(`R${(item.quantity * item.price).toFixed(2)}`, 170, y);
    });

    // Total
    y += 12;
    doc.setLineWidth(0.5);
    doc.line(120, y, 196, y);
    y += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: R${quote.total}`, 140, y);

    // Notes
    if (quote.notes) {
      y += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(quote.notes, 180);
      doc.text(splitNotes, 14, y);
      y += splitNotes.length * 5;
    }

    // Thank you note
    y += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text('Thank you for considering our quote!', 105, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Validity note
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`This quote is valid until: ${quote.expiry_date}`, 105, y, { align: 'center' });

    doc.save(`Quote-${quote.quote_number}.pdf`);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getQuoteStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-black p-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">Invoice Manager</h1>
                <p className="text-gray-300">Manage customers, quotes and invoices</p>
              </div>
              <div className="flex items-center gap-4">
                {user && (
                  <div className="text-right">
                    <p className="text-sm text-gray-300">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-8 py-4 font-semibold transition-colors ${
                  activeTab === 'customers'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-8 py-4 font-semibold transition-colors ${
                  activeTab === 'quotes'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Quotes
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-8 py-4 font-semibold transition-colors ${
                  activeTab === 'invoices'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Invoices
              </button>
            </div>
          </div>

          <div className="p-8">
            {loading && (
              <div className="text-center py-4 text-gray-600">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2">Loading...</p>
              </div>
            )}

            {activeTab === 'customers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setCustomerForm({ name: '', email: '', phone: '', company: '' });
                      setShowCustomerForm(true);
                    }}
                    className="ml-4 bg-black text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={20} /> Add Customer
                  </button>
                </div>

                {showCustomerForm && (
                  <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-black">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {editingCustomer ? 'Edit Customer' : 'New Customer'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowCustomerForm(false);
                          setEditingCustomer(null);
                          setCustomerForm({ name: '', email: '', phone: '', company: '' });
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Name *"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        value={customerForm.company}
                        onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <button
                      onClick={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
                      disabled={loading}
                      className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={20} /> {editingCustomer ? 'Update' : 'Save'} Customer
                    </button>
                  </div>
                )}

                <div className="grid gap-4">
                  {!loading && filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No customers found</p>
                      <p className="text-sm">Add your first customer to get started</p>
                    </div>
                  ) : (
                    filteredCustomers.map(customer => (
                      <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800">{customer.name}</h3>
                            {customer.company && (
                              <p className="text-sm text-gray-600 mb-2">{customer.company}</p>
                            )}
                            <div className="space-y-1 text-gray-600">
                              <p>📧 {customer.email}</p>
                              {customer.phone && <p>📱 {customer.phone}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="p-2 text-black hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'quotes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Quotes</h2>
                  <button
                    onClick={() => {
                      setEditingQuote(null);
                      resetQuoteForm();
                      setShowQuoteForm(true);
                    }}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
                  >
                    <FileText size={20} /> Generate Quote
                  </button>
                </div>

                {showQuoteForm && (
                  <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-purple-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {editingQuote ? 'Edit Quote' : 'New Quote'}
                      </h3>
                      <button onClick={resetQuoteForm} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <select
                        value={quoteForm.customer_id}
                        onChange={(e) => setQuoteForm({ ...quoteForm, customer_id: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Customer *</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={quoteForm.issue_date}
                        onChange={(e) => setQuoteForm({ ...quoteForm, issue_date: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="date"
                        value={quoteForm.expiry_date}
                        onChange={(e) => setQuoteForm({ ...quoteForm, expiry_date: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <select
                        value={quoteForm.status}
                        onChange={(e) => setQuoteForm({ ...quoteForm, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Items</h4>
                      {quoteForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Description *"
                            value={item.description}
                            onChange={(e) => updateQuoteItem(index, 'description', e.target.value)}
                            className="col-span-6 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateQuoteItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={item.price}
                            onChange={(e) => updateQuoteItem(index, 'price', parseFloat(e.target.value) || 0)}
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <button
                            onClick={() => removeQuoteItem(index)}
                            disabled={quoteForm.items.length === 1}
                            className="col-span-1 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <button onClick={addQuoteItem} className="text-black hover:text-gray-700 text-sm font-semibold">
                        + Add Item
                      </button>
                    </div>

                    <textarea
                      placeholder="Notes"
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black mb-4"
                      rows="3"
                    />

                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-gray-800">
                        Total: R{calculateQuoteTotal()}
                      </div>
                      <button
                        onClick={handleGenerateQuote}
                        disabled={loading}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <FileText size={20} /> {editingQuote ? 'Update' : 'Generate'} Quote
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {!loading && quotes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No quotes yet</p>
                      <p className="text-sm">Generate your first quote</p>
                    </div>
                  ) : (
                    quotes.map(quote => {
                      const customer = getCustomerById(quote.customer_id);
                      return (
                        <div key={quote.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{quote.quote_number}</h3>
                              <p className="text-gray-600">{customer?.name || 'Unknown Customer'}</p>
                              <p className="text-sm text-gray-500">Issue Date: {quote.issue_date}</p>
                              <p className="text-sm text-gray-500">Expiry Date: {quote.expiry_date}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-purple-600">R{parseFloat(quote.total).toFixed(2)}</div>
                              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getQuoteStatusColor(quote.status)}`}>
                                {quote.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Items:</h4>
                            {quote.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>{item.description}</span>
                                <span>{item.quantity} x R{item.price} = R{(item.quantity * item.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => exportQuotePDF(quote)}
                              className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                            >
                              Export PDF
                            </button>
                            <button
                              onClick={() => handleEditQuote(quote)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleConvertToInvoice(quote)}
                              disabled={quote.status === 'accepted'}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Convert to Invoice
                            </button>
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>

                          {quote.notes && (
                            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              <strong>Notes:</strong> {quote.notes}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
                  <button
                    onClick={() => {
                      setEditingInvoice(null);
                      resetInvoiceForm();
                      setShowInvoiceForm(true);
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                  >
                    <FileText size={20} /> Generate Invoice
                  </button>
                </div>

                {showInvoiceForm && (
                  <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-green-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
                      </h3>
                      <button
                        onClick={resetInvoiceForm}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <select
                        value={invoiceForm.customer_id}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Customer *</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={invoiceForm.issue_date}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="date"
                        value={invoiceForm.due_date}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <select
                        value={invoiceForm.status}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Items</h4>
                      {invoiceForm.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Description *"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            className="col-span-6 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={item.price}
                            onChange={(e) => updateInvoiceItem(index, 'price', parseFloat(e.target.value) || 0)}
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <button
                            onClick={() => removeInvoiceItem(index)}
                            disabled={invoiceForm.items.length === 1}
                            className="col-span-1 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addInvoiceItem}
                        className="text-black hover:text-gray-700 text-sm font-semibold"
                      >
                        + Add Item
                      </button>
                    </div>

                    <textarea
                      placeholder="Notes"
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black mb-4"
                      rows="3"
                    />

                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-gray-800">
                        Total: R{calculateTotal()}
                      </div>
                      <button
                        onClick={handleGenerateInvoice}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <FileText size={20} /> {editingInvoice ? 'Update' : 'Generate'} Invoice
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {!loading && invoices.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No invoices yet</p>
                      <p className="text-sm">Generate your first invoice</p>
                    </div>
                  ) : (
                    invoices.map(invoice => {
                      const customer = getCustomerById(invoice.customer_id);
                      return (
                        <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{invoice.invoice_number}</h3>
                              <p className="text-gray-600">{customer?.name || 'Unknown Customer'}</p>
                              <p className="text-sm text-gray-500">Issue Date: {invoice.issue_date}</p>
                              <p className="text-sm text-gray-500">Due Date: {invoice.due_date}</p>
                              {invoice.payment_date && (
                                <p className="text-sm text-green-600">Paid: {invoice.payment_date}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">R{parseFloat(invoice.total).toFixed(2)}</div>
                              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                                {invoice.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Items:</h4>
                            {invoice.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>{item.description}</span>
                                <span>{item.quantity} x R{item.price} = R{(item.quantity * item.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => exportInvoicePDF(invoice)}
                              className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                            >
                              Export PDF
                            </button>
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>

                          {invoice.notes && (
                            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              <strong>Notes:</strong> {invoice.notes}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}