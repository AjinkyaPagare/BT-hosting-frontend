import api from "./api";

export interface GeneralSettings {
  id: number;
  user_settings_id: number;
  language: string;
  date_format: string;
  time_format: string;
}

export interface GeneralSettingsUpdatePayload {
  language?: string;
  date_format?: string;
  time_format?: string;
}

export interface NotificationSettings {
  id: number;
  user_settings_id: number;
  notifications_enabled: boolean;
  notification_sound: string;
  notification_preference: string;
  sound_enabled: boolean;
  message_sound: string;
}

export interface NotificationSettingsUpdatePayload {
  notifications_enabled?: boolean;
  notification_sound?: string;
  notification_preference?: string;
  sound_enabled?: boolean;
  message_sound?: string;
}

export const getGeneralSettings = async (): Promise<GeneralSettings> => {
  const { data } = await api.get<GeneralSettings>("/settings/general");
  return data;
};

export const updateGeneralSettings = async (
  payload: GeneralSettingsUpdatePayload,
): Promise<GeneralSettings> => {
  const { data } = await api.put<GeneralSettings>("/settings/general", payload);
  return data;
};

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const { data } = await api.get<NotificationSettings>("/settings/notifications");
  return data;
};

export const updateNotificationSettings = async (
  payload: NotificationSettingsUpdatePayload,
): Promise<NotificationSettings> => {
  const { data } = await api.put<NotificationSettings>("/settings/notifications", payload);
  return data;
};
