import * as math from 'mathjs';

export function trilaterationCalculations(r1, r2, r3) {
    // const [A1, A2, A3] = anchors; // Unpack anchor positions
    const [x1, y1] = [0, 0];
    const [x2, y2] = [4.24, 2.59]; // 3.22, 3.502
    const [x3, y3] = [0, 5.664]; // 5.876, 1.193

    // Solve for x and y using two equations
    const A = 2 * (x2 - x1);
    const B = 2 * (y2 - y1);
    const D = 2 * (x3 - x1);
    const E = 2 * (y3 - y1);

    const C = r1 ** 2 - r2 ** 2 - x1 ** 2 - y1 ** 2 + x2 ** 2 + y2 ** 2;
    const F = r1 ** 2 - r3 ** 2 - x1 ** 2 - y1 ** 2 + x3 ** 2 + y3 ** 2;

    // Solve for x and y
    const y = (C * D - A * F) / (B * D - A * E);
    const x = (C - B * y) / A;

    // Solve for z
    const zSquared = r1 ** 2 - (x - x1) ** 2 - (y - y1) ** 2;
    // if (zSquared < 0) {
    //     return null; // No valid solution
    // }
    const z1 = Math.sqrt(zSquared); // Above the plane
    const z2 = -z1; // Below the plane

    return { x, y, z1, z2 }; // Two possible solutions for z
}

