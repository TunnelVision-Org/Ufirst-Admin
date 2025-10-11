'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Download, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const reportTypes = [
    {
      title: 'Monthly Revenue',
      description: 'View revenue trends and projections',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      available: true,
    },
    {
      title: 'Attendance Report',
      description: 'Track member attendance patterns',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      available: true,
    },
    {
      title: 'Performance Analytics',
      description: 'Trainer and client performance metrics',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      available: true,
    },
  ];

  return (
    <DashboardLayout userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 mt-1">Analytics and insights for your fitness center</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Reports Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">8</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">2 days ago</div>
              <p className="text-xs text-gray-500 mt-1">Auto-updates weekly</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Data Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">Last 90 days</div>
              <p className="text-xs text-gray-500 mt-1">Customizable</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Generate and download detailed reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.title}
                    className="p-6 rounded-lg border-2 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className={`${report.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="h-3 w-3" />
                      Generate Report
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Your latest generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No reports generated yet</p>
                <p className="text-sm text-gray-500 mb-4">Start by generating your first report</p>
                <Button>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
