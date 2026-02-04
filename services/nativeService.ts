
/**
 * NativeService Bridge
 * Provides a unified interface for Haptics and Device features.
 * Falls back to Web API or No-op when not running in Capacitor.
 */

export class NativeService {
  private isNative: boolean;

  constructor() {
    this.isNative = (window as any).Capacitor !== undefined;
    this.initPlatform();
  }

  private async initPlatform() {
    if (this.isNative) {
      await this.setStatusBarColor('#004d3d', true);
    }
  }

  /**
   * Triggers a light physical impact vibration
   */
  async hapticImpact() {
    if (this.isNative) {
      const { Haptics, ImpactStyle } = (window as any).Capacitor.Plugins;
      if (Haptics) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }

  /**
   * Triggers a success notification pattern
   */
  async hapticSuccess() {
    if (this.isNative) {
      const { Haptics, NotificationType } = (window as any).Capacitor.Plugins;
      if (Haptics) {
        await Haptics.notification({ type: NotificationType.Success });
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
  }

  /**
   * Triggers an error notification pattern
   */
  async hapticError() {
    if (this.isNative) {
      const { Haptics, NotificationType } = (window as any).Capacitor.Plugins;
      if (Haptics) {
        await Haptics.notification({ type: NotificationType.Error });
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50, 100]);
    }
  }

  /**
   * Sets the status bar color
   */
  async setStatusBarColor(color: string = '#004d3d', isDark: boolean = true) {
    if (this.isNative) {
      const { StatusBar } = (window as any).Capacitor.Plugins;
      if (StatusBar) {
        try {
          await StatusBar.setBackgroundColor({ color });
          // Note: In Capacitor 5+ setStyle uses an object
          const { Style } = (window as any).Capacitor.Plugins.StatusBar;
          await StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
        } catch (e) {
          console.warn("StatusBar plugin error:", e);
        }
      }
    }
  }
}

export const native = new NativeService();
