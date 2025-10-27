// Zoom meeting interfaces and types

export interface ZoomMeetingRequest {
  appointmentId: string;
  topic: string;
  startTime: Date;
  duration: number; // in minutes
  hostEmail: string;
  participantEmail: string;
  participantName: string;
}

export interface ZoomMeetingResponse {
  id: string;
  meetingId: string;
  topic: string;
  startTime: Date;
  duration: number;
  hostUrl: string;
  joinUrl: string;
  password: string;
  status: ZoomMeetingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoomMeetingDetails {
  id: string;
  meetingId: string;
  topic: string;
  startTime: Date;
  duration: number;
  hostUrl: string;
  joinUrl: string;
  password: string;
  status: ZoomMeetingStatus;
  hostEmail: string;
  participants: ZoomParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoomParticipant {
  email: string;
  name: string;
  role: 'host' | 'participant';
}

export interface ZoomMeetingUpdate {
  topic?: string;
  startTime?: Date;
  duration?: number;
  status?: ZoomMeetingStatus;
}

export interface ZoomWebhookEvent {
  event: string;
  payload: {
    account_id: string;
    object: {
      id: string;
      uuid: string;
      host_id: string;
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      timezone: string;
      created_at: string;
      join_url: string;
      password: string;
    };
  };
}

export interface ZoomAPICredentials {
  apiKey: string;
  apiSecret: string;
  accountId: string;
}

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface ZoomCreateMeetingRequest {
  topic: string;
  type: number; // 1 = instant, 2 = scheduled, 3 = recurring with no fixed time, 8 = recurring with fixed time
  start_time: string; // ISO 8601 format
  duration: number; // in minutes
  timezone: string;
  password?: string;
  agenda?: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number; // 0 = automatically approve, 1 = manually approve, 2 = no registration required
    audio: string; // both, telephony, voip
    auto_recording: string; // none, local, cloud
    enforce_login: boolean;
    enforce_login_domains?: string;
    alternative_hosts?: string;
    waiting_room: boolean;
  };
}

export interface ZoomCreateMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  start_url: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    audio: string;
    auto_recording: string;
    enforce_login: boolean;
    enforce_login_domains: string;
    alternative_hosts: string;
    waiting_room: boolean;
  };
}

export enum ZoomMeetingStatus {
  SCHEDULED = 'scheduled',
  STARTED = 'started',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface ZoomMeetingStats {
  totalMeetings: number;
  activeMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
}

export interface ZoomError {
  code: number;
  message: string;
}