import { Container, Text, Graphics } from 'pixi.js';
import { AVATAR_CONFIG, CHAT_CONFIG, TEXT_CONFIG } from '@/constants/game';

export interface ChatBubbleData {
  id: string;
  message: string;
  timestamp: number;
  duration: number;
}

/**
 * ChatBubbleSystem handles temporary chat messages that appear above avatars
 */
export class ChatBubbleSystem {
  private chatBubbles: Map<string, Container> = new Map();
  private bubbleTimers: Map<string, number> = new Map();

  /**
   * Create chat bubble for avatar
   */
  public createChatBubble(avatarId: string, message: string, duration: number = CHAT_CONFIG.bubbleLifetime): Container {
    // Remove existing bubble if any
    this.removeChatBubble(avatarId);

    const container = new Container();

    // Create text
    const chatText = new Text({
      text: this.truncateMessage(message),
      style: {
        fontFamily: TEXT_CONFIG.fontFamily,
        fontSize: TEXT_CONFIG.fontSize.small,
        fill: 0x000000,
        wordWrap: true,
        wordWrapWidth: 200,
        align: 'center',
      }
    });

    // Calculate bubble size
    const padding = 12;
    const bubbleWidth = Math.max(chatText.width + padding * 2, 60);
    const bubbleHeight = chatText.height + padding * 2;

    // Create bubble background
    const background = new Graphics();
    this.drawBubble(background, bubbleWidth, bubbleHeight);

    // Create speech tail
    const tail = new Graphics();
    this.drawSpeechTail(tail);

    // Position elements
    chatText.anchor.set(0.5, 0.5);
    chatText.x = 0;
    chatText.y = -bubbleHeight / 2;

    background.x = -bubbleWidth / 2;
    background.y = -bubbleHeight;

    tail.x = -5;
    tail.y = -10;

    // Add to container
    container.addChild(background);
    container.addChild(tail);
    container.addChild(chatText);

    // Position above avatar
    container.y = AVATAR_CONFIG.chatOffset.y;

    // Animation: fade in
    container.alpha = 0;
    this.animateFadeIn(container);

    // Store bubble and set timer
    this.chatBubbles.set(avatarId, container);
    this.bubbleTimers.set(avatarId, Date.now() + duration);

    return container;
  }

  /**
   * Update chat bubbles (handle timeouts and animations)
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();

    for (const [avatarId, expiryTime] of this.bubbleTimers) {
      if (currentTime >= expiryTime) {
        this.removeChatBubbleWithAnimation(avatarId);
      } else {
        // Add floating animation
        const container = this.chatBubbles.get(avatarId);
        if (container) {
          const time = currentTime * 0.003;
          const floatOffset = Math.sin(time) * 3;
          container.y = AVATAR_CONFIG.chatOffset.y + floatOffset;
        }
      }
    }
  }

  /**
   * Draw bubble background
   */
  private drawBubble(graphics: Graphics, width: number, height: number): void {
    graphics
      .roundRect(0, 0, width, height, 8)
      .fill(CHAT_CONFIG.bubbleStyle.backgroundColor)
      .stroke({ 
        color: CHAT_CONFIG.bubbleStyle.borderColor, 
        width: CHAT_CONFIG.bubbleStyle.borderWidth 
      });
  }

  /**
   * Draw speech bubble tail
   */
  private drawSpeechTail(graphics: Graphics): void {
    graphics
      .moveTo(0, 0)
      .lineTo(10, -10)
      .lineTo(20, 0)
      .closePath()
      .fill(CHAT_CONFIG.bubbleStyle.backgroundColor)
      .stroke({ 
        color: CHAT_CONFIG.bubbleStyle.borderColor, 
        width: CHAT_CONFIG.bubbleStyle.borderWidth 
      });
  }

  /**
   * Truncate message if too long
   */
  private truncateMessage(message: string): string {
    if (message.length <= CHAT_CONFIG.maxMessageLength) {
      return message;
    }
    return message.substring(0, CHAT_CONFIG.maxMessageLength - 3) + '...';
  }

  /**
   * Animate fade in
   */
  private animateFadeIn(container: Container): void {
    const startTime = Date.now();
    const duration = 300; // milliseconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out animation
      container.alpha = 1 - Math.pow(1 - progress, 3);
      container.scale.set(0.8 + progress * 0.2);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Animate fade out and remove
   */
  private animateFadeOut(container: Container, callback: () => void): void {
    const startTime = Date.now();
    const duration = 200; // milliseconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Fade out
      container.alpha = 1 - progress;
      container.scale.set(1 - progress * 0.2);

      if (progress >= 1) {
        callback();
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Remove chat bubble with animation
   */
  private removeChatBubbleWithAnimation(avatarId: string): void {
    const container = this.chatBubbles.get(avatarId);
    if (!container) return;

    this.animateFadeOut(container, () => {
      container.destroy();
      this.chatBubbles.delete(avatarId);
      this.bubbleTimers.delete(avatarId);
    });
  }

  /**
   * Remove chat bubble immediately
   */
  public removeChatBubble(avatarId: string): void {
    const container = this.chatBubbles.get(avatarId);
    if (container) {
      container.destroy();
      this.chatBubbles.delete(avatarId);
      this.bubbleTimers.delete(avatarId);
    }
  }

  /**
   * Update bubble position
   */
  public updateBubblePosition(avatarId: string, position: { x: number; y: number }): void {
    const container = this.chatBubbles.get(avatarId);
    if (container) {
      // Bubble follows avatar but with slight delay for natural feel
      const targetY = AVATAR_CONFIG.chatOffset.y;
      container.y += (targetY - container.y) * 0.1;
    }
  }

  /**
   * Set bubble visibility
   */
  public setBubbleVisibility(avatarId: string, visible: boolean): void {
    const container = this.chatBubbles.get(avatarId);
    if (container) {
      container.visible = visible;
    }
  }

  /**
   * Check if avatar has active chat bubble
   */
  public hasChatBubble(avatarId: string): boolean {
    return this.chatBubbles.has(avatarId);
  }

  /**
   * Get remaining time for chat bubble
   */
  public getRemainingTime(avatarId: string): number {
    const expiryTime = this.bubbleTimers.get(avatarId);
    if (!expiryTime) return 0;
    
    return Math.max(0, expiryTime - Date.now());
  }

  /**
   * Destroy all chat bubbles
   */
  public destroy(): void {
    this.chatBubbles.forEach(container => container.destroy());
    this.chatBubbles.clear();
    this.bubbleTimers.clear();
  }
}