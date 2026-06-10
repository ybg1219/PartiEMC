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
        rect(this.x, this.y, State.config.gridSize, State.config.gridSize);
    }

    // 평균 위치를 시각화
    displayAveragePosition() {
        fill(200, 200, 100);
        stroke(50);
        circle(this.avg.x, this.avg.y, 5);
    }

    // 법선 벡터를 시각화
    displayNormals() {
        for (let k = 0; k < 4; k++) {
            if ((this.edgeBits & (1 << (3 - k))) !== 0) {
                let n = this.normals[k];
                // 0,0 노말은 그리지 않음 / Skip zero normals
                if (!n || (n.x === 0 && n.y === 0)) continue;
                // stroke('green');
                stroke(100, 200, 100);
                strokeWeight(2);
                // drawArrow(시작점 x, 시작점 y, 길이, 각도)
                let angle = degrees(n.heading());
                drawArrow(this.itrps[k].x, this.itrps[k].y, State.config.gridSize, angle);
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
            let gridX = i * State.config.gridSize - width / 2;
            let gridY = j * State.config.gridSize - height / 2;
            grid[i][j] = new Grid(gridX, gridY);
        }
    }
}

// 각 그리드 셀에 인접한 입자들을 할당하는 함수
function setNearbyParticles() {
    // 1. 그리드 내 인접 파티클 배열 초기화
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            grid[x][y].nearbyParticles = [];
        }
    }

    // 예외 처리: 그리드 데이터가 아직 생성되지 않았다면 중단
    if (!grid || grid.length === 0 || !grid[0][0]) return;

    // 2. 기준 크기를 하나로 통일
    let gridSize = State.config.gridSize;
    let gridSizeSq = gridSize * gridSize;

    // 반경이 gridSize와 같으므로, 내 주변 상하좌우 1칸씩만 확인하면 충분합니다 (3x3 영역)
    let range = 1;

    // 3. 각 파티클을 순회하며 '주변 3x3 그리드'만 정밀 검사
    for (let p of particles) {
        // 그리드 시작점(grid[0][0])을 기준으로 파티클이 몇 번째 칸 근처에 있는지 계산
        let centerX = Math.round((p.position.x - grid[0][0].x) / gridSize);
        let centerY = Math.round((p.position.y - grid[0][0].y) / gridSize);

        // 중심점(centerX, centerY) 기준 주변 영역만 루프를 돕니다.
        let startX = Math.max(0, centerX - range);
        let endX = Math.min(cols, centerX + range);
        let startY = Math.max(0, centerY - range);
        let endY = Math.min(rows, centerY + range);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                // 제곱근 연산을 생략하여 성능을 극대화합니다.
                let dx = p.position.x - grid[x][y].x;
                let dy = p.position.y - grid[x][y].y;
                let distSq = dx * dx + dy * dy;
                if (distSq <= gridSizeSq) {
                    grid[x][y].nearbyParticles.push(p);
                }
            }
        }
    }
}