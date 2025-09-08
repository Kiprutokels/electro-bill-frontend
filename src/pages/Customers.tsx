import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter, Users, Phone, Mail, Eye, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [customerList, setCustomerList] = useState([
    {
      id: 1,
      customerCode: 'CUST-001',
      businessName: 'ABC Electronics Ltd',
      contactPerson: 'John Kamau',
      email: 'john@abcelectronics.co.ke',
      phone: '+254 712 345 678',
      city: 'Nairobi',
      creditLimit: 50000,
      outstandingBalance: 15000,
      status: 'Active'
    },
    {
      id: 2,
      customerCode: 'CUST-002',
      businessName: 'Tech Solutions Kenya',
      contactPerson: 'Mary Wanjiku',
      email: 'mary@techsolutions.ke',
      phone: '+254 722 987 654',
      city: 'Mombasa',
      creditLimit: 75000,
      outstandingBalance: 0,
      status: 'Active'
    },
    {
      id: 3,
      customerCode: 'CUST-003',
      businessName: 'Network Systems Co.',
      contactPerson: 'Peter Ochieng',
      email: 'peter@networksystems.ke',
      phone: '+254 733 456 789',
      city: 'Kisumu',
      creditLimit: 100000,
      outstandingBalance: 45000,
      status: 'Active'
    },
    {
      id: 4,
      customerCode: 'CUST-004',
      businessName: 'Digital Hub Ltd',
      contactPerson: 'Grace Muthoni',
      email: 'grace@digitalhub.ke',
      phone: '+254 744 123 456',
      city: 'Nakuru',
      creditLimit: 25000,
      outstandingBalance: 28000,
      status: 'Credit Limit Exceeded'
    },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<null | (typeof customerList)[number]>(null);
  const [newCustomer, setNewCustomer] = useState({
    customerCode: '',
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    creditLimit: 0,
  });

  // Derived filtered customers
  const customers = customerList;

  const filteredCustomers = useMemo(() => customers.filter(customer =>
    customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [customers, searchTerm]);

  const resetForm = () => {
    setNewCustomer({
      customerCode: '',
      businessName: '',
      contactPerson: '',
      email: '',
      phone: '',
      city: '',
      creditLimit: 0,
    });
  };

  const handleAddCustomer = () => {
    const customerToAdd = {
      ...newCustomer,
      id: (customerList.length ? Math.max(...customerList.map(c => c.id)) : 0) + 1,
      outstandingBalance: 0,
      status: 'Active',
    };
    // In a real app, replace with API call
    console.log('Adding customer:', customerToAdd);
    setCustomerList(prev => [...prev, customerToAdd]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleView = (customer: (typeof customerList)[number]) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const [editCustomer, setEditCustomer] = useState({
    id: 0,
    customerCode: '',
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    creditLimit: 0,
  });

  const openEdit = (customer: (typeof customerList)[number]) => {
    setEditCustomer({
      id: customer.id,
      customerCode: customer.customerCode,
      businessName: customer.businessName,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      creditLimit: customer.creditLimit,
    });
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setCustomerList(prev => prev.map(c => c.id === editCustomer.id ? { ...c, ...editCustomer } as any : c));
    setIsEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (!selectedCustomer) return;
    setCustomerList(prev => prev.filter(c => c.id !== selectedCustomer.id));
    setIsEditDialogOpen(false);
    setIsViewDialogOpen(false);
    setSelectedCustomer(null);
  };

  const getStatusBadge = (status: string, balance: number, creditLimit: number) => {
    if (status === 'Credit Limit Exceeded' || balance > creditLimit) {
      return <Badge variant="destructive">Credit Exceeded</Badge>;
    } else if (balance > creditLimit * 0.8) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Near Limit</Badge>;
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
  };

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === 'Active').length,
    totalOutstanding: customers.reduce((sum, c) => sum + c.outstandingBalance, 0),
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Customer Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerCode">Customer Code</Label>
                <Input
                  id="customerCode"
                  value={newCustomer.customerCode}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customerCode: e.target.value })}
                  placeholder="e.g., CUST-005"
                />
              </div>
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={newCustomer.businessName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, businessName: e.target.value })}
                  placeholder="Enter business name"
                />
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={newCustomer.contactPerson}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
                  placeholder="Enter contact person"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="e.g., +254 700 000 000"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddCustomer} className="flex-1">Add Customer</Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.totalCustomers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.activeCustomers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              KES {stats.totalOutstanding.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <CardTitle>Customer Directory</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Customer Code</TableHead>
                  <TableHead className="min-w-[200px]">Business Name</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[120px]">Contact Person</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">Contact Info</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Location</TableHead>
                  <TableHead className="text-right hidden lg:table-cell min-w-[100px]">Credit Limit</TableHead>
                  <TableHead className="text-right hidden lg:table-cell min-w-[100px]">Outstanding</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.customerCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.businessName}</div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                          {customer.contactPerson}
                        </div>
                        <div className="text-sm text-muted-foreground md:hidden">
                          <div className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground lg:hidden">
                          {customer.city} • Limit: KES {customer.creditLimit.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{customer.contactPerson}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-1 h-3 w-3" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-1 h-3 w-3" />
                          {customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{customer.city}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">KES {customer.creditLimit.toLocaleString()}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      <span className={customer.outstandingBalance > customer.creditLimit ? 'text-red-600 font-medium' : ''}>
                        KES {customer.outstandingBalance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status, customer.outstandingBalance, customer.creditLimit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleView(customer)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3">
                          <Eye className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(customer)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3">
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Code</span><span>{selectedCustomer.customerCode}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Business</span><span>{selectedCustomer.businessName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{selectedCustomer.contactPerson}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedCustomer.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selectedCustomer.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{selectedCustomer.city}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Credit Limit</span><span>KES {selectedCustomer.creditLimit.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span>KES {selectedCustomer.outstandingBalance.toLocaleString()}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-customerCode">Customer Code</Label>
              <Input id="edit-customerCode" value={editCustomer.customerCode} onChange={(e) => setEditCustomer({ ...editCustomer, customerCode: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-businessName">Business Name</Label>
              <Input id="edit-businessName" value={editCustomer.businessName} onChange={(e) => setEditCustomer({ ...editCustomer, businessName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-contactPerson">Contact Person</Label>
              <Input id="edit-contactPerson" value={editCustomer.contactPerson} onChange={(e) => setEditCustomer({ ...editCustomer, contactPerson: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editCustomer.email} onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={editCustomer.phone} onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-city">City</Label>
              <Input id="edit-city" value={editCustomer.city} onChange={(e) => setEditCustomer({ ...editCustomer, city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="edit-creditLimit">Credit Limit</Label>
              <Input id="edit-creditLimit" type="number" value={editCustomer.creditLimit} onChange={(e) => setEditCustomer({ ...editCustomer, creditLimit: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex gap-2 pt-4 justify-between">
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit}>Save</Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the customer
                      {selectedCustomer ? ` "${selectedCustomer.businessName}"` : ''}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;