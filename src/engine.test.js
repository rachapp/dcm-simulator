import { describe, it, expect } from 'vitest';
import { norm, dot, sub, add, mult, reflect, RectangleItem, Ray, HC, PRESETS } from './engine';

describe('Math Utilities', () => {
    it('should normalize a vector', () => {
        const v = [3, 4];
        const n = norm(v);
        expect(n[0]).toBeCloseTo(0.6);
        expect(n[1]).toBeCloseTo(0.8);
    });

    it('should calculate dot product', () => {
        expect(dot([1, 2], [3, 4])).toBe(11);
    });

    it('should reflect a vector', () => {
        const dir = [1, -1];
        const normal = [0, 1];
        const r = reflect(dir, normal);
        expect(r[0]).toBeCloseTo(1);
        expect(r[1]).toBeCloseTo(1);
    });
});

describe('RectangleItem', () => {
    it('should return 4 corners', () => {
        const rect = new RectangleItem(0, 0, 10, 10);
        const corners = rect.getCorners();
        expect(corners).toHaveLength(4);
        expect(corners[0]).toEqual([0, 0]);
        expect(corners[2]).toEqual([10, 10]);
    });

    it('should rotate corners', () => {
        const rect = new RectangleItem(0, 0, 10, 10, 90, '#fff', [0, 0]);
        const corners = rect.getCorners();
        // 90 deg rotation around (0,0): (x,y) -> (-y, x)
        // (10, 0) -> (0, 10)
        expect(corners[1][0]).toBeCloseTo(0);
        expect(corners[1][1]).toBeCloseTo(10);
    });
});

describe('Ray Tracing', () => {
    it('should intersect with a horizontal rectangle', () => {
        const rect = new RectangleItem(0, 10, 100, 10);
        const ray = new Ray([50, 0], 1570.8); // ~90 deg up (pi/2 * 1000)
        ray.cast([rect]);
        expect(ray.path).toHaveLength(3); // start, hit, far exit
        expect(ray.path[1][0]).toBeCloseTo(50);
        expect(ray.path[1][1]).toBeCloseTo(10);
    });

    it('should detect at X', () => {
        const ray = new Ray([0, 0], 0);
        ray.path = [[0, 0], [10, 10]];
        expect(ray.detectAtX(5)).toBeCloseTo(5);
    });
});

describe('Physics Constants', () => {
    it('should have correct HC constant', () => {
        expect(HC).toBeCloseTo(12.3984, 4);
    });

    it('should have Si111 preset', () => {
        expect(PRESETS['Si111']).toBe(3.1356);
    });
});
