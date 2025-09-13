import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyTrendData, CashFlowData } from "@/api/types/dashboard.types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, formatNumber } from "@/utils/format.utils";

interface DashboardChartsProps {
  monthlyTrends: MonthlyTrendData[];
  cashFlowData: CashFlowData;
  paymentBreakdown: { method: string; amount: number; count: number; }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const DashboardCharts = ({
  monthlyTrends,
  cashFlowData,
  paymentBreakdown,
}: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Trends */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name.includes('Revenue') || name.includes('Amount')
                    ? formatCurrency(value)
                    : formatNumber(value),
                  name,
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="invoiceRevenue"
                stroke="#8884d8"
                name="Invoice Revenue"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="paymentAmount"
                stroke="#82ca9d"
                name="Payment Amount"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cashFlowData.dailyInvoices.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.method}: ${formatCurrency(entry.amount)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {paymentBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
