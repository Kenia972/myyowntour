import QRCode from 'qrcode';
import { Booking } from '../lib/supabase';

export interface QRCodeData {
  bookingId: string;
  checkinToken: string;
  excursionId: string;
  clientName?: string;
  clientEmail?: string;
  excursionTitle: string;
  bookingDate: string;
  participantsCount: number;
  totalAmount: number;
}

export interface QRCodeGenerationOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export class QRCodeService {
  private static defaultOptions: QRCodeGenerationOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };

  /**
   * Generate QR code data object for a booking
   */
  static generateQRCodeData(booking: Booking): QRCodeData {
    return {
      bookingId: booking.id,
      checkinToken: booking.checkin_token || '',
      excursionId: booking.excursion_id,
      clientName: booking.client_name || booking.client?.first_name + ' ' + booking.client?.last_name,
      clientEmail: booking.client_email || booking.client?.email,
      excursionTitle: booking.excursion?.title || '',
      bookingDate: booking.booking_date,
      participantsCount: booking.participants_count,
      totalAmount: booking.total_amount
    };
  }

  /**
   * Generate QR code as base64 image
   */
  static async generateQRCodeImage(
    data: QRCodeData, 
    options: QRCodeGenerationOptions = {}
  ): Promise<string> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      // Create the data string to encode
      const qrDataString = this.createQRDataString(data);
      
      // Generate QR code as base64
      const qrCodeBase64 = await QRCode.toDataURL(qrDataString, {
        width: mergedOptions.width,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel
      });
      
      return qrCodeBase64;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateQRCodeSVG(
    data: QRCodeData, 
    options: QRCodeGenerationOptions = {}
  ): Promise<string> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      // Create the data string to encode
      const qrDataString = this.createQRDataString(data);
      
      // Generate QR code as SVG
      const qrCodeSVG = await QRCode.toString(qrDataString, {
        type: 'svg',
        width: mergedOptions.width,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel
      });
      
      return qrCodeSVG;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Create a structured data string for QR code encoding
   */
  private static createQRDataString(data: QRCodeData): string {
    const qrData = {
      type: 'myowntour_booking',
      version: '1.0',
      bookingId: data.bookingId,
      checkinToken: data.checkinToken,
      excursionId: data.excursionId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      excursionTitle: data.excursionTitle,
      bookingDate: data.bookingDate,
      participantsCount: data.participantsCount,
      totalAmount: data.totalAmount,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  }

  /**
   * Parse QR code data from scanned string
   */
  static parseQRCodeData(qrDataString: string): QRCodeData | null {
    try {
      const parsed = JSON.parse(qrDataString);
      
      // Validate the QR code structure
      if (parsed.type !== 'myowntour_booking' || !parsed.bookingId || !parsed.checkinToken) {
        return null;
      }
      
      return {
        bookingId: parsed.bookingId,
        checkinToken: parsed.checkinToken,
        excursionId: parsed.excursionId,
        clientName: parsed.clientName,
        clientEmail: parsed.clientEmail,
        excursionTitle: parsed.excursionTitle,
        bookingDate: parsed.bookingDate,
        participantsCount: parsed.participantsCount,
        totalAmount: parsed.totalAmount
      };
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      return null;
    }
  }

  /**
   * Generate a simple QR code with just the checkin token
   */
  static async generateSimpleQRCode(
    checkinToken: string, 
    options: QRCodeGenerationOptions = {}
  ): Promise<string> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      const qrCodeBase64 = await QRCode.toDataURL(checkinToken, {
        width: mergedOptions.width,
        margin: mergedOptions.margin,
        color: mergedOptions.color,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel
      });
      
      return qrCodeBase64;
    } catch (error) {
      console.error('Error generating simple QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate QR code data structure
   */
  static validateQRCodeData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.type === 'myowntour_booking' &&
      typeof data.bookingId === 'string' &&
      typeof data.checkinToken === 'string' &&
      typeof data.excursionId === 'string'
    );
  }

  /**
   * Generate QR code for booking confirmation
   */
  static async generateBookingQRCode(booking: Booking): Promise<{
    qrCodeData: QRCodeData;
    qrCodeImage: string;
    qrCodeSVG: string;
  }> {
    try {
      const qrCodeData = this.generateQRCodeData(booking);
      const qrCodeImage = await this.generateQRCodeImage(qrCodeData);
      const qrCodeSVG = await this.generateQRCodeSVG(qrCodeData);
      
      return {
        qrCodeData,
        qrCodeImage,
        qrCodeSVG
      };
    } catch (error) {
      console.error('Error generating booking QR code:', error);
      throw new Error('Failed to generate booking QR code');
    }
  }
}

export default QRCodeService;
