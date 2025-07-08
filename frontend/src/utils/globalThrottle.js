// frontend/src/utils/globalThrottle.js
class GlobalAPIThrottle {
  constructor() {
    this.lastFetch = {};
    this.minInterval = 15000; // 15 seconds minimum between same API calls
    this.activeRequests = new Set();
    this.blockedUntil = {};
  }

  canFetch(endpoint) {
    const now = Date.now();

    // Check if endpoint is temporarily blocked
    if (this.blockedUntil[endpoint] && now < this.blockedUntil[endpoint]) {
      console.log(
        `🚫 Endpoint ${endpoint} is blocked until ${new Date(
          this.blockedUntil[endpoint]
        ).toLocaleTimeString()}`
      );
      return false;
    }

    // Clear expired blocks
    if (this.blockedUntil[endpoint] && now >= this.blockedUntil[endpoint]) {
      delete this.blockedUntil[endpoint];
    }

    const lastTime = this.lastFetch[endpoint] || 0;

    // If same request is already in progress, block it
    if (this.activeRequests.has(endpoint)) {
      console.log(
        `🚫 Blocking duplicate request to ${endpoint} (already in progress)`
      );
      return false;
    }

    // If last fetch was too recent, block it
    if (now - lastTime < this.minInterval) {
      const timeLeft = Math.round((this.minInterval - (now - lastTime)) / 1000);
      console.log(`⏱️ Throttling ${endpoint} - ${timeLeft}s remaining`);
      return false;
    }

    return true;
  }

  startFetch(endpoint) {
    this.lastFetch[endpoint] = Date.now();
    this.activeRequests.add(endpoint);
    console.log(`✅ Starting fetch to ${endpoint}`);
  }

  endFetch(endpoint) {
    this.activeRequests.delete(endpoint);
    console.log(`✅ Completed fetch to ${endpoint}`);
  }

  // Block an endpoint for a specific duration
  blockEndpoint(endpoint, durationMs = 30000) {
    this.blockedUntil[endpoint] = Date.now() + durationMs;
    console.log(`🛑 Blocked ${endpoint} for ${durationMs / 1000}s`);
  }

  // Emergency method to stop all API calls for 30 seconds
  emergencyStop() {
    const now = Date.now();
    const stopTime = 30000; // 30 seconds

    // Block all known endpoints for 30 seconds
    const commonEndpoints = [
      "/api/projects",
      "/api/users",
      "/api/analytics/dashboard",
      "/projects",
      "/users",
      "/analytics/dashboard",
    ];

    commonEndpoints.forEach((endpoint) => {
      this.blockedUntil[endpoint] = now + stopTime;
    });

    // Clear all active requests
    this.activeRequests.clear();

    console.log("🛑 EMERGENCY STOP: All API calls blocked for 30 seconds");
  }

  // Get status for debugging
  getStatus() {
    const now = Date.now();
    return {
      activeRequests: Array.from(this.activeRequests),
      blockedEndpoints: Object.entries(this.blockedUntil)
        .filter(([endpoint, until]) => now < until)
        .map(([endpoint, until]) => ({
          endpoint,
          blockedFor: Math.round((until - now) / 1000) + "s",
        })),
      lastFetchTimes: Object.entries(this.lastFetch).map(
        ([endpoint, time]) => ({
          endpoint,
          secondsAgo: Math.round((now - time) / 1000),
        })
      ),
    };
  }
}

// Global instance
const globalThrottle = new GlobalAPIThrottle();

// Make it available globally for debugging
if (typeof window !== "undefined") {
  window.globalThrottle = globalThrottle;
}

export default globalThrottle;
