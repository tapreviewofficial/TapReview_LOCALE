import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';

type TimeRange = '1d' | '7d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

interface Link {
  id: number;
  title: string;
  url: string;
  userId: number;
  createdAt: string;
}

interface AnalyticsData {
  meta: {
    range: string;
    bucket: string;
    since: string;
    until: string;
    timezone: string;
  };
  totals: {
    clicks: number;
  };
  series: Array<{
    ts: string;
    count: number;
  }>;
}

const timeRangeLabels: Record<TimeRange, string> = {
  '1d': 'Giorno',
  '7d': 'Settimana', 
  '1w': 'Settimana',
  '1m': 'Mese',
  '3m': '3 Mesi',
  '6m': '6 Mesi',
  '1y': 'Anno',
  'all': 'Sempre'
};

const timeRangeOptions: TimeRange[] = ['1d', '7d', '1m', '3m', '6m', '1y', 'all'];

export function AnalyticsChart() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const [selectedLink, setSelectedLink] = useState<string>('all');
  
  // Fetch user links
  const { data: linksData } = useQuery<Link[]>({
    queryKey: ['/api/links'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/clicks', selectedRange, selectedLink],
    queryFn: async () => {
      let url = `/api/analytics/clicks?range=${selectedRange}`;
      if (selectedLink !== 'all') {
        url += `&linkId=${selectedLink}`;
      }
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    }
  });

  const formatDate = (dateStr: string, bucket: string) => {
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) {
        console.log('Invalid date:', dateStr);
        return dateStr;
      }
      
      switch (bucket) {
        case 'hour':
          return format(date, 'HH:mm', { locale: it });
        case 'day':
          return format(date, 'd MMM', { locale: it });
        case 'week':
          return format(date, 'd MMM', { locale: it });
        case 'month':
          return format(date, 'MMM yyyy', { locale: it });
        default:
          return format(date, 'd MMM', { locale: it });
      }
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return dateStr;
    }
  };

  const chartData = analyticsData?.series.map(item => ({
    ...item,
    formattedDate: formatDate(item.ts, analyticsData.meta.bucket)
  })) || [];


  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-analytics-title">Analytics Avanzate</h2>
            <p className="text-muted-foreground">Visualizza i clic nel tempo con filtri personalizzabili</p>
          </div>
          
          {/* Time range selector */}
          <div className="flex flex-wrap gap-2">
            {timeRangeOptions.map((range) => (
              <Button
                key={range}
                variant={selectedRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRange(range)}
                className={selectedRange === range ? "bg-gold text-coal" : ""}
                data-testid={`button-range-${range}`}
              >
                {timeRangeLabels[range]}
              </Button>
            ))}
          </div>
        </div>

        {/* Link filter selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filtra per link:</label>
          <Select value={selectedLink} onValueChange={setSelectedLink}>
            <SelectTrigger className="w-64" data-testid="select-link-filter">
              <SelectValue placeholder="Seleziona un link" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all-links">
                📊 Tutti i link
              </SelectItem>
              {linksData?.map((link) => (
                <SelectItem key={link.id} value={link.id.toString()} data-testid={`option-link-${link.id}`}>
                  🔗 {link.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clic Totali</CardTitle>
            <i className="fas fa-mouse-pointer text-gold"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-clicks">
              {isLoading ? '...' : analyticsData?.totals.clicks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeRangeLabels[selectedRange].toLowerCase()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Periodo</CardTitle>
            <i className="fas fa-calendar text-gold"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-period">
              {timeRangeLabels[selectedRange]}
            </div>
            <p className="text-xs text-muted-foreground">
              Aggregazione: {analyticsData?.meta.bucket || 'ora'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendenza</CardTitle>
            <i className="fas fa-chart-line text-gold"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-trend">
              {isLoading ? '...' : chartData.length > 0 ? '↗' : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {chartData.length} punti dati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-chart-area text-gold"></i>
            Grafico Clic nel Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-spinner fa-spin text-2xl text-gold mb-2"></i>
                <p className="text-muted-foreground">Caricamento dati...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-center">
              <div>
                <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">Nessun dato per il periodo selezionato</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Debug: Totale {analyticsData?.totals.clicks || 0} clic, 
                  Serie: {analyticsData?.series.length || 0} punti
                </p>
              </div>
            </div>
          ) : (
            <div className="h-80" data-testid="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#fff"
                    fontSize={12}
                    tick={{ fill: '#fff' }}
                  />
                  <YAxis 
                    stroke="#fff"
                    fontSize={12}
                    tick={{ fill: '#fff' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                    labelFormatter={(label) => `Data: ${label}`}
                    formatter={(value) => [`${value} clic`, 'Clic']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#CC9900" 
                    strokeWidth={3}
                    dot={{ fill: '#CC9900', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#CC9900', strokeWidth: 2, fill: '#CC9900' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}