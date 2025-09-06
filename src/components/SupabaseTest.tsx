import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured'>('checking');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      if (!isSupabaseConfigured()) {
        setConnectionStatus('not-configured');
        setTestResult('Environment variables not configured');
        return;
      }

      if (!supabase) {
        setConnectionStatus('error');
        setTestResult('Supabase client not initialized');
        return;
      }

      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        setConnectionStatus('error');
        setTestResult(`Database error: ${error.message}`);
      } else {
        setConnectionStatus('connected');
        setTestResult('Successfully connected to Supabase!');
      }
    } catch (err) {
      setConnectionStatus('error');
      setTestResult(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <Loader className="h-5 w-5 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'not-configured':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Checking connection...';
      case 'connected':
        return 'Connected to Supabase';
      case 'error':
        return 'Connection failed';
      case 'not-configured':
        return 'Not configured';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'text-blue-600';
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'not-configured':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 border max-w-sm z-50">
      <div className="flex items-center space-x-3 mb-3">
        {getStatusIcon()}
        <div>
          <h3 className="font-semibold text-gray-900">Supabase Status</h3>
          <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
        </div>
      </div>
      
      <div className="text-xs text-gray-600 mb-3">
        {testResult}
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Environment:</span>
          <span className={isSupabaseConfigured() ? 'text-green-600' : 'text-red-600'}>
            {isSupabaseConfigured() ? 'Configured' : 'Not configured'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Client:</span>
          <span className={supabase ? 'text-green-600' : 'text-red-600'}>
            {supabase ? 'Initialized' : 'Not initialized'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>URL:</span>
          <span className="text-gray-500 truncate max-w-32">
            {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
          </span>
        </div>
      </div>
      
      <button
        onClick={testSupabaseConnection}
        className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded transition-colors"
      >
        Test Connection
      </button>
    </div>
  );
}
