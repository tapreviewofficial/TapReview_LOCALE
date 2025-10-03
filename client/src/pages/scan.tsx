import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  status: "valid" | "used" | "expired" | "not_found";
  code?: string;
  usedAt?: string;
  promo?: {
    title: string;
    description: string;
  };
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>("");
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const { toast } = useToast();

  const startScanning = async () => {
    setError("");
    setResult(null);
    setScanResult(null);
    
    try {
      // Controlla permessi camera
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(permission.state);
      
      if (permission.state === 'denied') {
        setError("Accesso alla fotocamera negato. Abilita i permessi nelle impostazioni del browser.");
        return;
      }

      const codeReader = new BrowserMultiFormatReader();
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (devices.length === 0) {
        setError("Nessuna fotocamera trovata sul dispositivo.");
        return;
      }

      // Preferisci fotocamera posteriore se disponibile
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      const selectedCamera = backCamera || devices[0];

      setIsScanning(true);
      
      await codeReader.decodeFromVideoDevice(
        selectedCamera.deviceId, 
        videoRef.current!, 
        (result, error) => {
          if (result) {
            const text = result.getText();
            setResult(text);
            setIsScanning(false);
            codeReader.reset();
            handleDecoded(text);
          }
          // Non loggare errori di decodifica continui
        }
      );
      
    } catch (err: any) {
      console.error("Errore avvio scanner:", err);
      setError(err.message || "Errore durante l'avvio della fotocamera");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    // Reset del video
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleDecoded = async (text: string) => {
    try {
      // Estrai il codice dall'URL se necessario
      let code = text;
      const match = text.match(/\/q\/([A-Za-z0-9_-]+)/);
      if (match) {
        code = match[1];
      }

      // Controlla stato del ticket
      const statusResponse = await fetch(`/api/tickets/${code}/status`);
      const statusData = await statusResponse.json();

      if (statusData.status === "not_found") {
        setScanResult({ status: "not_found", code });
        toast({
          title: "Codice non valido",
          description: "Il codice QR scansionato non è valido.",
          variant: "destructive",
        });
        return;
      }

      if (statusData.status === "expired") {
        setScanResult({ status: "expired", code, promo: statusData.promo });
        toast({
          title: "Biglietto scaduto",
          description: "Questo biglietto è scaduto e non può essere utilizzato.",
          variant: "destructive",
        });
        return;
      }

      if (statusData.status === "used") {
        setScanResult({ 
          status: "used", 
          code, 
          usedAt: statusData.usedAt, 
          promo: statusData.promo 
        });
        toast({
          title: "Biglietto già utilizzato",
          description: "Questo biglietto è già stato utilizzato.",
          variant: "destructive",
        });
        return;
      }

      // Il biglietto è valido, marchalo come usato
      const useResponse = await fetch(`/api/tickets/${code}/use`, {
        method: "POST",
        credentials: "include", // Include cookies se utente loggato
      });
      const useData = await useResponse.json();

      setScanResult({
        status: "valid",
        code,
        usedAt: useData.usedAt,
        promo: useData.promo,
      });

      toast({
        title: "Biglietto validato!",
        description: "Il biglietto è stato utilizzato con successo.",
      });

    } catch (error: any) {
      console.error("Errore validazione:", error);
      setError("Errore durante la validazione del biglietto");
      toast({
        title: "Errore di validazione",
        description: "Si è verificato un errore durante la validazione.",
        variant: "destructive",
      });
    }
  };

  const resetScanner = () => {
    setResult(null);
    setScanResult(null);
    setError("");
  };

  const getResultIcon = () => {
    if (!scanResult) return null;
    
    switch (scanResult.status) {
      case "valid":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "used":
        return <CheckCircle className="h-12 w-12 text-blue-500" />;
      case "expired":
        return <Clock className="h-12 w-12 text-orange-500" />;
      case "not_found":
        return <XCircle className="h-12 w-12 text-destructive" />;
    }
  };

  const getResultMessage = () => {
    if (!scanResult) return null;
    
    switch (scanResult.status) {
      case "valid":
        return "Biglietto validato con successo!";
      case "used":
        return "Biglietto già utilizzato";
      case "expired":
        return "Biglietto scaduto";
      case "not_found":
        return "Codice non valido";
    }
  };

  const getResultBadge = () => {
    if (!scanResult) return null;
    
    switch (scanResult.status) {
      case "valid":
        return <Badge className="bg-green-500">VALIDATO</Badge>;
      case "used":
        return <Badge className="bg-blue-500">GIÀ USATO</Badge>;
      case "expired":
        return <Badge className="bg-orange-500">SCADUTO</Badge>;
      case "not_found":
        return <Badge variant="destructive">NON VALIDO</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="container mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Camera className="h-6 w-6" />
              Scanner QR Biglietti
            </CardTitle>
            <CardDescription>
              Scansiona i codici QR per validare i biglietti
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Area video scanner */}
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ display: isScanning ? "block" : "none" }}
              />
              
              {!isScanning && !scanResult && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <CameraOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Premi per avviare la fotocamera</p>
                  </div>
                </div>
              )}

              {/* Overlay del risultato */}
              {scanResult && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center text-white space-y-3">
                    {getResultIcon()}
                    <div>
                      <p className="font-semibold">{getResultMessage()}</p>
                      {scanResult.code && (
                        <p className="text-sm opacity-75">Codice: {scanResult.code}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stato e badge */}
            {scanResult && (
              <div className="text-center space-y-3">
                {getResultBadge()}
                
                {scanResult.promo && (
                  <Card>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-sm">{scanResult.promo.title}</h3>
                      {scanResult.promo.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {scanResult.promo.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {scanResult.usedAt && (
                  <p className="text-xs text-muted-foreground">
                    Utilizzato: {new Date(scanResult.usedAt).toLocaleString("it-IT")}
                  </p>
                )}
              </div>
            )}

            {/* Errori */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Codice letto */}
            {result && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Codice scansionato:</p>
                <p className="font-mono text-sm bg-muted rounded px-2 py-1">{result}</p>
              </div>
            )}

            {/* Controlli */}
            <div className="space-y-2">
              {!isScanning && !scanResult && (
                <Button onClick={startScanning} className="w-full bg-[#CC9900] hover:bg-[#CC9900]/80">
                  <Camera className="h-4 w-4 mr-2" />
                  Avvia Scanner
                </Button>
              )}
              
              {isScanning && (
                <Button onClick={stopScanning} variant="destructive" className="w-full">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Ferma Scanner
                </Button>
              )}
              
              {scanResult && (
                <Button onClick={resetScanner} className="w-full" variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Scansiona Altro
                </Button>
              )}
            </div>

            {cameraPermission === "denied" && (
              <Alert>
                <AlertDescription>
                  Per utilizzare lo scanner, abilita l'accesso alla fotocamera nelle impostazioni del browser.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}