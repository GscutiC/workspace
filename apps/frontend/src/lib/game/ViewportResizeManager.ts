/**
 * ViewportResizeManager - Maneja el redimensionamiento dinámico del viewport
 * cuando elementos de UI se muestran/ocultan
 */

import { GameEngine } from './GameEngine';

export interface ViewportDimensions {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  offsetX: number;
  offsetY: number;
}

export class ViewportResizeManager {
  private gameEngine: GameEngine;
  private containerElement: HTMLElement;
  private sidebarElement: HTMLElement | null = null;
  private currentDimensions: ViewportDimensions;
  private resizeObserver!: ResizeObserver;
  private mutationObserver!: MutationObserver;

  constructor(gameEngine: GameEngine, containerElement: HTMLElement) {
    this.gameEngine = gameEngine;
    this.containerElement = containerElement;
    this.currentDimensions = this.calculateDimensions();
    
    this.setupObservers();
    this.detectSidebarElement();
  }

  /**
   * Calcula las dimensiones disponibles para el viewport
   */
  private calculateDimensions(): ViewportDimensions {
    const containerRect = this.containerElement.getBoundingClientRect();
    const sidebar = this.detectSidebarElement();
    
    let availableWidth = containerRect.width;
    const availableHeight = containerRect.height;
    let offsetX = 0;
    const offsetY = 0;

    // Si hay sidebar visible, ajustar dimensiones
    if (sidebar && this.isSidebarVisible(sidebar)) {
      const sidebarRect = sidebar.getBoundingClientRect();
      availableWidth -= sidebarRect.width;
      offsetX = sidebarRect.width;
    }

    return {
      width: containerRect.width,
      height: containerRect.height,
      availableWidth,
      availableHeight,
      offsetX,
      offsetY
    };
  }

  /**
   * Detecta el elemento sidebar automáticamente
   */
  private detectSidebarElement(): HTMLElement | null {
    // Buscar por clases comunes de sidebar
    const selectors = [
      '[class*="sidebar"]',
      '[class*="side-panel"]', 
      '[class*="drawer"]',
      '[class*="menu-panel"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        this.sidebarElement = element;
        return element;
      }
    }

    return null;
  }

  /**
   * Verifica si el sidebar está visible
   */
  private isSidebarVisible(sidebar: HTMLElement): boolean {
    const styles = window.getComputedStyle(sidebar);
    return styles.display !== 'none' && 
           styles.visibility !== 'hidden' && 
           styles.opacity !== '0' &&
           sidebar.offsetWidth > 0;
  }

  /**
   * Configura los observadores para detectar cambios
   */
  private setupObservers(): void {
    // Observer para cambios de tamaño del contenedor
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.containerElement) {
          this.handleResize();
        }
      }
    });
    this.resizeObserver.observe(this.containerElement);

    // Observer para cambios en el DOM (sidebar show/hide)
    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || 
             mutation.attributeName === 'style')) {
          this.handleResize();
        }
      }
    });

    // Observar cambios en todo el documento
    this.mutationObserver.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class', 'style']
    });
  }

  /**
   * Maneja el redimensionamiento del viewport
   */
  private handleResize(): void {
    const newDimensions = this.calculateDimensions();
    
    // Solo redimensionar si hay cambios significativos
    if (this.hasSignificantChange(newDimensions)) {
      console.log('📏 Viewport resize detected:', {
        old: this.currentDimensions,
        new: newDimensions
      });

      this.currentDimensions = newDimensions;
      this.applyViewportResize();
    }
  }

  /**
   * Determina si el cambio es significativo
   */
  private hasSignificantChange(newDimensions: ViewportDimensions): boolean {
    const threshold = 10; // píxeles
    
    return Math.abs(newDimensions.availableWidth - this.currentDimensions.availableWidth) > threshold ||
           Math.abs(newDimensions.availableHeight - this.currentDimensions.availableHeight) > threshold ||
           Math.abs(newDimensions.offsetX - this.currentDimensions.offsetX) > threshold;
  }

  /**
   * Aplica el redimensionamiento al GameEngine
   */
  private applyViewportResize(): void {
    if (!this.gameEngine) return;

    // Redimensionar el canvas de Pixi.js
    const app = this.gameEngine.getApp();
    if (app) {
      app.renderer.resize(this.currentDimensions.availableWidth, this.currentDimensions.availableHeight);
      
      // Reposicionar el canvas
      const canvas = app.canvas;
      canvas.style.left = `${this.currentDimensions.offsetX}px`;
      canvas.style.top = `${this.currentDimensions.offsetY}px`;
    }

    // Actualizar configuración del viewport
    const viewport = this.gameEngine.getViewport();
    if (viewport) {
      viewport.setConfig({
        worldWidth: this.currentDimensions.availableWidth,
        worldHeight: this.currentDimensions.availableHeight
      });
      
      // Recentrar el mapa si es necesario
      viewport.centerOnMap();
    }

    console.log('✅ Viewport resized and recentered');
  }

  /**
   * Obtiene las dimensiones actuales
   */
  public getCurrentDimensions(): ViewportDimensions {
    return { ...this.currentDimensions };
  }

  /**
   * Fuerza un redimensionamiento manual
   */
  public forceResize(): void {
    this.handleResize();
  }

  /**
   * Limpia los observadores
   */
  public destroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }
}