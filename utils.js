const EPSILON = 0.00001;

// =======================================================
// SPH 커널 및 보간 함수 / SPH Kernels & Interpolation
// =======================================================

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

// 커널 그라디언트 / Kernel gradient
function kGrad(dist, relativePos, R) {
    let coeff = 3.0 / (4.0 * PI * pow(R / 2, 4));
    let q = dist / (R / 2);
    let grad = createVector(relativePos.x, relativePos.y);
    let w1 = (1.0 - q) * (1.0 - q);
    let w2 = (2.0 - q) * (2.0 - q);

    if (dist <= 0.0) {
        grad.set(0, 0);
    } else if (q < 1.0) {
        grad.mult(coeff * (4.0 * w1 - w2) / dist);
    } else {
        grad.mult(-coeff * w2 / dist);
    }
    return grad;
}

// =======================================================
// 선형 대수 및 수학 함수 / Linear Algebra & Mathematics
// =======================================================

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

// =======================================================
// SDF (Signed Distance Field) 함수 / SDF Functions
// =======================================================

// 노말 계산 (SDF용) / Calculate normal (for SDF)
function calculateNormalSDF(v, shape, radius) {
    const dt = 0.1;
    let nv = createVector(0, 0);

    if (shape === "square") {
        nv.x = squareSDF(v.x + dt, v.y, radius, 0, 0) - squareSDF(v.x - dt, v.y, radius, 0, 0);
        nv.y = squareSDF(v.x, v.y + dt, radius, 0, 0) - squareSDF(v.x, v.y - dt, radius, 0, 0);
    } else if (shape === "circle") {
        nv.x = circleSDF(v.x + dt, v.y, 0, 0, radius) - circleSDF(v.x - dt, v.y, 0, 0, radius);
        nv.y = circleSDF(v.x, v.y + dt, 0, 0, radius) - circleSDF(v.x, v.y - dt, 0, 0, radius);
    } else {
        console.error("Unknown shape for SDF normal calculation:", shape);
        return createVector(0, 0);
    }
    nv.normalize();

    return nv;
}

// 원형 SDF 함수 / Circle SDF function
function circleSDF(x, y, cx = 0, cy = 0, r = 200) {
    // 원의 암시적 함수 / Implicit function of circle
    return pow(x - cx, 2) + pow(y - cy, 2) - pow(r, 2);
}

// 사각형 SDF 함수 / Square SDF function
function squareSDF(x, y, radius, centerX = 0, centerY = 0) {
    const dx = abs(x - centerX) - radius;
    const dy = abs(y - centerY) - radius;
    // 사각형의 암시적 함수 / Implicit function of square
    return min(max(dx, dy), 0.0) + sqrt(max(dx, 0.0) ** 2 + max(dy, 0.0) ** 2);
}

// =======================================================
// 렌더링 및 그리기 헬퍼 / Rendering & Drawing Helpers
// =======================================================

// 선 그리기 / Draw line
function drawLine(v1, v2) {
    line(v1.x, v1.y, v2.x, v2.y);
}

// 화살표 그리기 / Draw arrow
function drawArrow(cx, cy, len, angle) {
    push();
    translate(cx, cy);
    rotate(radians(angle));
    line(0, 0, len, 0);
    line(len, 0, len - 4, -4);
    line(len, 0, len - 4, 4);
    pop();
}
