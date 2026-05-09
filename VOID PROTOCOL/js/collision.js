/**
 * Collision System - AABB, Raycasting, Spatial Queries
 */

class CollisionSystem {
    constructor() {
        this.gridSize = 128;
        this.spatialGrid = new Map();
    }

    checkAll(game) {
        // Player vs enemies
        if(game.player && !game.player.dead) {
            for(const ent of game.entities) {
                if(ent.type === 'enemy' && !ent.dead) {
                    if(this.AABB(game.player, ent)) {
                        game.player.takeDamage(ent.contactDamage || 10, ent.x, ent.y);
                    }
                }
            }
        }
        
        // Projectiles vs entities & tiles
        for(const proj of game.projectiles) {
            let hit = false;
            
            // Check tiles
            const tiles = Game.level.getTilesInRect(proj.x - 10, proj.y - 10, 20, 20);
            for(const tile of tiles) {
                if(tile.solid && this.pointInRect(proj.x, proj.y, tile)) {
                    hit = true;
                    Game.particles.emit('spark', proj.x, proj.y, 5);
                    break;
                }
            }
            
            // Check entities
            if(!hit && proj.owner === 'player') {
                for(const ent of game.entities) {
                    if((ent.type === 'enemy' || ent.type === 'boss') && !ent.dead) {
                        if(this.AABB(proj, ent)) {
                            ent.takeDamage(proj.damage, proj.vx, proj.vy);
                            hit = true;
                            Game.particles.emit('blood', proj.x, proj.y, 8);
                            Game.game.triggerShake(2, 5);
                            break;
                        }
                    }
                }
            } else if(!hit && proj.owner === 'enemy') {
                if(game.player && this.AABB(proj, game.player)) {
                    game.player.takeDamage(proj.damage, proj.x, proj.y);
                    hit = true;
                }
            }
            
            if(hit) proj.markedForDeletion = true;
        }
        
        // Player vs level
        if(game.player) {
            this.resolveLevelCollision(game.player);
        }
        
        // Enemies vs level
        for(const ent of game.entities) {
            if(ent.physics) {
                this.resolveLevelCollision(ent);
            }
        }
    }

    AABB(a, b) {
        return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
               Math.abs(a.y - b.y) < (a.height + b.height) / 2;
    }

    pointInRect(px, py, rect) {
        return px >= rect.left && px <= rect.right &&
               py >= rect.top && py <= rect.bottom;
    }

    resolveLevelCollision(body) {
        const bounds = body.getBounds();
        const tiles = Game.level.getTilesInRect(bounds.left, bounds.top, body.width, body.height);
        
        for(const tile of tiles) {
            if(!tile.solid) continue;
            
            const tileBounds = {
                left: tile.x - tile.width / 2,
                right: tile.x + tile.width / 2,
                top: tile.y - tile.height / 2,
                bottom: tile.y + tile.height / 2
            };
            
            if(bounds.right > tileBounds.left && bounds.left < tileBounds.right &&
               bounds.bottom > tileBounds.top && bounds.top < tileBounds.bottom) {
                
                const overlapLeft = bounds.right - tileBounds.left;
                const overlapRight = tileBounds.right - bounds.left;
                const overlapTop = bounds.bottom - tileBounds.top;
                const overlapBottom = tileBounds.bottom - bounds.top;
                
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                if(minOverlap === overlapLeft) { body.x -= overlapLeft; body.vx = 0; }
                else if(minOverlap === overlapRight) { body.x += overlapRight; body.vx = 0; }
                else if(minOverlap === overlapTop) { 
                    body.y -= overlapTop; 
                    body.vy = 0; 
                    body.onGround = true; 
                }
                else { body.y += overlapBottom; body.vy = 0; }
                
                bounds.left = body.x - body.width / 2;
                bounds.right = body.x + body.width / 2;
                bounds.top = body.y - body.height / 2;
                bounds.bottom = body.y + body.height / 2;
            }
        }
    }

    raycast(x1, y1, x2, y2, exclude = null) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist / 8);
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        for(let i = 0; i <= steps; i++) {
            const rx = x1 + stepX * i;
            const ry = y1 + stepY * i;
            
            // Check tiles
            const tiles = Game.level.getTilesInRect(rx - 4, ry - 4, 8, 8);
            for(const tile of tiles) {
                if(tile.solid && this.pointInRect(rx, ry, tile)) {
                    return { hit: true, x: rx, y: ry, target: tile, type: 'tile' };
                }
            }
            
            // Check entities
            for(const ent of Game.game.entities) {
                if(ent === exclude) continue;
                if((ent.type === 'enemy' || ent.type === 'boss') && !ent.dead) {
                    if(this.pointInRect(rx, ry, ent.getBounds())) {
                        return { hit: true, x: rx, y: ry, target: ent, type: 'entity' };
                    }
                }
            }
        }
        
        return { hit: false, x: x2, y: y2 };
    }
}