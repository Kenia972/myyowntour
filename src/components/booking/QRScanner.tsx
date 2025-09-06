import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { QRCodeService, QRCodeData } from '../../services/qrCodeService';
import { NotificationService } from '../../services/notificationService';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess: (bookingData: any) => void;
  guideId: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  bookingData?: any;
}

export function QRScanner({ isOpen, onClose, onCheckInSuccess, guideId }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Start scanning when video is ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            startQRDetection();
          }
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResult({
        success: false,
        message: 'Unable to access camera. Please check permissions.'
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for QR code detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simple QR code detection (in production, use a proper QR library like jsQR)
        try {
          const qrData = detectQRCode(imageData);
          if (qrData) {
            handleQRCodeDetected(qrData);
            return; // Stop scanning
          }
        } catch (error) {
          console.error('QR detection error:', error);
        }
      }

      if (isScanning) {
        requestAnimationFrame(scanFrame);
      }
    };

    scanFrame();
  };

  // Simple QR code detection (replace with proper library in production)
  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a placeholder - in production, use jsQR or similar library
    // For now, we'll simulate detection with a manual input
    return null;
  };

  const handleQRCodeDetected = async (qrDataString: string) => {
    try {
      setIsProcessing(true);
      stopScanning();

      // Parse QR code data
      const qrData = QRCodeService.parseQRCodeData(qrDataString);
      
      if (!qrData) {
        setScanResult({
          success: false,
          message: 'Invalid QR code format'
        });
        setIsProcessing(false);
        return;
      }

      // Validate check-in with backend
      const { data, error } = await supabase.rpc('validate_checkin', {
        p_token: qrData.checkinToken,
        p_guide_id: guideId
      });

      if (error) {
        throw new Error(error.message);
      }

      const validationResult = data as any;

      if (!validationResult.success) {
        setScanResult({
          success: false,
          message: validationResult.error
        });
        setIsProcessing(false);
        return;
      }

      // Process check-in
      const { data: checkInData, error: checkInError } = await supabase.rpc('process_checkin', {
        p_token: qrData.checkinToken,
        p_guide_id: guideId
      });

      if (checkInError) {
        throw new Error(checkInError.message);
      }

      const checkInResult = checkInData as any;

      if (checkInResult.success) {
        setScanResult({
          success: true,
          message: checkInResult.message,
          bookingData: {
            ...qrData,
            checkInTime: checkInResult.checkin_time
          }
        });
        
        // Send check-in success notifications
        try {
          // Get full booking data for notifications
          const { data: bookingData } = await supabase!
            .from('bookings')
            .select(`
              *,
              excursion:excursions(title, guide_id),
              slot:availability_slots(date, start_time),
              client:profiles(first_name, last_name, email),
              guide:guides!excursions_guide_id_fkey(company_name, user_id)
            `)
            .eq('id', checkInResult.booking_id)
            .single();

          if (bookingData) {
            await NotificationService.sendCheckInSuccessNotifications(bookingData);
          }
        } catch (notificationError) {
          console.error('Error sending check-in notifications:', notificationError);
          // Don't fail the check-in if notifications fail
        }
        
        // Notify parent component
        onCheckInSuccess(checkInResult);
      } else {
        setScanResult({
          success: false,
          message: checkInResult.error || 'Check-in failed'
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setScanResult({
        success: false,
        message: error instanceof Error ? error.message : 'Check-in failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = () => {
    const token = prompt('Enter check-in token manually:');
    if (token) {
      handleQRCodeDetected(JSON.stringify({
        type: 'myowntour_booking',
        checkinToken: token,
        bookingId: '',
        excursionId: ''
      }));
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsProcessing(false);
    startScanning();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <QrCode className="h-6 w-6 mr-2" />
              QR Code Scanner
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {!scanResult && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Position the QR code within the camera view
                </p>
              </div>

              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                      <Loader className="h-4 w-4 animate-spin inline mr-2" />
                      Scanning...
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleManualInput}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  Manual Input
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                scanResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  {scanResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      scanResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {scanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
                    </p>
                    <p className={`text-sm ${
                      scanResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {scanResult.message}
                    </p>
                  </div>
                </div>
              </div>

              {scanResult.success && scanResult.bookingData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Booking Details</h3>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Client:</strong> {scanResult.bookingData.clientName}</p>
                    <p><strong>Excursion:</strong> {scanResult.bookingData.excursionTitle}</p>
                    <p><strong>Participants:</strong> {scanResult.bookingData.participantsCount}</p>
                    <p><strong>Check-in Time:</strong> {new Date(scanResult.bookingData.checkInTime).toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {scanResult.success ? (
                  <button
                    onClick={onClose}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Done
                  </button>
                ) : (
                  <button
                    onClick={resetScanner}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Processing check-in...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
