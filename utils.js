const EPSILON = 0.00001;

// Smoothing kernel function
function k(s) {
    return max(0, pow(1 - s * s, 3));
}

// Density kernel function
function densitykernel(distance, h) {
    const density = 1 - pow(distance, 2) / pow(h, 2);
    return max(density, 0);
}

// Interpolate the zero crossing between two points.
function itrp(p0, p1, v0, v1) {
    if (v0 === 0) return p0;
    if (v1 === 0) return p1;
    if (abs(v1 - v0) < EPSILON) return p1;

    const mu = (0 - v0) / (v1 - v0);
    return createVector(
        p0.x + mu * (p1.x - p0.x),
        p0.y + mu * (p1.y - p0.y)
    );
}

// Calculate determinant of a 2x2 matrix.
function det(a, b, c, d) {
    return a * d - b * c;
}

// Calculate inverse of a 2x2 matrix.
function inv2x2(a, b, c, d) {
    const determinant = det(a, b, c, d);
    if (abs(determinant) < 1e-10) {
        console.warn("Matrix is not invertible");
        return null;
    }
    return [
        [d / determinant, -b / determinant],
        [-c / determinant, a / determinant]
    ];
}
