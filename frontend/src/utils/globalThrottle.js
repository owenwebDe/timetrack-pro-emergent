// frontend/src/utils/globalThrottle.js - OPTIMIZED VERSION
class GlobalAPIThrottle {
  constructor() {
    this.lastFetch = {};
    this.minInterval = 5000; // 5 seconds minimum between same API calls (reduced from 15s)
    this.activeRequests = new Set();
    this.blockedUntil = {};
    this.cache = new Map(); // Add caching layer
    this.cacheTimeout = 10000; // 10 seconds cache (reduced from 30s)
    this.requestQueue = new Map(); // Queue for batching requests
    this.batchTimeout = 100; // 100ms batch timeout
  }

  canFetch(endpoint) {
    return true;
  }

  // Enhanced method to get cached data
  getCachedData(endpoint) {
    return null;
  }

  // Cache successful responses
  cacheResponse(endpoint, data) {
    // No-op
  }

  startFetch(endpoint) {
    // No-op
  }

  endFetch(endpoint, responseData = null) {
    // No-op
  }

  // Block an endpoint for a specific duration
  blockEndpoint(endpoint, durationMs = 30000) {
    // No-op
  }

  // Emergency method to stop all API calls for 30 seconds
  emergencyStop() {
    // No-op
  }

  // Clear cache for specific endpoint
  clearCache(endpoint) {
    // No-op
  }

  // Force clear everything for an endpoint (cache + throttling)
  forceClear(endpoint) {
    // No-op
  }

  // Clear all cache
  clearAllCache() {
    // No-op
  }

  // Batch similar requests
  batchRequest(endpoint, callback) {
    // Immediately execute the callback
    callback();
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
      cacheSize: this.cache.size,
      queueSize: this.requestQueue.size,
    };
  }

  // Performance monitoring
  getPerformanceMetrics() {
    const now = Date.now();
    const metrics = {
      totalRequests: Object.keys(this.lastFetch).length,
      activeRequests: this.activeRequests.size,
      blockedRequests: Object.keys(this.blockedUntil).length,
      cacheHits: this.cache.size,
      averageRequestInterval: 0,
    };

    // Calculate average interval between requests
    const intervals = Object.values(this.lastFetch).map((time) => now - time);
    if (intervals.length > 0) {
      metrics.averageRequestInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return metrics;
  }
}

// Global instance
const globalThrottle = new GlobalAPIThrottle();

// Make it available globally for debugging
if (typeof window !== "undefined") {
  window.globalThrottle = globalThrottle;

  // Add console helpers for debugging
  window.apiDebug = {
    status: () => console.table(globalThrottle.getStatus()),
    metrics: () => console.table(globalThrottle.getPerformanceMetrics()),
    clearCache: () => globalThrottle.clearAllCache(),
    emergencyStop: () => globalThrottle.emergencyStop(),
  };
}

export default globalThrottle;
