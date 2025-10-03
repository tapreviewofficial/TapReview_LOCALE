import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Eye } from "lucide-react";

interface AnalyticsSummary {
  totalClicks: number;
  clicks7d: number;
  clicks30d: number;
}

interface LinkStats {
  id: number;
  title: string;
  clicksAllTime: number;
  clicks7d: number;
  clicks30d: number;
  order: number;
}

export function StatsPanel() {
  const { data: summary } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: linkStats } = useQuery<LinkStats[]>({
    queryKey: ["/api/analytics/links"],
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-[#CC9900]" />
        Analytics
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Totale Click
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {summary?.totalClicks?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ultimi 7 Giorni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC9900]">
              {summary?.clicks7d?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ultimi 30 Giorni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#CC9900]">
              {summary?.clicks30d?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link Stats Table */}
      {linkStats && linkStats.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Statistiche per Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left" data-testid="table-link-stats">
                <thead className="text-white/60 text-sm">
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-2 font-medium">Titolo</th>
                    <th className="py-3 px-2 font-medium text-center">Totale</th>
                    <th className="py-3 px-2 font-medium text-center">7g</th>
                    <th className="py-3 px-2 font-medium text-center">30g</th>
                  </tr>
                </thead>
                <tbody>
                  {linkStats.map((link) => (
                    <tr key={link.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`row-link-stats-${link.id}`}>
                      <td className="py-3 px-2 text-white font-medium">{link.title}</td>
                      <td className="py-3 px-2 text-center text-white" data-testid={`text-total-clicks-${link.id}`}>
                        {link.clicksAllTime.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center text-[#CC9900]" data-testid={`text-7d-clicks-${link.id}`}>
                        {link.clicks7d.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center text-[#CC9900]" data-testid={`text-30d-clicks-${link.id}`}>
                        {link.clicks30d.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {linkStats && linkStats.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-8 text-center">
            <p className="text-white/60">Nessun link creato ancora. Aggiungi i tuoi primi link per vedere le statistiche!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}