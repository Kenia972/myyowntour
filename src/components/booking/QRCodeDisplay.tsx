import React, { useState, useEffect } from 'react';
import { QrCode, Download, Eye, CheckCircle, Clock, User, Calendar, MapPin, X, Users, DollarSign } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { QRCodeService, QRCodeData } from '../../services/qrCodeService';

interface QRCodeDisplayProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeDisplay({ booking, isOpen, onClose }: QRCodeDisplayProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      generateQRCode();
    }
  }, [isOpen, booking]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      
      // Generate QR code data and image
      const { qrCodeData, qrCodeImage } = await QRCodeService.generateBookingQRCode(booking);
      
      setQrCodeData(qrCodeData);
      setQrCodeImage(qrCodeImage);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeImage) return;

    // Create a canvas with QR code and text information
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (wider to accommodate text)
    canvas.width = 400;
    canvas.height = 450;

    // Create image from QR code
    const qrImg = new Image();
    qrImg.onload = () => {
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Myowntour - QR Code de Réservation', canvas.width / 2, 30);

      // Add booking details
      ctx.font = '14px Arial';
      ctx.fillStyle = '#374151';
      ctx.fillText(`Excursion: ${booking.excursion?.title || 'N/A'}`, canvas.width / 2, 60);
      ctx.fillText(`Date: ${new Date(booking.slot?.date || '').toLocaleDateString('fr-FR')}`, canvas.width / 2, 80);
      ctx.fillText(`Heure: ${booking.slot?.start_time || 'N/A'}`, canvas.width / 2, 100);
      ctx.fillText(`Participants: ${booking.participants_count}`, canvas.width / 2, 120);

      // Draw QR code (smaller to leave room for text)
      const qrSize = 200;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 140;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Add instructions
      ctx.font = '12px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Présentez ce QR code à votre guide pour le check-in', canvas.width / 2, 360);

      // Add footer
      ctx.font = '10px Arial';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('Généré le ' + new Date().toLocaleString('fr-FR'), canvas.width / 2, 430);

      // Download the enhanced image
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `booking-${booking.id}-qr-code-enhanced.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    qrImg.src = qrCodeImage;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      case 'completed': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <QrCode className="h-6 w-6 mr-2" />
              Votre QR Code de Réservation
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Booking Status */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {booking.is_checked_in ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  )}
                  <span className="font-semibold text-blue-900">
                    {booking.is_checked_in ? 'Check-in effectué' : 'En attente de check-in'}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
              {booking.checkin_time && (
                <p className="text-sm text-blue-700 mt-1">
                  Check-in le {new Date(booking.checkin_time).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            {/* QR Code Display */}
            <div className="text-center">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
                {isLoading ? (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : qrCodeImage ? (
                  <img
                    src={qrCodeImage}
                    alt="QR Code de réservation"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-500">
                    <QrCode className="h-16 w-16" />
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                Présentez ce QR code à votre guide pour le check-in
              </p>
            </div>

            {/* Booking Details - Always show by default */}
            <div className="border-t pt-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Détails de la réservation
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        <strong>Date:</strong> {new Date(booking.slot?.date || '').toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        <strong>Heure:</strong> {booking.slot?.start_time || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        <strong>Excursion:</strong> {booking.excursion?.title || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        <strong>Participants:</strong> {booking.participants_count}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        <strong>Total:</strong> {booking.total_amount}€
                      </span>
                    </div>
                  </div>
                </div>

                {booking.special_requests && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Demandes spéciales</h4>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                      {booking.special_requests}
                    </p>
                  </div>
                )}

              </div>
            </div>


            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={downloadQRCode}
                disabled={!qrCodeImage}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger QR Code
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
