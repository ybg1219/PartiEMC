// =======================================================
// Particle 클래스 정의 / Particle Class Definition
// =======================================================
class Particle {
    /**
     * 파티클 생성자 / Particle constructor
     * @param {number} x - x 좌표 / x position
     * @param {number} y - y 좌표 / y position
     */
    constructor(x, y) {
        this.position = createVector(x, y); // 위치 / Position
        this.radius = 10;                   // 반경 / Radius
        this.wi = 0;                        // 커널 가중치 / Kernel weight
        this.normal = createVector(0, 0);   // 법선 벡터 / Normal vector
        this.density = 0;                   // 밀도 / Density
    }

    /**
     * 밀도에 따라 색상 지정 / Set color by density
     */
    setParticleColors() {
        // 필요시 색상 로직 구현 / Implement color logic if needed
    }

    /**
     * 파티클 시각화 / Display particle
     */
    display() {
        push();

        stroke(150);
        fill(200, 200);
        if (densityfieldCheckbox.checked()) {
            // 밀도 기반 색상 매핑 / Density-based color mapping
            // let colorValue = map(this.density, 0, maxDensity, 200, 50);
            // stroke(150);
            // fill( colorValue, 200);
            
            let amount = map(this.density, 0, maxDensity, 0, 1);
            let particleColor = lerpColor(lowDensityColor, highDensityColor, amount);
            fill(particleColor);

        }
        circle(this.position.x, this.position.y, this.radius);

        // 밀도값 표시 / Show density value
        if (densityDebugCheckbox.checked()) {
            fill(0);
            noStroke();
            textSize(8);
            textAlign(CENTER, CENTER);
            text(nf(this.density, 1, 2), this.position.x, this.position.y - this.radius - 8);
        }

        pop();
    }

    /**
     * 파티클 법선 벡터 시각화 / Draw particle normal vector
     */
    drawParticleNormal() {
        if (!this.normal || (this.normal.x === 0 && this.normal.y === 0)) return;
        let angle = degrees(this.normal.heading());
        stroke(250, 200, 0);
        strokeWeight(2);
        drawArrow(this.position.x, this.position.y, gridSize, angle);
    }
}

// =======================================================
// Particle 관련 헬퍼 함수 / Particle Helper Functions
// =======================================================

/**
 * 모든 파티클의 법선 벡터 계산 / Set normals for all particles
 */
function setpNormal() {
    for (let pi of particles) {
        pi.normal = calculateNormal(pi.position);
    }
}

/**
 * 모든 파티클의 밀도 계산 / Set densities for all particles
 */
function setpDensities() {
    maxDensity = 0;
    for (let pi of particles) {
        pi.density = calculateDensity(pi.position);
        if (pi.density > maxDensity) {
            maxDensity = pi.density;
        }
    }
}

/**
 * 파티클 배열 생성 / Create particle array
 * @param {number} num - 파티클 개수 / Number of particles
 * @param {number} radius - 생성 반경 / Creation radius
 * @param {string} shape - 'circle' 또는 'square' / 'circle' or 'square'
 */
function createParticles(num, radius, shape) {
    particles = [];
    if (shape === 'circle') {
        for (let i = 0; i < num; i++) {
            let angle = random(TWO_PI);
            let r = random(radius);
            let x = cos(angle) * r;
            let y = sin(angle) * r;
            particles.push(new Particle(x, y));
        }
    } else if (shape === 'square') {
        for (let i = 0; i < num; i++) {
            let x = random(-radius, radius);
            let y = random(-radius, radius);
            particles.push(new Particle(x, y));
        }
    }
    // 남는 파티클 제거 / remove extra particles
    particles.length = num;
    numParticles = particles.length;
}



/**
 * 파티클 위치 설정 / Set particle positions
 * @param {Array} positions - 위치 벡터 배열 / Array of position vectors
 */
function setSPHParticlePositions(positions) {
    for (let i = 0; i < positions.length; i++) {
        if (i < particles.length) {
            particles[i].position.set(positions[i].x, positions[i].y);
        } else {
            particles.push(new Particle(positions[i].x, positions[i].y));
        }
    }
    // 필요시 남는 파티클 제거 / Optionally remove extra particles
    particles.length = positions.length;
    numParticles = particles.length;
}

// =======================================================
// End of Particle.js
// =======================================================