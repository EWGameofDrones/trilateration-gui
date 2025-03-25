import * as math from 'mathjs';

export function trilaterationCalculations(d1, d2, d3) {
    // Convert inputs to numbers if they're strings
    d1 = Number(d1);
    d2 = Number(d2);
    d3 = Number(d3);
    
    // Anchor positions
    const [x1, y1, z1] = [0, 0, 0];
    const [x2, y2, z2] = [3.78, 2.46, 1.27];
    const [x3, y3, z3] = [5.867, 1.193, 0];
    
    // Check for valid distance readings
    if (d1 <= 0 || d2 <= 0 || d3 <= 0 || 
        isNaN(d1) || isNaN(d2) || isNaN(d3)) {
        console.error("Invalid distance readings:", d1, d2, d3);
        return null;
    }
    
    try {
        // Use non-linear least squares approach
        // Construct system of equations
        const eqn1 = (x, y, z) => math.sqrt((x - x1)**2 + (y - y1)**2 + (z - z1)**2) - d1;
        const eqn2 = (x, y, z) => math.sqrt((x - x2)**2 + (y - y2)**2 + (z - z2)**2) - d2;
        const eqn3 = (x, y, z) => math.sqrt((x - x3)**2 + (y - y3)**2 + (z - z3)**2) - d3;
        
        // Initial guess - center of anchors
        let x = (x1 + x2 + x3) / 3;
        let y = (y1 + y2 + y3) / 3;
        let z = (z1 + z2 + z3) / 3;
        
        // Simple gradient descent (could use more sophisticated methods)
        const learningRate = 0.01;
        const iterations = 100;
        
        for (let i = 0; i < iterations; i++) {
            // Calculate current errors
            const e1 = eqn1(x, y, z);
            const e2 = eqn2(x, y, z);
            const e3 = eqn3(x, y, z);
            
            // Calculate total error
            const totalError = e1**2 + e2**2 + e3**2;
            
            // Break if error is small enough
            if (totalError < 0.01) break;
            
            // Calculate gradients (by finite difference)
            const delta = 0.001;
            
            // x gradients
            const dx1 = (eqn1(x + delta, y, z) - e1) / delta;
            const dx2 = (eqn2(x + delta, y, z) - e2) / delta;
            const dx3 = (eqn3(x + delta, y, z) - e3) / delta;
            
            // y gradients
            const dy1 = (eqn1(x, y + delta, z) - e1) / delta;
            const dy2 = (eqn2(x, y + delta, z) - e2) / delta;
            const dy3 = (eqn3(x, y + delta, z) - e3) / delta;
            
            // z gradients
            const dz1 = (eqn1(x, y, z + delta) - e1) / delta;
            const dz2 = (eqn2(x, y, z + delta) - e2) / delta;
            const dz3 = (eqn3(x, y, z + delta) - e3) / delta;
            
            // Total gradients
            const gradX = 2 * (e1 * dx1 + e2 * dx2 + e3 * dx3);
            const gradY = 2 * (e1 * dy1 + e2 * dy2 + e3 * dy3);
            const gradZ = 2 * (e1 * dz1 + e2 * dz2 + e3 * dz3);
            
            // Update position
            x -= learningRate * gradX;
            y -= learningRate * gradY;
            z -= learningRate * gradZ;
        }
        
        return { x, y, z };
    } catch (error) {
        console.error("Error in trilateration calculation:", error);
        return null;
    }
}
