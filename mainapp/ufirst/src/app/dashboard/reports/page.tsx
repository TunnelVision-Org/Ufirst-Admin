'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { AlertTriangle, Clock, FileText, Search, User, Trash2, X } from 'lucide-react';
import { mockServiceReports } from '@/app/data/mockData';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState(mockServiceReports);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity;

    return matchesSearch && matchesSeverity;
  });

  const handleDismissReport = (reportId: string) => {
    if (confirm('Are you sure you want to dismiss this report? This action cannot be undone.')) {
      setReports(reports.filter(r => r.id !== reportId));
    }
  };

  const handleDeleteTrainer = (reportId: string, trainerName: string) => {
    if (confirm(`Are you sure you want to DELETE trainer "${trainerName}"? This will permanently remove the trainer from the system. This action cannot be undone.`)) {
      // Remove all reports for this trainer
      const report = reports.find(r => r.id === reportId);
      if (report) {
        setReports(reports.filter(r => r.trainerId !== report.trainerId));
        alert(`Trainer ${trainerName} has been deleted from the system.`);
      }
    }
  };

  const totalReports = reports.length;
  const highSeverityReports = reports.filter(r => r.severity === 'high').length;
  const mediumSeverityReports = reports.filter(r => r.severity === 'medium').length;
  const lowSeverityReports = reports.filter(r => r.severity === 'low').length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'late': return Clock;
      case 'unprofessional': return AlertTriangle;
      case 'unprepared': return FileText;
      case 'inappropriate': return AlertTriangle;
      default: return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'late': 'Late Arrival',
      'unprofessional': 'Unprofessional',
      'unprepared': 'Unprepared',
      'inappropriate': 'Inappropriate Behavior',
      'other': 'Other'
    };
    return labels[category] || category;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout userName="Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Reports</h1>
            <p className="text-gray-500 mt-1">Client-submitted complaints about trainer service</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalReports}</div>
              <p className="text-xs text-gray-500 mt-1">All complaints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                High Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{highSeverityReports}</div>
              <p className="text-xs text-gray-500 mt-1">Urgent attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Medium Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{mediumSeverityReports}</div>
              <p className="text-xs text-gray-500 mt-1">Should review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Low Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{lowSeverityReports}</div>
              <p className="text-xs text-gray-500 mt-1">Minor issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Reports List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <CardTitle>All Service Reports</CardTitle>
                <CardDescription>Review client complaints and take action</CardDescription>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C4526] w-full md:w-64"
                  />
                </div>

                {/* Severity Filter */}
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C4526] appearance-none bg-white cursor-pointer"
                  >
                    <option value="all">All Severity</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">No reports found</p>
                  <p className="text-sm text-gray-500">
                    {searchQuery || filterSeverity !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'No service reports have been submitted yet'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => {
                  const CategoryIcon = getCategoryIcon(report.category);
                  
                  return (
                    <Card 
                      key={report.id} 
                      className="hover:shadow-md transition-shadow border-l-4" 
                      style={{ 
                        borderLeftColor: report.severity === 'high' ? '#dc2626' : 
                                        report.severity === 'medium' ? '#eab308' : '#3b82f6' 
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={cn(
                              "p-3 rounded-lg border",
                              getSeverityColor(report.severity)
                            )}>
                              <CategoryIcon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{getCategoryLabel(report.category)}</h3>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium border",
                                  getSeverityColor(report.severity)
                                )}>
                                  {report.severity.toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>Client: <strong>{report.clientName}</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>Trainer: <strong>{report.trainerName}</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{new Date(report.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}</span>
                                </div>
                              </div>

                              <p className="text-gray-700 text-sm leading-relaxed">
                                {report.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-gray-600 hover:bg-gray-50"
                            onClick={() => handleDismissReport(report.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Dismiss Report
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => handleDeleteTrainer(report.id, report.trainerName)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Trainer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
