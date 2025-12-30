import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, X, Save, Search } from 'lucide-react';

export default function InvoiceApp() {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('customers');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: ''
  });
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedCustomers = await window.storage.get('customers');
      const storedInvoices = await window.storage.get('invoices');
      
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers.value));
      }
      if (storedInvoices) {
        setInvoices(JSON.parse(storedInvoices.value));
      }
    } catch (error) {
      console.log('No existing data found');
    }
  };

  const saveCustomers = async (newCustomers) => {
    await window.storage.set('customers', JSON.stringify(newCustomers));
    setCustomers(newCustomers);
  };

  const saveInvoices = async (newInvoices) => {
    await window.storage.set('invoices', JSON.stringify(newInvoices));
    setInvoices(newInvoices);
  };

  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.email) {
      alert('Name and email are required');
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      ...customerForm
    };

    await saveCustomers([...customers, newCustomer]);
    setCustomerForm({ name: '', email: '', phone: '', address: '', company: '' });
    setShowCustomerForm(false);
  };

  const handleUpdateCustomer = async () => {
    if (!customerForm.name || !customerForm.email) {
      alert('Name and email are required');
      return;
    }

    const updated = customers.map(c => 
      c.id === editingCustomer.id ? { ...c, ...customerForm } : c
    );
    await saveCustomers(updated);
    setEditingCustomer(null);
    setCustomerForm({ name: '', email: '', phone: '', address: '', company: '' });
    setShowCustomerForm(false);
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const filtered = customers.filter(c => c.id !== id);
      await saveCustomers(filtered);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      company: customer.company
    });
    setShowCustomerForm(true);
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateTotal = () => {
    return invoiceForm.items.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0
    ).toFixed(2);
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceForm.customerId) {
      alert('Please select a customer');
      return;
    }

    if (invoiceForm.items.some(item => !item.description)) {
      alert('All items must have a description');
      return;
    }

    const newInvoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerId: invoiceForm.customerId,
      items: invoiceForm.items,
      date: invoiceForm.date,
      dueDate: invoiceForm.dueDate,
      notes: invoiceForm.notes,
      total: calculateTotal(),
      status: 'pending'
    };

    await saveInvoices([...invoices, newInvoice]);
    setInvoiceForm({
      customerId: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: ''
    });
    setShowInvoiceForm(false);
    setActiveTab('invoices');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerById = (id) => customers.find(c => c.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-black p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">Invoice Manager</h1>
            <p className="text-gray-300">Manage customers and generate invoices</p>
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
                      setCustomerForm({ name: '', email: '', phone: '', address: '', company: '' });
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
                          setCustomerForm({ name: '', email: '', phone: '', address: '', company: '' });
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
                      <input
                        type="text"
                        placeholder="Address"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black col-span-2"
                      />
                    </div>
                    <button
                      onClick={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
                      className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                    >
                      <Save size={20} /> {editingCustomer ? 'Update' : 'Save'} Customer
                    </button>
                  </div>
                )}

                <div className="grid gap-4">
                  {filteredCustomers.length === 0 ? (
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
                              {customer.address && <p>📍 {customer.address}</p>}
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

            {activeTab === 'invoices' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
                  <button
                    onClick={() => setShowInvoiceForm(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                  >
                    <FileText size={20} /> Generate Invoice
                  </button>
                </div>

                {showInvoiceForm && (
                  <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-green-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">New Invoice</h3>
                      <button
                        onClick={() => setShowInvoiceForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <select
                        value={invoiceForm.customerId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Customer *</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={invoiceForm.date}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
                      <input
                        type="date"
                        placeholder="Due Date"
                        value={invoiceForm.dueDate}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                      />
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
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value))}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={item.price}
                            onChange={(e) => updateInvoiceItem(index, 'price', parseFloat(e.target.value))}
                            className="col-span-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                          />
                          <button
                            onClick={() => removeInvoiceItem(index)}
                            className="col-span-1 text-red-600 hover:bg-red-50 rounded-lg"
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
                        Total: ${calculateTotal()}
                      </div>
                      <button
                        onClick={handleGenerateInvoice}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                      >
                        <FileText size={20} /> Generate Invoice
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {invoices.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No invoices yet</p>
                      <p className="text-sm">Generate your first invoice</p>
                    </div>
                  ) : (
                    invoices.map(invoice => {
                      const customer = getCustomerById(invoice.customerId);
                      return (
                        <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{invoice.invoiceNumber}</h3>
                              <p className="text-gray-600">{customer?.name}</p>
                              <p className="text-sm text-gray-500">Date: {invoice.date}</p>
                              {invoice.dueDate && <p className="text-sm text-gray-500">Due: {invoice.dueDate}</p>}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">${invoice.total}</div>
                              <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                {invoice.status}
                              </span>
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Items:</h4>
                            {invoice.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>{item.description}</span>
                                <span>{item.quantity} x ${item.price} = ${(item.quantity * item.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          {invoice.notes && (
                            <div className="mt-4 text-sm text-gray-600">
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