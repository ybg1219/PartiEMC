// Grid 클래스 정의 (격자)
class Grid {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        // ArrayList<Particle> -> [] (빈 배열)
        this.nearbyParticles = [];

        // PVector -> createVector()
        this.avg = createVector(0, 0);
        this.wSum = 0;
        this.field = 0;
        this.intersectionBit = 0;
        this.edgeBits = 0;

        // PVector[] -> new Array(...)
        this.itrps = new Array(4);
        this.normals = new Array(4);
        this.densities = new Array(4);
        this.finalPoints = new Array(9);
    }

    // 그리드를 시각적으로 표시
    displayGrid() {
        stroke(200);
        noFill();
        rect(this.x, this.y, gridSize, gridSize);
    }

    // 평균 위치를 시각화
    displayAveragePosition() {
        fill(255, 100, 100);
        stroke(50);
        circle(this.avg.x, this.avg.y, 10);
    }

    // 법선 벡터를 시각화
    displayNormals() {
        for (let k = 0; k < 4; k++) {
            if ((this.edgeBits & (1 << (3 - k))) !== 0) {
                // PVector.add -> p5.Vector.add
                let startPoint = p5.Vector.add(this.itrps[k], p5.Vector.mult(this.normals[k], gridSize));
                drawLine(startPoint, this.itrps[k]);
            }
        }
    }

    // 필드 값을 그리기
    drawField() {
        push();
        if (this.field > 0) {
            fill(0, 255, 0);
        } else {
            fill(255, 0, 0);
        }
        circle(this.x, this.y, 5);
        pop();
    }
}

// === Grid 클래스와 관련된 헬퍼 함수들 ===

// 그리드 2D 배열을 초기화하는 함수
function initGrid() {
    // int i = 0 -> let i = 0
    for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
            let gridX = i * gridSize - width / 2;
            let gridY = j * gridSize - height / 2;
            grid[i][j] = new Grid(gridX, gridY);
        }
    }
}

// 각 그리드 셀에 인접한 입자들을 할당하는 함수
function setNearbyParticles() {
    // 그리드 내 인접 파티클 배열 초기화
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            // .clear() -> 빈 배열 할당으로 대체
            grid[x][y].nearbyParticles = [];
        }
    }

    // 각 파티클을 순회하며 인접 그리드에 할당
    // for (Particle p : particles) -> for (let p of particles)
    for (let p of particles) {
        // 그리드 셀 범위를 좀 더 최적화하여 계산 부담을 줄일 수 있습니다.
        // 여기서는 원본 코드의 로직을 그대로 따릅니다.
        for (let x = 0; x <= cols; x++) {
            for (let y = 0; y <= rows; y++) {
                let distance = dist(p.position.x, p.position.y, grid[x][y].x, grid[x][y].y);
                if (distance <= gridSize) {
                    // .add(p) -> .push(p)
                    grid[x][y].nearbyParticles.push(p);
                }
            }
        }
    }
}