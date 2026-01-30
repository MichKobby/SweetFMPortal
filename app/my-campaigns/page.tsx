'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Radio, TrendingUp, Users, Target } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { CampaignAnalytics } from '@/types';

export default function MyCampaignsPage() {
  const { user, adSlots } = useStore();
  
  // Campaign analytics will be fetched from database
  const clientCampaigns: CampaignAnalytics[] = [];
  const clientAdSlots = adSlots.filter(ad => ad.clientId === user?.id || ad.clientId === '1');

  const activeCampaigns = clientAdSlots.filter(ad => ad.status === 'active').length;
  const totalSpend = clientAdSlots.reduce((sum, ad) => sum + ad.cost, 0);
  const totalSpots = clientAdSlots.reduce((sum, ad) => sum + ad.frequency, 0);

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-gray-500 mt-1">
            Track your advertising campaigns and performance metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
              <p className="text-xs text-gray-500 mt-1">currently running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
              <p className="text-xs text-gray-500 mt-1">all campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Spots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSpots}</div>
              <p className="text-xs text-gray-500 mt-1">aired/scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Avg Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {clientCampaigns.length > 0 
                  ? Math.round(clientCampaigns.reduce((sum, c) => sum + c.performanceScore, 0) / clientCampaigns.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">score</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Analytics */}
        {clientCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-[#c81f25]" />
                    {campaign.campaignName}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getPerformanceColor(campaign.performanceScore)}`}>
                    {campaign.performanceScore}%
                  </div>
                  <p className="text-xs text-gray-500">Performance Score</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Campaign Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Campaign Metrics</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded">
                          <Radio className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Spots Aired</p>
                          <p className="text-lg font-bold">{campaign.spotsAired} / {campaign.totalSpots}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">
                          {Math.round((campaign.spotsAired / campaign.totalSpots) * 100)}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Reach</p>
                          <p className="text-lg font-bold">{campaign.totalReach.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded">
                          <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Est. Impressions</p>
                          <p className="text-lg font-bold">{campaign.estimatedImpressions.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Peak Listening Times</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.peakListeningTimes.map((time, idx) => (
                        <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Audience Demographics</h3>
                  
                  <div className="space-y-3">
                    {campaign.demographics.map((demo, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{demo.ageGroup} years</span>
                          <span className="font-semibold">{demo.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#c81f25] h-2 rounded-full transition-all"
                            style={{ width: `${demo.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t">
                    <div className="bg-gradient-to-r from-[#c81f25] to-[#a01820] text-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5" />
                        <span className="font-semibold">Campaign Insights</span>
                      </div>
                      <p className="text-sm opacity-90">
                        Your campaign is performing {campaign.performanceScore >= 85 ? 'excellently' : 'well'} with strong engagement in the 25-34 age group. 
                        Peak performance during morning and evening drive times.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Active Ad Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Active Ad Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientAdSlots.filter(ad => ad.status === 'active').map((ad) => (
                <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-semibold">{ad.adTitle}</div>
                    <div className="text-sm text-gray-600">
                      {ad.adType} • {ad.frequency}x per day • {ad.duration}s
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(ad.cost)}</div>
                    <Badge className="bg-green-100 text-green-800 mt-1">{ad.status}</Badge>
                  </div>
                </div>
              ))}
              {clientAdSlots.filter(ad => ad.status === 'active').length === 0 && (
                <p className="text-center text-gray-500 py-8">No active ad slots</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
