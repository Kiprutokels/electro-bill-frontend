import React, { useState } from 'react';
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
import { Plus, Search, Filter, Users, Phone, Mail } from 'lucide-react';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock customer data - replace with real API calls
  const customers = [
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
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
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
            <div className="text-2xl font-bold text-foreground">
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
            <div className="text-2xl font-bold text-foreground">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Code</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Credit Limit</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.customerCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.businessName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.contactPerson}</TableCell>
                    <TableCell>
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
                    <TableCell>{customer.city}</TableCell>
                    <TableCell className="text-right">KES {customer.creditLimit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={customer.outstandingBalance > customer.creditLimit ? 'text-red-600 font-medium' : ''}>
                        KES {customer.outstandingBalance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status, customer.outstandingBalance, customer.creditLimit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;