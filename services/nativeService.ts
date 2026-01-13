/**
 * NativeService Bridge
 * Provides a unified interface for Haptics and Device features.
 * Falls back to Web API or No-op when not running in Capacitor.
 */

export class NativeService {
  private isNative: boolean;

  constructor() {
    // Basic detection for Capacitor runtime
    this.isNative = (window as any).Capacitor !== undefined;
  }

  /**
   * Triggers a light physical impact vibration
   * Ideal for button taps and UI interactions
   */
  async hapticImpact() {
    if (this.isNative) {
      const { Haptics, ImpactStyle } = (window as any).Capacitor.Plugins;
      if (Haptics) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } else if ('vibrate' in navigator) {
      // Web fallback
      navigator.vibrate(10);
    }
  }

  /**
   * Triggers a success notification pattern
   * Ideal for payments, order confirmations, or Bok points earned
   */
  async hapticSuccess() {
    if (this.isNative) {
      const { Haptics, NotificationType } = (window as any).Capacitor.Plugins;
      if (Haptics) {
        await Haptics.notification({ type: NotificationType.Success });
      }
    } else if ('vibrate' in navigator) {
      // Web fallback: Short double pulse
      navigator.vibrate([15, 30, 15]);
    }
  }

  /**
   * Sets the status bar color (for Android/iOS)
   */
  async setStatusBarColor(color: string = '#004d3d', isDark: boolean = true) {
    if (this.isNative) {
      const { StatusBar, Style } = (window as any).Capacitor.Plugins;
      if (StatusBar) {
        await StatusBar.setBackgroundColor({ color });
        await StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
      }
    }
  }
}

export const native = new NativeService();