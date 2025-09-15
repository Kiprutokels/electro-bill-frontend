import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  settingsService, 
  SystemSettings, 
  UpdateSettingsRequest 
} from '@/api/services/settings.service';

export const useSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getCurrent();
      setSettings(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (id: string, data: UpdateSettingsRequest) => {
    try {
      setUpdating(true);
      const updatedSettings = await settingsService.update(id, data);
      setSettings(updatedSettings);
      toast.success('Settings updated successfully');
      return updatedSettings;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update settings';
      toast.error(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updating,
    error,
    fetchSettings,
    updateSettings,
  };
};
