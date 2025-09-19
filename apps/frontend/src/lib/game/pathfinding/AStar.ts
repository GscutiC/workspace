import Heap from 'heap';
import type { Position, PathNode, TileMap } from '@/types/game';

/**
 * A* Pathfinding Algorithm Implementation
 * Finds the shortest path between two points on a tile-based grid
 */
export class AStar {
  private tileMap: TileMap;
  private openSet: Heap<PathNode>;
  private closedSet: Set<string>;

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap;
    this.openSet = new Heap<PathNode>((a, b) => a.f - b.f);
    this.closedSet = new Set();
  }

  /**
   * Find path from start to end position
   */
  public findPath(start: Position, end: Position): Position[] | null {
    // Convert world coordinates to tile coordinates
    const startTile = this.worldToTile(start);
    const endTile = this.worldToTile(end);

    // Validate positions
    if (!this.isValidTile(startTile) || !this.isValidTile(endTile)) {
      return null;
    }

    // If start and end are the same, return empty path
    if (startTile.x === endTile.x && startTile.y === endTile.y) {
      return [end];
    }

    // If end tile is not walkable, find nearest walkable tile
    const targetTile = this.isWalkable(endTile) ? endTile : this.findNearestWalkableTile(endTile);
    if (!targetTile) {
      return null;
    }

    // Initialize pathfinding
    this.reset();

    const startNode: PathNode = {
      x: startTile.x,
      y: startTile.y,
      g: 0,
      h: this.calculateHeuristic(startTile, targetTile),
      f: 0,
    };
    startNode.f = startNode.g + startNode.h;

    this.openSet.push(startNode);

    // Main pathfinding loop
    while (!this.openSet.empty()) {
      const currentNode = this.openSet.pop()!;
      const currentKey = this.getNodeKey(currentNode);

      // Add to closed set
      this.closedSet.add(currentKey);

      // Check if we reached the target
      if (currentNode.x === targetTile.x && currentNode.y === targetTile.y) {
        return this.reconstructPath(currentNode);
      }

      // Explore neighbors
      const neighbors = this.getNeighbors(currentNode);
      for (const neighbor of neighbors) {
        const neighborKey = this.getNodeKey(neighbor);

        // Skip if in closed set
        if (this.closedSet.has(neighborKey)) {
          continue;
        }

        // Calculate tentative g score
        const tentativeG = currentNode.g + this.getMovementCost(currentNode, neighbor);

        // Check if this path is better
        const existingNode = this.findNodeInOpenSet(neighbor);
        if (existingNode) {
          if (tentativeG < existingNode.g) {
            existingNode.g = tentativeG;
            existingNode.f = existingNode.g + existingNode.h;
            existingNode.parent = currentNode;
            this.openSet.updateItem(existingNode);
          }
        } else {
          neighbor.g = tentativeG;
          neighbor.h = this.calculateHeuristic(neighbor, targetTile);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;
          this.openSet.push(neighbor);
        }
      }
    }

    // No path found
    return null;
  }

  /**
   * Convert world coordinates to tile coordinates
   */
  private worldToTile(position: Position): Position {
    return {
      x: Math.floor(position.x / this.tileMap.tileSize),
      y: Math.floor(position.y / this.tileMap.tileSize),
    };
  }

  /**
   * Convert tile coordinates to world coordinates
   */
  private tileToWorld(tilePos: Position): Position {
    return {
      x: (tilePos.x + 0.5) * this.tileMap.tileSize,
      y: (tilePos.y + 0.5) * this.tileMap.tileSize,
    };
  }

  /**
   * Check if tile coordinates are valid
   */
  private isValidTile(tile: Position): boolean {
    return (
      tile.x >= 0 &&
      tile.x < this.tileMap.width &&
      tile.y >= 0 &&
      tile.y < this.tileMap.height
    );
  }

  /**
   * Check if tile is walkable
   */
  private isWalkable(tile: Position): boolean {
    if (!this.isValidTile(tile)) {
      return false;
    }
    return !this.tileMap.collisionMap[tile.y][tile.x];
  }

  /**
   * Find nearest walkable tile to target
   */
  private findNearestWalkableTile(target: Position): Position | null {
    const maxRadius = 10;

    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check perimeter of current radius
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
            continue;
          }

          const candidate = {
            x: target.x + dx,
            y: target.y + dy,
          };

          if (this.isWalkable(candidate)) {
            return candidate;
          }
        }
      }
    }

    return null;
  }

  /**
   * Calculate heuristic distance (Manhattan distance)
   */
  private calculateHeuristic(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Get movement cost between two adjacent tiles
   */
  private getMovementCost(from: PathNode, to: PathNode): number {
    // Basic movement cost is 1 for orthogonal movement
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    // Diagonal movement costs more (√2 ≈ 1.414)
    if (dx === 1 && dy === 1) {
      return 1.414;
    }

    return 1;
  }

  /**
   * Get valid neighbors for a node
   */
  private getNeighbors(node: PathNode): PathNode[] {
    const neighbors: PathNode[] = [];
    const directions = [
      { x: -1, y: 0 },  // Left
      { x: 1, y: 0 },   // Right
      { x: 0, y: -1 },  // Up
      { x: 0, y: 1 },   // Down
      { x: -1, y: -1 }, // Up-Left
      { x: 1, y: -1 },  // Up-Right
      { x: -1, y: 1 },  // Down-Left
      { x: 1, y: 1 },   // Down-Right
    ];

    for (const dir of directions) {
      const neighborPos = {
        x: node.x + dir.x,
        y: node.y + dir.y,
      };

      // Check if neighbor is walkable
      if (this.isWalkable(neighborPos)) {
        // For diagonal movement, check if both adjacent tiles are walkable
        if (Math.abs(dir.x) === 1 && Math.abs(dir.y) === 1) {
          const horizontalNeighbor = { x: node.x + dir.x, y: node.y };
          const verticalNeighbor = { x: node.x, y: node.y + dir.y };

          if (!this.isWalkable(horizontalNeighbor) || !this.isWalkable(verticalNeighbor)) {
            continue; // Skip diagonal if adjacent tiles are blocked
          }
        }

        neighbors.push({
          x: neighborPos.x,
          y: neighborPos.y,
          g: 0,
          h: 0,
          f: 0,
        });
      }
    }

    return neighbors;
  }

  /**
   * Reconstruct path from end node to start
   */
  private reconstructPath(endNode: PathNode): Position[] {
    const path: Position[] = [];
    let currentNode: PathNode | undefined = endNode;

    while (currentNode) {
      // Convert tile coordinates back to world coordinates
      const worldPos = this.tileToWorld(currentNode);
      path.unshift(worldPos);
      currentNode = currentNode.parent;
    }

    return path;
  }

  /**
   * Generate unique key for a node
   */
  private getNodeKey(node: PathNode): string {
    return `${node.x},${node.y}`;
  }

  /**
   * Find node in open set
   */
  private findNodeInOpenSet(target: PathNode): PathNode | null {
    const targetKey = this.getNodeKey(target);

    // Note: This is not optimal, but heap library doesn't provide easy search
    // In a production environment, you might want to maintain a separate map
    const nodes = this.openSet.toArray();
    return nodes.find(node => this.getNodeKey(node) === targetKey) || null;
  }

  /**
   * Reset pathfinding state
   */
  private reset(): void {
    this.openSet = new Heap<PathNode>((a, b) => a.f - b.f);
    this.closedSet.clear();
  }

  /**
   * Smooth path by removing unnecessary waypoints
   */
  public smoothPath(path: Position[]): Position[] {
    if (path.length <= 2) {
      return path;
    }

    const smoothed: Position[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let farthest = current + 1;

      // Find the farthest point we can see from current
      for (let i = current + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[current], path[i])) {
          farthest = i;
        } else {
          break;
        }
      }

      smoothed.push(path[farthest]);
      current = farthest;
    }

    return smoothed;
  }

  /**
   * Check if there's a clear line of sight between two points
   */
  private hasLineOfSight(start: Position, end: Position): boolean {
    const startTile = this.worldToTile(start);
    const endTile = this.worldToTile(end);

    // Bresenham's line algorithm
    const dx = Math.abs(endTile.x - startTile.x);
    const dy = Math.abs(endTile.y - startTile.y);
    const sx = startTile.x < endTile.x ? 1 : -1;
    const sy = startTile.y < endTile.y ? 1 : -1;
    let err = dx - dy;

    let x = startTile.x;
    let y = startTile.y;

    while (true) {
      // Check if current tile is walkable
      if (!this.isWalkable({ x, y })) {
        return false;
      }

      // Check if we reached the end
      if (x === endTile.x && y === endTile.y) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return true;
  }
}