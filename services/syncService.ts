import { MatchState } from '../types';

export class SyncService {
  private matchState: MatchState = {
    score: { sa: 24, nz: 21 },
    time: 68,
    momentum: 65,
    lastEvent: "TRY! Cheslin Kolbe weaves through the defense!",
    isLive: true
  };

  private listeners: Set<(state: MatchState) => void> = new Set();
  private timer: number | null = null;

  constructor() {
    this.startMatchSim();
  }

  private startMatchSim() {
    this.timer = window.setInterval(() => {
      if (!this.matchState.isLive) return;

      this.matchState.time = Math.min(80, this.matchState.time + 1);
      
      // Random event chance
      if (Math.random() > 0.9) {
        const isSA = Math.random() > 0.4;
        const isTry = Math.random() > 0.6;
        const scoreInc = isTry ? 7 : 3;
        
        if (isSA) this.matchState.score.sa += scoreInc;
        else this.matchState.score.nz += scoreInc;

        this.matchState.lastEvent = isSA 
          ? (isTry ? "TRY! Incredible team effort as the Boks power over the line!" : "PENALTY! Clinical finish from the tee.")
          : (isTry ? "TRY! All Blacks strike back with a counter-attack." : "PENALTY! NZ chip away at the lead.");
        
        this.matchState.momentum = isSA ? 75 : 35;
      } else {
        // Natural momentum drift
        this.matchState.momentum = Math.max(30, Math.min(80, this.matchState.momentum + (Math.random() > 0.5 ? 2 : -2)));
      }

      if (this.matchState.time >= 80) {
        this.matchState.isLive = false;
        this.matchState.lastEvent = "FULL TIME: What a match at the Brisbane Hub!";
      }

      this.notify();
    }, 15000); // Update every 15 seconds
  }

  subscribe(callback: (state: MatchState) => void) {
    this.listeners.add(callback);
    callback(this.matchState);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.matchState }));
  }

  getMatchState() {
    return { ...this.matchState };
  }
}

export const bokSync = new SyncService();