import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface PreviewData {
  profile: {
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    accentColor: string;
  };
  user: {
    username: string;
  };
  links: Array<{
    id: number;
    title: string;
    url: string;
  }>;
}

interface LivePreviewProps {
  username: string;
}

export function LivePreview({ username }: LivePreviewProps) {
  const { data, isLoading } = useQuery<PreviewData>({
    queryKey: ["/api/public", username],
  });

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-8">
          <div className="text-center text-white/60">Caricamento anteprima...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-8">
          <div className="text-center text-white/60">Errore nel caricamento dell'anteprima</div>
        </CardContent>
      </Card>
    );
  }

  const { profile, user, links } = data;
  const accentColor = profile.accentColor || "#CC9900";

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Anteprima Live</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => window.open(`/u/${username}`, '_blank')}
            className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black"
            data-testid="button-open-links-page"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Pagina Link
          </Button>
          <Button
            onClick={() => window.open(`/p/${username}`, '_blank')}
            className="bg-[#CC9900] hover:bg-[#CC9900]/80 text-black"
            data-testid="button-open-promo-page"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Pagina Promozioni
          </Button>
        </div>
      </div>

      {/* Two Side-by-Side Previews */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Links Page Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white text-center">Pagina Link (/u/{username})</h3>
          <div className="max-w-sm mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-white/10">
              {/* Profile Header Preview */}
              <div className="text-center mb-6">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || user.username}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2"
                    style={{ borderColor: accentColor }}
                    data-testid="preview-links-avatar"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold text-black border-2"
                    style={{ backgroundColor: accentColor, borderColor: accentColor }}
                    data-testid="preview-links-avatar-placeholder"
                  >
                    {(profile.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                )}
                
                <h1
                  className="text-lg font-bold mb-2"
                  style={{ color: accentColor }}
                  data-testid="preview-links-display-name"
                >
                  {profile.displayName || user.username}
                </h1>
                
                {profile.bio && (
                  <p className="text-white/70 text-xs" data-testid="preview-links-bio">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Links Preview */}
              <div className="space-y-2">
                {links.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-white/50 text-xs">Nessun link disponibile</p>
                  </div>
                ) : (
                  links.slice(0, 3).map((link) => (
                    <div
                      key={link.id}
                      className="w-full p-2 bg-white/10 rounded-lg border border-white/20 text-center font-medium text-white text-xs"
                      style={{ borderColor: accentColor + '40' }}
                      data-testid={`preview-links-link-${link.id}`}
                    >
                      {link.title}
                    </div>
                  ))
                )}
                {links.length > 3 && (
                  <div className="text-center text-white/40 text-xs">
                    +{links.length - 3} altri link
                  </div>
                )}
              </div>

              {/* Powered by Preview */}
              <div className="text-center mt-6">
                <p className="text-xs text-white/40">
                  Powered by <span className="font-bold text-white/60">TapReview</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Page Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white text-center">Pagina Promozioni (/p/{username})</h3>
          <div className="max-w-sm mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-white/10">
              {/* Profile Header Preview */}
              <div className="text-center mb-6">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || user.username}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2"
                    style={{ borderColor: accentColor }}
                    data-testid="preview-promo-avatar"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold text-black border-2"
                    style={{ backgroundColor: accentColor, borderColor: accentColor }}
                    data-testid="preview-promo-avatar-placeholder"
                  >
                    {(profile.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                )}
                
                <h1
                  className="text-lg font-bold mb-2"
                  style={{ color: accentColor }}
                  data-testid="preview-promo-display-name"
                >
                  {profile.displayName || user.username}
                </h1>
                
                <p className="text-white/70 text-xs mb-4">
                  Partecipa alle nostre promozioni!
                </p>
              </div>

              {/* Promo Form Preview */}
              <div className="space-y-3">
                <div>
                  <label className="block text-white/70 text-xs mb-1">Nome</label>
                  <div className="w-full p-2 bg-white/10 rounded border border-white/20 text-white/50 text-xs">
                    Il tuo nome...
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Cognome</label>
                  <div className="w-full p-2 bg-white/10 rounded border border-white/20 text-white/50 text-xs">
                    Il tuo cognome...
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-xs mb-1">Email</label>
                  <div className="w-full p-2 bg-white/10 rounded border border-white/20 text-white/50 text-xs">
                    la.tua@email.com
                  </div>
                </div>
                <div
                  className="w-full p-2 rounded text-center font-medium text-black text-xs"
                  style={{ backgroundColor: accentColor }}
                  data-testid="preview-promo-button"
                >
                  Partecipa alla Promozione
                </div>
              </div>

              {/* Powered by Preview */}
              <div className="text-center mt-6">
                <p className="text-xs text-white/40">
                  Powered by <span className="font-bold text-white/60">TapReview</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}