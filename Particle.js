// Particle 클래스 정의
class Particle {
    // 생성자 함수
    constructor(x, y) {
        // PVector -> createVector()
        this.position = createVector(x, y);
        this.radius = 10;
        this.wi = 0;
        this.normal = createVector(0, 0);
        this.density = 0;
    }

    // 밀도에 따라 색상 지정 (메서드 문법 변경)
    setParticleColors() {
        // this.density 로 클래스 내부 변수 접근
        let colorValue = map(this.density, 0, maxDensity, 100, 200);
        fill(0, 100, colorValue, 100);
    }

    // 입자를 화면에 그리는 메서드
    display() {
        fill(0, 0, 255, 100);
        stroke(150);
        push();
        //this.setParticleColors();
        circle(this.position.x, this.position.y, this.radius);
        pop();
    }

    // 파티클 법선 벡터 그리기
    drawParticleNormal() {
        // PVector.add -> p5.Vector.add
        let endPoint = p5.Vector.add(this.position, p5.Vector.mult(this.normal, gridSize));
        drawLine(this.position, endPoint);
    }
}

// === Particle 클래스와 관련된 헬퍼 함수들 ===
// 이 함수들은 특정 클래스에 속하지 않으므로 전역 함수로 둡니다.

// 모든 파티클의 법선 벡터를 계산하고 설정하는 함수
function setpNormal() {
    // for (Particle pi : particles) -> for (let pi of particles)
    for (let pi of particles) {
        pi.normal = calculateNormal(pi.position);
    }
}

// 모든 파티클의 밀도를 계산하고 설정하는 함수
function setpDensities() {
    maxDensity = 0; // 매번 최대 밀도 초기화
    for (let pi of particles) {
        pi.density = calculateDensity(pi.position);
        if (pi.density >= maxDensity) {
            maxDensity = pi.density;
        }
    }
}

// 입자 초기화 함수
function initParticles(num) {
    particles = new Array(num);
    for (let i = 0; i < num; i++) {
        let angle = random(TWO_PI);
        let r = random(particleRadius);
        let x = cos(angle) * r;
        let y = sin(angle) * r;
        // new Particle(...) 로 객체 생성
        particles[i] = new Particle(x, y);
    }
}