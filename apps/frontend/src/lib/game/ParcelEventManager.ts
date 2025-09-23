/**
 * Optimized Parcel Event Manager
 * Uses event delegation and centralized event handling for better performance
 */

import { Container, FederatedPointerEvent } from 'pixi.js';
import type { ParcelInfo } from './generators/CityGenerator';

export interface ParcelEventCallbacks {
  onParcelHover?: (parcel: ParcelInfo | null) => void;
  onParcelClick?: (parcel: ParcelInfo) => void;
  onParcelDoubleClick?: (parcel: ParcelInfo) => void;
}

export class ParcelEventManager {
  private parcelContainer: Container;
  private parcelsMap: Map<string, ParcelInfo>;
  private callbacks: ParcelEventCallbacks;
  private hoveredParcel: ParcelInfo | null = null;
  private clickTimeout: number | null = null;
  private readonly DOUBLE_CLICK_DELAY = 300; // milliseconds

  constructor(parcelContainer: Container, callbacks: ParcelEventCallbacks = {}) {
    this.parcelContainer = parcelContainer;
    this.parcelsMap = new Map();
    this.callbacks = callbacks;

    this.setupEventDelegation();
  }

  /**
   * Setup centralized event delegation on the parcel container
   */
  private setupEventDelegation(): void {
    // Enable interaction on the main container
    this.parcelContainer.eventMode = 'static';

    // Use event delegation instead of individual listeners
    this.parcelContainer.on('pointerover', this.handlePointerOver.bind(this));
    this.parcelContainer.on('pointerout', this.handlePointerOut.bind(this));
    this.parcelContainer.on('pointertap', this.handlePointerTap.bind(this));
    this.parcelContainer.on('pointermove', this.handlePointerMove.bind(this));
  }

  /**
   * Register a parcel for event handling
   */
  public registerParcel(parcel: ParcelInfo, containerName: string): void {
    this.parcelsMap.set(containerName, parcel);
  }

  /**
   * Unregister a parcel from event handling
   */
  public unregisterParcel(containerName: string): void {
    this.parcelsMap.delete(containerName);
  }

  /**
   * Clear all registered parcels
   */
  public clearAllParcels(): void {
    this.parcelsMap.clear();
    this.hoveredParcel = null;
  }

  /**
   * Update callbacks
   */
  public setCallbacks(callbacks: ParcelEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Handle pointer over events with delegation
   */
  private handlePointerOver(event: FederatedPointerEvent): void {
    const target = event.target as Container;
    const parcel = this.getParcelFromTarget(target);

    if (parcel && parcel !== this.hoveredParcel) {
      this.hoveredParcel = parcel;
      this.applyHoverEffect(target, true);
      this.callbacks.onParcelHover?.(parcel);
    }
  }

  /**
   * Handle pointer out events with delegation
   */
  private handlePointerOut(event: FederatedPointerEvent): void {
    const target = event.target as Container;
    const parcel = this.getParcelFromTarget(target);

    if (parcel && parcel === this.hoveredParcel) {
      this.hoveredParcel = null;
      this.applyHoverEffect(target, false);
      this.callbacks.onParcelHover?.(null);
    }
  }

  /**
   * Handle pointer move events for hover updates
   */
  private handlePointerMove(event: FederatedPointerEvent): void {
    const target = event.target as Container;
    const parcel = this.getParcelFromTarget(target);

    // If moving from one parcel to another or to empty space
    if (parcel !== this.hoveredParcel) {
      if (this.hoveredParcel) {
        // Remove hover from previous parcel
        const previousTarget = this.findTargetByParcel(this.hoveredParcel);
        if (previousTarget) {
          this.applyHoverEffect(previousTarget, false);
        }
      }

      this.hoveredParcel = parcel;

      if (parcel) {
        this.applyHoverEffect(target, true);
      }

      this.callbacks.onParcelHover?.(parcel);
    }
  }

  /**
   * Handle pointer tap events with double-click detection
   */
  private handlePointerTap(event: FederatedPointerEvent): void {
    const target = event.target as Container;
    const parcel = this.getParcelFromTarget(target);

    if (!parcel) return;

    // Handle double-click detection
    if (this.clickTimeout) {
      // This is a second click within the double-click delay
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.callbacks.onParcelDoubleClick?.(parcel);
    } else {
      // This is the first click, wait for potential second click
      this.clickTimeout = window.setTimeout(() => {
        this.clickTimeout = null;
        this.callbacks.onParcelClick?.(parcel);
      }, this.DOUBLE_CLICK_DELAY);
    }
  }

  /**
   * Get parcel information from event target
   */
  private getParcelFromTarget(target: Container): ParcelInfo | null {
    // Walk up the display tree to find a parcel container
    let current = target;
    while (current) {
      if (current.name && current.name.startsWith('Parcel-')) {
        const parcel = this.parcelsMap.get(current.name);
        if (parcel) return parcel;
      }
      current = current.parent as Container;
    }
    return null;
  }

  /**
   * Find target container by parcel information
   */
  private findTargetByParcel(parcel: ParcelInfo): Container | null {
    const containerName = `Parcel-${parcel.number}`;

    // Search through parcel container children
    for (const child of this.parcelContainer.children) {
      if (child.name === containerName) {
        return child as Container;
      }
    }
    return null;
  }

  /**
   * Apply hover visual effects to a parcel
   */
  private applyHoverEffect(target: Container, isHovered: boolean): void {
    try {
      // Find border and label children
      const border = target.children.find(child => child.name?.includes('border') || child.constructor.name === 'Graphics');
      const label = target.children.find(child => child.name?.includes('label') || child.constructor.name === 'Text');

      if (border) {
        // Apply hover effect to border
        border.tint = isHovered ? 0xFFFF00 : 0xFFFFFF; // Yellow on hover
        border.alpha = isHovered ? 1.0 : 0.8;
      }

      if (label && 'style' in label) {
        // Apply hover effect to label with proper typing
        const textLabel = label as { style: { fill: number; fontWeight: string } };
        textLabel.style = {
          ...textLabel.style,
          fill: isHovered ? 0x000000 : 0xFFFFFF,
          fontWeight: isHovered ? 'bold' : 'normal'
        };
      }

      // Apply scale effect
      target.scale.set(isHovered ? 1.05 : 1.0);

      // Change cursor
      this.parcelContainer.cursor = isHovered ? 'pointer' : 'default';

    } catch (error) {
      console.warn('Error applying hover effect:', error);
    }
  }

  /**
   * Dispatch custom events to the window for external listeners
   */
  private dispatchCustomEvent(eventName: string, parcel: ParcelInfo): void {
    const customEvent = new CustomEvent(eventName, {
      detail: parcel,
      bubbles: true
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * Get currently hovered parcel
   */
  public getHoveredParcel(): ParcelInfo | null {
    return this.hoveredParcel;
  }

  /**
   * Force clear hover state
   */
  public clearHoverState(): void {
    if (this.hoveredParcel) {
      const target = this.findTargetByParcel(this.hoveredParcel);
      if (target) {
        this.applyHoverEffect(target, false);
      }
      this.hoveredParcel = null;
      this.callbacks.onParcelHover?.(null);
    }
  }

  /**
   * Destroy the event manager and clean up
   */
  public destroy(): void {
    // Clear any pending timeouts
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }

    // Remove event listeners
    this.parcelContainer.off('pointerover');
    this.parcelContainer.off('pointerout');
    this.parcelContainer.off('pointertap');
    this.parcelContainer.off('pointermove');

    // Clear data
    this.parcelsMap.clear();
    this.hoveredParcel = null;
    this.callbacks = {};
  }
}