'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Users } from 'lucide-react';

const mockCampaignData = [
  {
    clientId: 1,
    clientName: "Acme Corp",
    campaigns: [
      { name: "Q1 Product Launch", impressions: 125000, clicks: 3200, spend: 4500, conversions: 145, ctr: 2.56, cpc: 1.41 },
      { name: "Brand Awareness", impressions: 89000, clicks: 1800, spend: 2800, conversions: 78, ctr: 2.02, cpc: 1.56 }
    ]
  },
  {
    clientId: 2,
    clientName: "TechStart Inc",
    campaigns: [
      { name: "Lead Generation", impressions: 156000, clicks: 4100, spend: 5200, conversions: 203, ctr: 2.63, cpc: 1.27 },
      { name: "Retargeting Campaign", impressions: 67000, clicks: 2300, spend: 3100, conversions: 112, ctr: 3.43, cpc: 1.35 }
    ]
  },
  {
    clientId: 3,
    clientName: "Global Solutions",
    campaigns: [
      { name: "Summer Promotion", impressions: 203000, clicks: 5600, spend: 7200, conversions: 267, ctr: 2.76, cpc: 1.29 },
      { name: "Thought Leadership", impressions: 94000, clicks: 2100, spend: 3400, conversions: 89, ctr: 2.23, cpc: 1.62 }
    ]
  },
  {
    clientId: 4,
    clientName: "FinTech Pro",
    campaigns: [
      { name: "App Downloads", impressions: 178000, clicks: 4800, spend: 6100, conversions: 234, ctr: 2.70, cpc: 1.27 },
      { name: "Webinar Registration", impressions: 112000, clicks: 3400, spend: 4300, conversions: 156, ctr: 3.04, cpc: 1.26 }
    ]
  },
  {
    clientId: 5,
    clientName: "EcoGreen Ltd",
    campaigns: [
      { name: "Sustainability Initiative", impressions: 145000, clicks: 3800, spend: 4900, conversions: 178, ctr: 2.62, cpc: 1.29 }
    ]
  }
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [campaignData, setCampaignData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real LinkedIn data when authenticated
  useEffect(() => {
    if (session?.accessToken) {
      fetchLinkedInData();
    } else {
      // Use mock data if not authenticated
      setCampaignData(mockCampaignData);
      setIsLoading(false);
    }
  }, [session]);

  const fetchLinkedInData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/linkedin');
      if (response.ok) {
        const data = await response.json();
        setCampaignData(data.length > 0 ? data : mockCampaignData);
      } else {
        console.error('Failed to fetch LinkedIn data');
        setCampaignData(mockCampaignData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setCampaignData(mockCampaignData);
    }
    setIsLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.accessToken) {
        fetchLinkedInData();
      } else {
        setLastUpdated(new Date());
      }
    }, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [session]);

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (session?.accessToken) {
      fetchLinkedInData();
    }
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const filteredClients = campaignData.filter(client =>
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const aggregatedMetrics = selectedClients.length > 0
    ? campaignData
        .filter(client => selectedClients.includes(client.clientId))
        .reduce((acc, client) => {
          client.campaigns.forEach(campaign => {
            acc.impressions += campaign.impressions;
            acc.clicks += campaign.clicks;
            acc.spend += campaign.spend;
            acc.conversions += campaign.conversions;
          });
          return acc;
        }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 })
    : null;

  if (aggregatedMetrics) {
    aggregatedMetrics.ctr = aggregatedMetrics.impressions > 0 
      ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions * 100).toFixed(2)
      : 0;
    aggregatedMetrics.cpc = aggregatedMetrics.clicks > 0
      ? (aggregatedMetrics.spend / aggregatedMetrics.clicks).toFixed(2)
      : 0;
    aggregatedMetrics.conversionRate = aggregatedMetrics.clicks > 0
      ? (aggregatedMetrics.conversions / aggregatedMetrics.clicks * 100).toFixed(2)
      : 0;
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 text-sm font-medium">{title}</div>
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
    </div>
  );

  if (isLoading && status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Authentication Status Banner */}
      {!session && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Connect to LinkedIn</h3>
              <p className="text-sm text-blue-700">Sign in to view your actual campaign data</p>
            </div>
            <button
              onClick={() => signIn('linkedin')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in with LinkedIn
            </button>
          </div>
        </div>
      )}

      {session && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Connected to LinkedIn</h3>
              <p className="text-sm text-green-700">
                {campaignData === mockCampaignData 
                  ? 'Showing sample data - awaiting Marketing API approval' 
                  : 'Viewing live data from your accounts'}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Campaign Manager Dashboard</h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">Multi-client campaign performance tracking</p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 bg-white rounded-lg shadow p-6 h-fit border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Clients</h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredClients.map(client => (
              <label
                key={client.clientId}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
              >
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.clientId)}
                  onChange={() => handleClientToggle(client.clientId)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{client.clientName}</div>
                  <div className="text-xs text-gray-500">{client.campaigns.length} campaigns</div>
                </div>
              </label>
            ))}
          </div>

          {selectedClients.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedClients([])}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear Selection ({selectedClients.length})
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {selectedClients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Clients to View Metrics</h3>
              <p className="text-gray-600">Choose one or more clients from the sidebar to see their combined campaign performance.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <MetricCard
                  title="Total Impressions"
                  value={aggregatedMetrics.impressions.toLocaleString()}
                  icon={Eye}
                  subtitle="Reach"
                />
                <MetricCard
                  title="Total Clicks"
                  value={aggregatedMetrics.clicks.toLocaleString()}
                  icon={MousePointer}
                  subtitle={`${aggregatedMetrics.ctr}% CTR`}
                />
                <MetricCard
                  title="Total Spend"
                  value={`$${aggregatedMetrics.spend.toLocaleString()}`}
                  icon={DollarSign}
                  subtitle={`$${aggregatedMetrics.cpc} CPC`}
                />
                <MetricCard
                  title="Conversions"
                  value={aggregatedMetrics.conversions.toLocaleString()}
                  icon={TrendingUp}
                  subtitle={`${aggregatedMetrics.conversionRate}% rate`}
                />
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Campaign Breakdown</h2>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Campaign</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Impressions</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Clicks</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">CTR</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Spend</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">CPC</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Conversions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaignData
                        .filter(client => selectedClients.includes(client.clientId))
                        .map(client => 
                          client.campaigns.map((campaign, idx) => (
                            <tr key={`${client.clientId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {client.clientName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {campaign.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {campaign.impressions.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {campaign.clicks.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {campaign.ctr}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                ${campaign.spend.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                ${campaign.cpc}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {campaign.conversions}
                              </td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}