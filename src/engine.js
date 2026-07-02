// --- Constants & Physics ---
export const HC = 12.3984193; // Planck's constant * speed of light in keV * Å
export const PRESETS = {
    'Si111': 3.1356,
    'Si220': 1.9201,
    'Si311': 1.6375,
    'Ge111': 3.2660
};

// --- Math & Geometry Utilities ---
export const norm = (v) => {
    const m = Math.hypot(v[0], v[1]);
    return m === 0 ? v : [v[0] / m, v[1] / m];
};
export const dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];
export const sub = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
export const add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];
export const mult = (v, s) => [v[0] * s, v[1] * s];
export const reflect = (dir, normal) => sub(dir, mult(normal, 2 * dot(dir, normal)));

// --- Core Classes ---
export class RectangleItem {
    constructor(x, y, w, h, base_angle = 0, color = '#ffffff', rot_center = null) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.base_angle = base_angle;
        this.angle = base_angle;
        this.color = color;
        this.rotation_center = rot_center;
    }

    getCorners() {
        let corners = [
            [this.x, this.y],
            [this.x + this.w, this.y],
            [this.x + this.w, this.y + this.h],
            [this.x, this.y + this.h]
        ];

        if (this.angle !== 0) {
            const theta = this.angle * Math.PI / 180;
            const cos_t = Math.cos(theta), sin_t = Math.sin(theta);
            const cx = this.rotation_center ? this.rotation_center[0] : this.x + this.w / 2;
            const cy = this.rotation_center ? this.rotation_center[1] : this.y + this.h / 2;

            corners = corners.map(p => {
                const dx = p[0] - cx, dy = p[1] - cy;
                return [
                    cos_t * dx - sin_t * dy + cx,
                    sin_t * dx + cos_t * dy + cy
                ];
            });
        }
        return corners;
    }

    getEdges() {
        const c = this.getCorners();
        return [[c[0], c[1]], [c[1], c[2]], [c[2], c[3]], [c[3], c[0]]];
    }

    applyGlobalRotation(thetaOffset) {
        this.angle = this.base_angle + thetaOffset;
    }
}

export class Ray {
    constructor(start, angle_mrad, color = '#00ffff') {
        this.start = start.slice();
        this.angle = angle_mrad / 1000; // Convert mrad to radians
        this.dir = norm([Math.cos(this.angle), Math.sin(this.angle)]);
        this.color = color;
        this.path = [this.start.slice()];
        // Tracks which RectangleItem was struck to reach path[i].
        // hitObjects[0] = null (starting point). hitObjects[i] = rect | null.
        this.hitObjects = [null];
    }

    cast(rectangles, max_bounces = 20) {
        let currentPoint = this.start.slice();
        let direction = this.dir.slice();

        for (let i = 0; i < max_bounces; i++) {
            const hit = this.findFirstHit(currentPoint, direction, rectangles);
            if (!hit.found) {
                this.path.push(add(currentPoint, mult(direction, 5000))); // far exit
                this.hitObjects.push(null); // free propagation, no rect
                break;
            }
            this.path.push(hit.point);
            this.hitObjects.push(hit.rect); // record which rect was struck
            direction = reflect(direction, hit.normal);
            currentPoint = hit.point;
        }
    }

    findFirstHit(origin, direction, rectangles) {
        let closest = null;
        let minDist = Infinity;
        let closestNormal = null;
        let closestRect = null;

        for (const rect of rectangles) {
            for (const [p1, p2] of rect.getEdges()) {
                const result = this.segmentIntersection(origin, direction, p1, p2);
                if (result && result.t < minDist) {
                    minDist = result.t;
                    closest = result.point;

                    const edgeDir = norm(sub(p2, p1));
                    let normal = [-edgeDir[1], edgeDir[0]];
                    
                    if (dot(normal, direction) > 0) normal = mult(normal, -1);
                    closestNormal = normal;
                    closestRect = rect; // track which rect
                }
            }
        }
        return closest
            ? { found: true, normal: closestNormal, point: closest, rect: closestRect }
            : { found: false };
    }

    segmentIntersection(origin, dir, p1, p2) {
        const v1 = sub(origin, p1);
        const v2 = sub(p2, p1);
        const v3 = [-dir[1], dir[0]];

        const denom = dot(v2, v3);
        if (Math.abs(denom) < 1e-6) return null;

        const t1 = (v2[0] * v1[1] - v2[1] * v1[0]) / denom;
        const t2 = dot(v1, v3) / denom;

        if (t2 >= 0 && t2 <= 1 && t1 > 1e-4) {
            return { point: add(origin, mult(dir, t1)), t: t1 };
        }
        return null;
    }

    // Returns the y-coordinate of the FIRST crossing of the ray path at xTarget.
    detectAtX(xTarget) {
        for (let i = 1; i < this.path.length; i++) {
            const [x1, y1] = this.path[i - 1];
            const [x2, y2] = this.path[i];
            
            if ((x1 - xTarget) * (x2 - xTarget) <= 0 && x1 !== x2) {
                const t = (xTarget - x1) / (x2 - x1);
                return y1 + t * (y2 - y1);
            }
        }
        return null;
    }

    // Returns ALL y-crossings at xTarget (for multi-pass / return beam detection).
    detectAllAtX(xTarget) {
        const results = [];
        for (let i = 1; i < this.path.length; i++) {
            const [x1, y1] = this.path[i - 1];
            const [x2, y2] = this.path[i];
            if ((x1 - xTarget) * (x2 - xTarget) <= 0 && x1 !== x2) {
                const t = (xTarget - x1) / (x2 - x1);
                results.push(y1 + t * (y2 - y1));
            }
        }
        return results;
    }
}
