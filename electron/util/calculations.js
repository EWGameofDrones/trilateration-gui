import * as math from 'mathjs';

// Updated trilateration function with consistent z1/z2 return values
export function trilaterationCalculations(r1, r2, r3, anchors) {
    // console.log("Trilateration calculations with distances:", r1, r2, r3);
    // console.log("Using anchors:", anchors);
    const [[x1, y1, z1], [x2, y2, z2], [x3, y3, z3]] = anchors
    
    // Calculate coefficients
    const A = 2 * (x2 - x1);
    const B = 2 * (y2 - y1);
    const C = 2 * (z2 - z1);
    const D = 2 * (x3 - x1);
    const E = 2 * (y3 - y1);
    const F = 2 * (z3 - z1);
    
    const G = 0.5 * (r1 * r1 - r2 * r2 - x1 * x1 - y1 * y1 - z1 * z1 + x2 * x2 + y2 * y2 + z2 * z2);
    const H = 0.5 * (r1 * r1 - r3 * r3 - x1 * x1 - y1 * y1 - z1 * z1 + x3 * x3 + y3 * y3 + z3 * z3);
    
    // If all anchors are in a plane (z coordinates are the same), use the simpler 2D approach
    if (Math.abs(C) < 1e-10 && Math.abs(F) < 1e-10) {
        console.log("Using 2D trilateration due to coplanar anchors");
        // This is the existing 2D case
        const y = (G * D - A * H) / (B * D - A * E);
        const x = (G - B * y) / A;
        
        // Calculate z from the first sphere equation
        const zSquared = r1 * r1 - (x - x1) * (x - x1) - (y - y1) * (y - y1);
        
        if (zSquared < 0) {
            console.log("Warning: Negative z-squared in 2D case:", zSquared);
            // Return both z values as 0 in case of error
            return { x, y, z1: 0, z2: 0 };
        }
        
        const z1 = Math.sqrt(zSquared); // Above the plane
        const z2 = -Math.sqrt(zSquared); // Below the plane
        
        return { x, y, z1, z2 };
    } else {
        // 3D case implementation stays mostly the same
        try {
            // Solve 2x2 system for x and y with z=0 constraint
            const det = A * E - B * D;
            if (Math.abs(det) < 1e-10) {
                throw new Error("Anchors are collinear, cannot determine position uniquely");
            }
            
            const xTemp = (G * E - B * H) / det;
            const yTemp = (A * H - G * D) / det;
            
            // Use the first sphere equation to find z
            const zSquared = r1 * r1 - (xTemp - x1) * (xTemp - x1) - (yTemp - y1) * (yTemp - y1);
            
            if (zSquared < 0) {
                console.log("Warning: Negative z-squared:", zSquared);
                // Return approximate position with z values as 0
                return { x: xTemp, y: yTemp, z1: 0, z2: 0 };
            }
            
            const z1 = Math.sqrt(zSquared);
            const z2 = -Math.sqrt(zSquared);
            
            return { x: xTemp, y: yTemp, z1, z2 };
        } catch (e) {
            console.error("Error in 3D trilateration:", e);
            return null;
        }
    }
}

/**
 * Performs 3D multilateration using 4 anchors and their distances
 * @param {number} r1 - Distance from first anchor
 * @param {number} r2 - Distance from second anchor
 * @param {number} r3 - Distance from third anchor
 * @param {number} r4 - Distance from fourth anchor
 * @param {Array} anchors - Array of 4 anchor positions, each [x,y,z]
 * @returns {Object} Position with x, y, z1, z2 values
 */
export function multilaterationCalculations(r1, r2, r3, r4, anchors) {
    // console.log("Multilateration calculations with distances:", r1, r2, r3, r4);
    // console.log("Using anchors:", anchors);
    
    // Try different combinations of three anchors and average the results
    // This is more robust against measurement errors
    const combinations = [
        [0, 1, 2], // First three anchors
        [0, 1, 3], // First, second, and fourth
        [0, 2, 3], // First, third, and fourth
        [1, 2, 3]  // Second, third, and fourth
    ];
    
    const validResults = [];
    const distances = [r1, r2, r3, r4];
    
    for (const [i, j, k] of combinations) {
        const result = trilaterationCalculations(
            distances[i], 
            distances[j], 
            distances[k], 
            [anchors[i], anchors[j], anchors[k]]
        );
        
        if (result) {
            // Choose the z value that makes more sense for your setup
            // Typically positive if anchors are above the tracking area
            const z = result.z1 >= 0 ? result.z1 : result.z2;
            validResults.push({ x: result.x, y: result.y, z });
        }
    }
    
    // console.log("Valid trilateration results:", validResults);
    // If we have valid results, average them
    if (validResults.length > 0) {
        let sumX = 0, sumY = 0, sumZ = 0;
        
        for (const result of validResults) {
            sumX += result.x;
            sumY += result.y;
            sumZ += result.z;
        }
        
        const avgX = sumX / validResults.length;
        const avgY = sumY / validResults.length;
        const avgZ = sumZ / validResults.length;
        
        return { x: avgX, y: avgY, z1: avgZ, z2: avgZ };
    }
    
    // Fallback to standard trilateration with first three anchors
    return trilaterationCalculations(r1, r2, r3, [anchors[0], anchors[1], anchors[2]]);
}

export function trueMultilaterationMathjs(r1, r2, r3, r4, anchors) {
    const distances = [r1, r2, r3, r4];
    console.log("Using anchors:", anchors); // Keep for debugging if needed
    console.log("True multilateration with distances:", distances); // Keep for debugging

    const A = [];
    const b = [];
    const [x1, y1, z1] = anchors[0];

    for (let i = 1; i < anchors.length; i++) {
        const [xi, yi, zi] = anchors[i];
        A.push([
            2 * (x1 - xi),
            2 * (y1 - yi),
            2 * (z1 - zi)
        ]);
        b.push([
            distances[i] ** 2 - distances[0] ** 2 -
            (xi ** 2 + yi ** 2 + zi ** 2) + (x1 ** 2 + y1 ** 2 + z1 ** 2)
        ]);
    }

    try {
        const solution = math.lusolve(math.matrix(A), math.matrix(b));
        const positionArray = solution.toArray();

        const x_sol = positionArray[0][0];
        const y_sol = positionArray[1][0];
        const z_sol = positionArray[2][0];

        // --- START VALIDATION ---
        if (isNaN(x_sol) || isNaN(y_sol) || isNaN(z_sol) ||
            !isFinite(x_sol) || !isFinite(y_sol) || !isFinite(z_sol)) {
            console.error("Error in multilateration: Solution contains NaN or Infinity.");
            return multilaterationCalculations(r1, r2, r3, r4, anchors);
        }

        // Define plausible bounds (adjust these as needed for your setup)
        // Example: Z should be within a certain range of anchor heights
        const anchorZValues = anchors.map(a => a[2]);
        const minAnchorZ = Math.min(...anchorZValues);
        const maxAnchorZ = Math.max(...anchorZValues);
        const maxDistance = Math.max(...distances); // Use max observed distance as a margin

        // Define plausible Z range, e.g., min anchor Z - max_distance to max anchor Z + max_distance
        // Or a fixed reasonable margin, e.g., 20-30 feet if distances are in feet.
        const plausibleZMin = minAnchorZ - (maxDistance > 0 ? maxDistance : 20); // Ensure maxDistance is positive
        const plausibleZMax = maxAnchorZ + (maxDistance > 0 ? maxDistance : 20);


        // More generous bounds for X and Y as an example
        const anchorXValues = anchors.map(a => a[0]);
        const minAnchorX = Math.min(...anchorXValues);
        const maxAnchorX = Math.max(...anchorXValues);
        const plausibleXMin = minAnchorX - (maxDistance > 0 ? maxDistance : 50);
        const plausibleXMax = maxAnchorX + (maxDistance > 0 ? maxDistance : 50);

        const anchorYValues = anchors.map(a => a[1]);
        const minAnchorY = Math.min(...anchorYValues);
        const maxAnchorY = Math.max(...anchorYValues);
        const plausibleYMin = minAnchorY - (maxDistance > 0 ? maxDistance : 50);
        const plausibleYMax = maxAnchorY + (maxDistance > 0 ? maxDistance : 50);


        if (z_sol < plausibleZMin || z_sol > plausibleZMax ||
            x_sol < plausibleXMin || x_sol > plausibleXMax ||
            y_sol < plausibleYMin || y_sol > plausibleYMax) {
            console.warn(`Warning: Multilateration solution (${x_sol.toFixed(2)}, ${y_sol.toFixed(2)}, ${z_sol.toFixed(2)}) is outside plausible bounds. Falling back.`);
            console.warn(`Plausible Z: [${plausibleZMin.toFixed(2)}, ${plausibleZMax.toFixed(2)}]`);
            console.warn(`Plausible X: [${plausibleXMin.toFixed(2)}, ${plausibleXMax.toFixed(2)}]`);
            console.warn(`Plausible Y: [${plausibleYMin.toFixed(2)}, ${plausibleYMax.toFixed(2)}]`);
            return multilaterationCalculations(r1, r2, r3, r4, anchors);
        }
        // --- END VALIDATION ---

        return {
            x: x_sol,
            y: y_sol,
            z1: z_sol,
            z2: z_sol // Linearized method gives one Z
        };
    } catch (e) {
        console.error("Error in multilateration (math.lusolve likely failed):", e.message);
        return multilaterationCalculations(r1, r2, r3, r4, anchors);
    }
}

export function trueMultilaterationNLS(r1, r2, r3, r4, anchors) {
    const distances = [r1, r2, r3, r4];
    
    // Initial guess (average of anchor positions)
    let guess = [0, 0, 0];
    anchors.forEach(anchor => {
        guess[0] += anchor[0] / anchors.length;
        guess[1] += anchor[1] / anchors.length;
        guess[2] += anchor[2] / anchors.length;
    });
    
    // Objective function: sum of squared errors between measured and calculated distances
    function calculateError(position) {
        let sumSquaredErrors = 0;
        for (let i = 0; i < anchors.length; i++) {
            const measuredDistance = distances[i];
            const calculatedDistance = Math.sqrt(
                Math.pow(position[0] - anchors[i][0], 2) +
                Math.pow(position[1] - anchors[i][1], 2) +
                Math.pow(position[2] - anchors[i][2], 2)
            );
            sumSquaredErrors += Math.pow(measuredDistance - calculatedDistance, 2);
        }
        return sumSquaredErrors;
    }
    
    // Perform gradient descent optimization
    const maxIterations = 100;
    const learningRate = 0.1;
    const convergenceThreshold = 0.0001;
    let currentPosition = [...guess];
    let prevError = Infinity;
    
    for (let iter = 0; iter < maxIterations; iter++) {
        // Calculate gradient numerically
        const gradient = [0, 0, 0];
        const h = 0.0001; // Small step for numerical differentiation
        const baseError = calculateError(currentPosition);
        
        for (let dim = 0; dim < 3; dim++) {
            const step = [...currentPosition];
            step[dim] += h;
            gradient[dim] = (calculateError(step) - baseError) / h;
        }
        
        // Update position (gradient descent step)
        for (let dim = 0; dim < 3; dim++) {
            currentPosition[dim] -= learningRate * gradient[dim];
        }
        
        // Check for convergence
        const currentError = calculateError(currentPosition);
        if (Math.abs(currentError - prevError) < convergenceThreshold) break;
        prevError = currentError;
    }
    
    return {
        x: currentPosition[0],
        y: currentPosition[1],
        z1: currentPosition[2],
        z2: currentPosition[2]
    };
}

// Kalman filter state
const kalmanState = {
    // State vector [x, y, vx, vy]
    x: math.matrix([0, 0, 0, 0]),
    // State covariance matrix
    P: math.diag([100, 100, 10, 10]),
    // Process noise (adjust these to tune filter)
    Q: math.diag([0.0001, 0.0001, 0.01, 0.01]),
    // Measurement noise (adjust these to tune filter)
    R: math.diag([10, 10]),
    // Measurement matrix (we only measure position)
    H: math.matrix([[1, 0, 0, 0], [0, 1, 0, 0]]),
    // Time of last update
    lastTime: null,
    // First measurement flag
    initialized: false
};

/**
 * Predicts the next state using the Kalman filter model
 * @param {number} dt - Time delta in seconds
 */
function kalmanPredict(dt) {
    // Create state transition matrix with current dt
    const F = math.matrix([
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);
    
    // Predict state: x = F * x
    kalmanState.x = math.multiply(F, kalmanState.x);
    
    // Predict covariance: P = F * P * F' + Q
    const FP = math.multiply(F, kalmanState.P);
    kalmanState.P = math.add(
        math.multiply(FP, math.transpose(F)),
        kalmanState.Q
    );
}

/**
 * Updates the Kalman filter with a new measurement
 * @param {Object} measurement - The {x, y} measurement
 */
function kalmanUpdate(measurement) {
    // Convert measurement to matrix
    const z = math.matrix([measurement.x, measurement.y]);
    
    // Calculate innovation: y = z - H * x
    const Hx = math.multiply(kalmanState.H, kalmanState.x);
    const y = math.subtract(z, Hx);
    
    // Calculate innovation covariance: S = H * P * H' + R
    const HP = math.multiply(kalmanState.H, kalmanState.P);
    const S = math.add(
        math.multiply(HP, math.transpose(kalmanState.H)),
        kalmanState.R
    );
    
    // Calculate Kalman gain: K = P * H' * inv(S)
    const PHt = math.multiply(kalmanState.P, math.transpose(kalmanState.H));
    const K = math.multiply(PHt, math.inv(S));
    
    // Update state: x = x + K * y
    kalmanState.x = math.add(kalmanState.x, math.multiply(K, y));
    
    // Update covariance: P = (I - K * H) * P
    const I = math.identity(4);
    const KH = math.multiply(K, kalmanState.H);
    const IminusKH = math.subtract(I, KH);
    kalmanState.P = math.multiply(IminusKH, kalmanState.P);
}

const smoothedPositions = {};

/**
 * Apply Exponential Moving Average filter to position data
 * @param {Object} triArr - The trilateration result with x, y coordinates
 * @param {number} id - The ID of the drone/responder
 * @param {number} alpha - Smoothing factor (lower = more smoothing)
 * @returns {Object} Smoothed position
 */
export function EMA(triArr, id, alpha = 0.2) {
    // Create object if it doesn't exist for this ID
    if (!smoothedPositions[id]) {
        smoothedPositions[id] = {
            x: triArr.x,
            y: triArr.y,
            z1: triArr.z1,
            z2: triArr.z2,
        };
    }

    // Apply EMA formula
    smoothedPositions[id].x = alpha * triArr.x + (1 - alpha) * smoothedPositions[id].x;
    smoothedPositions[id].y = alpha * triArr.y + (1 - alpha) * smoothedPositions[id].y;
    
    // If z values exist in the input, smooth them too
    if (triArr.z1 !== undefined) {
        smoothedPositions[id].z1 = alpha * triArr.z1 + (1 - alpha) * smoothedPositions[id].z1;
        smoothedPositions[id].z2 = alpha * triArr.z2 + (1 - alpha) * smoothedPositions[id].z2;
    }
    
    // Return a copy of the smoothed position with the ID
    return {
        x: smoothedPositions[id].x,
        y: smoothedPositions[id].y,
        z1: smoothedPositions[id].z1,
        z2: smoothedPositions[id].z2,
        id: id
    };
}
/**
 * Process a new trilateration result through the Kalman filter
 * @param {Object} trilaterationResult - Result from trilaterationCalculations
 * @returns {Object} Filtered position {x, y}
 */
export function kalmanFilterPosition(trilaterationResult) {
    const currentTime = Date.now();
    
    // If this is our first measurement, initialize the filter
    if (!kalmanState.initialized) {
        kalmanState.x = math.matrix([
            trilaterationResult.x, 
            trilaterationResult.y, 
            0, 
            0
        ]);
        kalmanState.lastTime = currentTime;
        kalmanState.initialized = true;
        return { x: trilaterationResult.x, y: trilaterationResult.y };
    }
    
    // Calculate time delta in seconds
    const dt = (currentTime - kalmanState.lastTime) / 1000;
    kalmanState.lastTime = currentTime;
    
    // Sanity check - if dt is very large (e.g., after pause), reset dt to avoid instability
    const safeDt = dt > 1.0 ? 0.1 : dt;
    
    // Predict step
    kalmanPredict(safeDt);
    
    // Update step
    kalmanUpdate(trilaterationResult);
    
    // Extract the position from state
    const stateArray = kalmanState.x.toArray();
    return {
        x: stateArray[0],
        y: stateArray[1],
        vx: stateArray[2],
        vy: stateArray[3]
    };
}