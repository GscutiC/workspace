/**
 * Easing functions for smooth avatar movement
 */
export class MovementEasing {
  /**
   * Linear interpolation
   */
  static linear(t: number): number {
    return t;
  }

  /**
   * Ease out cubic - smooth deceleration
   */
  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Ease in out cubic - smooth acceleration and deceleration
   */
  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Ease out quart - very smooth deceleration
   */
  static easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Custom avatar movement easing - optimized for game feel
   */
  static avatarMovement(t: number): number {
    // Faster start, smoother finish
    return t < 0.3 ? 2.5 * t * t : 1 - 0.5 * Math.pow(2 - 2 * t, 2);
  }

  /**
   * Interpolate between two values using easing function
   */
  static lerp(start: number, end: number, t: number, easingFn = MovementEasing.linear): number {
    const easedT = easingFn(Math.max(0, Math.min(1, t)));
    return start + (end - start) * easedT;
  }

  /**
   * Interpolate between two positions
   */
  static lerpPosition(
    start: { x: number; y: number },
    end: { x: number; y: number },
    t: number,
    easingFn = MovementEasing.linear
  ): { x: number; y: number } {
    return {
      x: MovementEasing.lerp(start.x, end.x, t, easingFn),
      y: MovementEasing.lerp(start.y, end.y, t, easingFn)
    };
  }

  /**
   * Calculate smooth movement speed based on distance
   */
  static calculateDynamicSpeed(distance: number, baseSpeed: number): number {
    // Shorter distances = slower speed for precision
    // Longer distances = faster speed for efficiency
    if (distance < 50) {
      return baseSpeed * 0.6; // 60% speed for short distances
    } else if (distance < 150) {
      return baseSpeed; // Normal speed for medium distances
    } else {
      return baseSpeed * 1.4; // 140% speed for long distances
    }
  }

  /**
   * Calculate movement progress with time-based easing
   */
  static calculateMovementProgress(
    elapsedTime: number,
    totalDuration: number,
    easingFn = MovementEasing.avatarMovement
  ): number {
    if (totalDuration <= 0) return 1;
    const t = Math.min(elapsedTime / totalDuration, 1);
    return easingFn(t);
  }
}