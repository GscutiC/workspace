import Heap from 'heap';
import type { Position, PathNode } from '@/types/game';
import { TileType } from '@/types/game';
import type { TileMap } from '@/lib/game/TileMap';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/constants/game';

/**
 * A* Pathfinding Algorithm Implementation
 * Finds the shortest path between two points on a tile-based grid
 */
export class AStar {
  private tileMap: TileMap;
  private openSet: Heap<PathNode>;
  private closedSet: Set<string>;
  private openSetMap: Map<string, PathNode>; // For O(1) lookup in openSet

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap;
    this.openSet = new Heap<PathNode>((a, b) => a.f - b.f);
    this.closedSet = new Set();
    this.openSetMap = new Map();
  }

  /**
   * Find path from start to end position
   */
  public findPath(start: Position, end: Position): Position[] | null {
    // Convert world coordinates to tile coordinates
    const startTile = this.worldToTile(start);
    const endTile = this.worldToTile(end);

    // DEBUG: Add temporary logging
    console.log('🔍 AStar Debug:', {
      start,
      end,
      startTile,
      endTile,
      mapDimensions: { width: MAP_WIDTH, height: MAP_HEIGHT }
    });

    // Validate positions
    if (!this.isValidTile(startTile) || !this.isValidTile(endTile)) {
      console.log('❌ AStar: Invalid tiles detected', {
        startTile,
        endTile,
        startValid: this.isValidTile(startTile),
        endValid: this.isValidTile(endTile),
        mapConstants: { MAP_WIDTH, MAP_HEIGHT }
      });
      return null;
    }

    // Check walkability
    const startWalkable = this.isWalkable(startTile);
    const endWalkable = this.isWalkable(endTile);
    console.log('🚶 Walkability check:', {
      startWalkable,
      endWalkable
    });

    // If start and end are the same, return empty path
    if (startTile.x === endTile.x && startTile.y === endTile.y) {
      return [end];
    }

    // If end tile is not walkable, find nearest walkable tile
    const targetTile = endWalkable ? endTile : this.findNearestWalkableTile(endTile);
    if (!targetTile) {
      console.log('❌ AStar: No target tile found', {
        endTile,
        endWalkable,
        searchRadiusUsed: 'default',
        availableWalkableTiles: 'checking...'
      });
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

    console.log('🚀 Starting AStar with:', {
      startNode,
      targetTile,
      openSetSize: this.openSet.size()
    });

    let iterations = 0;
    const maxIterations = 200; // Reduced from 1000 - should be sufficient for most paths

    // Main pathfinding loop
    while (!this.openSet.empty() && iterations < maxIterations) {
      iterations++;
      const currentNode = this.openSet.pop()!;
      const currentKey = this.getNodeKey(currentNode);

      // Remove from openSetMap
      this.openSetMap.delete(currentKey);

      // Debug every 50 iterations (reduced frequency)
      if (iterations % 50 === 0 || iterations < 5) {
        console.log(`🔄 AStar iteration ${iterations}:`, {
          currentNode,
          openSetSize: this.openSet.size(),
          closedSetSize: this.closedSet.size
        });
      }

      // Add to closed set
      this.closedSet.add(currentKey);

      // Check if we reached the target
      if (currentNode.x === targetTile.x && currentNode.y === targetTile.y) {
        console.log('✅ AStar: Path found successfully!', {
          iterations,
          pathLength: 'calculating...',
          efficiency: `${iterations}/${maxIterations} iterations used`
        });
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

        // Check if this path is better using efficient map lookup
        const existingNode = this.openSetMap.get(neighborKey);
        if (existingNode) {
          if (tentativeG < existingNode.g) {
            existingNode.g = tentativeG;
            existingNode.f = existingNode.g + existingNode.h;
            existingNode.parent = currentNode;
            // Note: heap doesn't support efficient update, but this is still better
            this.openSet.updateItem(existingNode);
          }
        } else {
          neighbor.g = tentativeG;
          neighbor.h = this.calculateHeuristic(neighbor, targetTile);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;
          this.openSet.push(neighbor);
          this.openSetMap.set(neighborKey, neighbor); // Add to map for O(1) lookup
        }
      }
    }

    // No path found
    console.log('❌ AStar: No path found after exploring all possibilities', {
      startTile,
      targetTile,
      iterations,
      maxIterations,
      openSetSize: this.openSet.size(),
      closedSetSize: this.closedSet.size,
      efficiency: `${iterations}/${maxIterations} iterations used`
    });
    return null;
  }

  /**
   * Convert world coordinates to tile coordinates
   */
  private worldToTile(position: Position): Position {
    return {
      x: Math.floor(position.x / TILE_SIZE),
      y: Math.floor(position.y / TILE_SIZE),
    };
  }

  /**
   * Convert tile coordinates to world coordinates
   */
  private tileToWorld(tilePos: Position): Position {
    return {
      x: (tilePos.x + 0.5) * TILE_SIZE,
      y: (tilePos.y + 0.5) * TILE_SIZE,
    };
  }

  /**
   * Check if tile coordinates are valid
   */
  private isValidTile(tile: Position): boolean {
    return (
      tile.x >= 0 &&
      tile.x < MAP_WIDTH &&
      tile.y >= 0 &&
      tile.y < MAP_HEIGHT
    );
  }

  /**
   * Check if tile is walkable
   */
  private isWalkable(tile: Position): boolean {
    if (!this.isValidTile(tile)) {
      return false;
    }
    // Convert tile coordinates to world coordinates for TileMap.isWalkable()
    const worldPos = this.tileToWorld(tile);
    return this.tileMap.isWalkable(worldPos);
  }

  /**
   * Check if tile is a preferred walkable area (street/sidewalk)
   */
  private isPreferredWalkable(tile: Position): boolean {
    if (!this.isValidTile(tile)) {
      return false;
    }
    return this.tileMap.isWalkableArea(tile.x, tile.y);
  }

  /**
   * Get movement cost between two adjacent tiles with urban optimization
   */
  private getMovementCost(from: PathNode, to: PathNode): number {
    // Basic movement cost
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);

    // Diagonal movement costs more (√2 ≈ 1.414)
    let baseCost = 1;
    if (dx === 1 && dy === 1) {
      baseCost = 1.414;
    }

    // Apply preference modifier for tile type with urban optimization
    const tilePos = { x: to.x, y: to.y };
    
    // Check if this is a main avenue for better routing
    if (this.isMainAvenue(to.x, to.y)) {
      return baseCost * 0.7; // Prefer main avenues for efficiency
    }
    
    // Use existing walkable checks
    if (this.isPreferredWalkable(tilePos)) {
      return baseCost; // Normal cost for streets/sidewalks
    } else if (this.isWalkable(tilePos)) {
      return baseCost * 2.5; // Higher cost for parks (still allowed but slower)
    }

    return Infinity; // Cannot walk here
  }

  /**
   * Check if a position is on a main avenue (for optimal routing)
   */
  private isMainAvenue(x: number, y: number): boolean {
    const AVENUE_SPACING = 25;
    const MAIN_STREET_WIDTH = 3;
    
    // Check if on horizontal main avenue
    for (let avY = AVENUE_SPACING; avY < 150; avY += AVENUE_SPACING) {
      if (y >= avY && y < avY + MAIN_STREET_WIDTH) {
        return true;
      }
    }
    
    // Check if on vertical main avenue
    for (let avX = AVENUE_SPACING; avX < 200; avX += AVENUE_SPACING) {
      if (x >= avX && x < avX + MAIN_STREET_WIDTH) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Find nearest walkable tile to target
   */
  private findNearestWalkableTile(target: Position): Position | null {
    const maxRadius = 10;
    console.log('🔍 AStar: Searching for nearest walkable tile', {
      target,
      maxRadius
    });

    for (let radius = 1; radius <= maxRadius; radius++) {
      let candidatesChecked = 0;
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
          candidatesChecked++;

          if (this.isWalkable(candidate)) {
            console.log('✅ AStar: Found walkable tile', {
              candidate,
              radius,
              candidatesChecked
            });
            return candidate;
          }
        }
      }
      console.log(`🔍 AStar: Radius ${radius} complete, checked ${candidatesChecked} candidates`);
    }

    console.log('❌ AStar: No walkable tile found within max radius', {
      target,
      maxRadius
    });
    return null;
  }

  /**
   * Calculate heuristic distance (Manhattan distance)
   */
  private calculateHeuristic(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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
   * Reset pathfinding state
   */
  private reset(): void {
    this.openSet = new Heap<PathNode>((a, b) => a.f - b.f);
    this.closedSet.clear();
    this.openSetMap.clear();
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