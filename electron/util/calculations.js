import * as math from 'mathjs';

// Original trilateration function
export function trilaterationCalculations(r1, r2, r3) {
    // const [A1, A2, A3] = anchors; // Unpack anchor positions
    const [x1, y1] = [0, 0];
    const [x2, y2] = [7, 0]; // 3.22, 3.502
    const [x3, y3] = [5.5, 13.416]; // 5.876, 1.193

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
    const z1 = Math.sqrt(Math.max(0, zSquared)); // Above the plane
    const z2 = -z1; // Below the plane

    return { x, y, z1, z2 }; // Two possible solutions for z
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