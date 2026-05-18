import { Platform } from 'react-native';

export interface VoiceMessage {
  uri: string;
  duration: number;
  mimeType: string;
}

if (Platform.OS !== 'web') {
  // Mobile implementation using expo-av
  var Audio: any;
  try {
    Audio = require('expo-av').Audio;
  } catch (e) {
    // expo-av not available
  }
}

export class VoiceRecorder {
  private static recording: any = null;
  private static isRecording: boolean = false;
  private static startTime: number = 0;

  static async startRecording(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await this.startWebRecording();
      } else if (Audio) {
        await Audio.requestPermissionsAsync();
        const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        this.recording = recording;
        this.isRecording = true;
        this.startTime = Date.now();
        await recording.startAsync();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  private static mediaRecorder: any = null;
  private static audioChunks: Blob[] = [];

  private static async startWebRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: any) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.startTime = Date.now();
    } catch (error) {
      console.error('Failed to start web recording:', error);
      throw error;
    }
  }

  static async stopRecording(): Promise<VoiceMessage | null> {
    try {
      if (!this.isRecording) return null;

      if (Platform.OS === 'web') {
        return this.stopWebRecording();
      } else if (this.recording) {
        await this.recording.stopAsync();
        const uri = this.recording.getURI();
        const duration = (Date.now() - this.startTime) / 1000;
        this.recording = null;
        this.isRecording = false;
        return {
          uri,
          duration,
          mimeType: 'audio/m4a',
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      this.isRecording = false;
      throw error;
    }
  }

  private static stopWebRecording(): Promise<VoiceMessage> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recorder available'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const uri = URL.createObjectURL(audioBlob);
        const duration = (Date.now() - this.startTime) / 1000;

        this.mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;

        resolve({
          uri,
          duration,
          mimeType: 'audio/webm',
        });
      };

      this.mediaRecorder.stop();
    });
  }

  static isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}
