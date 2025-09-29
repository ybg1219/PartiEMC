// 브라우저 창 크기 변경 시 캔버스 크기 조정 / Resize canvas when browser window changes
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

let gridSize = 32;      // 격자 크기 / Grid size
let numParticles = 1160;// 입자 수 / Number of particles
let cols, rows;         // 그리드 열/행 / Grid columns/rows
let R = gridSize;       // 스무딩 커널 반경 / Smoothing kernel radius
let r = R / 2;          // 레벨셋 반경 / Levelset radius
let particleRadius = 300; // 파티클 생성 반경 / Particle spawn radius
let maxDensity = 0;

let fileIndex = 0;      // 파일 인덱스 / File index
let maxFiles = 1026;    // 최대 파일 개수 / Max file count

let triangleCount = 0;
let mcTriangleCount = 0;
let emcTriangleCount = 0;

let dataScaler = 800;

let particles;          // Particle 객체 배열 / Particle array
let grid;               // 그리드 객체 배열 / Grid array

let particleData = [];

let mc;
let emc;
let CornerTable;
let CornerofEdgeTable;

let isReturn;

function setup() {
    createCanvas(1024, 1024);

    mc = new MC();
    emc = new EMC();

    CornerTable = [
        createVector(0, 1),
        createVector(1, 1),
        createVector(1, 0),
        createVector(0, 0)
    ];
    CornerofEdgeTable = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0]
    ];

    frameRate(24);
    //noLoop(); // draw()를 한 번만 실행 / Run draw() only once
    cols = width / gridSize;
    rows = height / gridSize;
    particles = new Array(numParticles);
    grid = Array.from({ length: cols + 1 }, () => new Array(rows + 1));
    initGrid(); // 그리드 초기화 / Initialize grid
}

function draw() {
    let currentFrame = (frameCount - 1) % maxFiles; // 프레임 반복 / Loop frames

    // 데이터 유효성 검사 / Check data validity
    const frameData = particleData[currentFrame];
    if (!frameData || frameData.length === 0) {
        console.error(`데이터 로딩 실패: data/${currentFrame}.txt 파일을 확인하세요.`);
        return;
    }

    background(255);

    triangleCount = 0;
    mcTriangleCount = 0;
    emcTriangleCount = 0;

    // 파티클 데이터 설정 / Set particle data
    setParticlesFromData(frameData);

    push();
    translate(width / 2, height / 2);

    setpDensities();
    setpNormal();
    setNearbyParticles();
    setLevelset(2 * R, 2 * r);

    displayGridsAndParticles();
    mc.excute();
    emc.excute();
    pop();

    // UI 표시 / Draw UI
    fill(0);
    textSize(30);
    text("Frame: " + (currentFrame + 1) + " / " + maxFiles, 50, 50);
    text("Triangle Count: " + triangleCount, 50, 90);
    text("EMC Triangle Count: " + emcTriangleCount, 50, 130);
}

// 결과 저장 / Save result
function saveResult(resultFile, fileIndex) {
    let previousData = loadStrings(resultFile);
    let newData = fileIndex + " " + triangleCount + " " + emcTriangleCount;
    let allData = previousData.concat([newData]);
    saveStrings(resultFile, allData);
}

// 그리드와 입자 시각화 / Display grids and particles
function displayGridsAndParticles() {
    for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
            grid[i][j].displayGrid();
        }
    }
    for (let i = 0; i < numParticles; i++) {
        particles[i].display();
    }
}

// 데이터로부터 파티클 설정 / Set particles from data
function setParticlesFromData(lines) {
    numParticles = lines.length;
    particles = new Array(numParticles);
    for (let i = 0; i < numParticles; i++) {
        if (lines[i]) {
            let pos = lines[i].split(" ").map(Number);
            let x = (-0.5 + pos[0]) * dataScaler;
            let y = -(-0.5 + pos[1]) * dataScaler;
            particles[i] = new Particle(x, y);
        }
    }
    particles = particles.filter(p => p !== undefined);
    numParticles = particles.length;
}

// 프레임별 데이터 미리 로드 / Preload frame data
// p5.js 내장 함수입니다. setup() 전에 자동 실행됩니다.
// This is a p5.js built-in function. It runs automatically before setup().
function preload() {
    for (let i = 0; i < maxFiles; i++) {
        let filename = i + ".txt";
        particleData[i] = loadStrings("data/" + filename);
    }
}

// 스무딩 커널 함수 / Smoothing kernel function
function k(s) {
    return max(0, pow((1 - s * s), 3));
}

// 밀도 계산 / Calculate density
function calculateDensity(v) {
    let density = 0;
    for (let pj of particles) {
        let d = p5.Vector.dist(v, pj.position);
        if (d <= R && d >= 0.01) {
            density += densityFunc(d, r);
        }
    }
    return density;
}

// 밀도 커널 함수 / Density kernel function
function densityFunc(distance, h) {
    let density = 1 - (pow(distance, 2) / pow(h, 2));
    return max(density, 0);
}

// 노말 계산 / Calculate normal
function calculateNormal(v) {
    let normal = createVector(0, 0);
    for (let pj of particles) {
        let d = p5.Vector.dist(v, pj.position);
        if (d <= gridSize * 1.5) {
            let relativePos = p5.Vector.sub(pj.position, v);
            let val = kGrad(d, relativePos);
            normal.add(val);
        }
    }
    normal.normalize();
    return normal;
}

// 커널 그라디언트 / Kernel gradient
function kGrad(dist, relativePos) {
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

// 레벨셋 계산 / Set levelset
function setLevelset(R, r) {
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            fill(255);
            let currentGrid = grid[x][y];
            let wiDenominator = 0;
            for (let pj of currentGrid.nearbyParticles) {
                let distVal = dist(currentGrid.x, currentGrid.y, pj.position.x, pj.position.y);
                wiDenominator += k(distVal / R);
            }
            currentGrid.wSum = wiDenominator;
            let wSumZero = (wiDenominator === 0);
            calculateAveragePosition(currentGrid, R, wSumZero);
            currentGrid.field = 0;
            let d = dist(currentGrid.avg.x, currentGrid.avg.y, currentGrid.x, currentGrid.y);
            currentGrid.field = (d <= 0.00001) ? r / 2 : d - r / 2;
        }
    }
}

// 평균 위치 계산 / Calculate average position
function calculateAveragePosition(currentGrid, R, wSumZero) {
    currentGrid.avg = createVector(0, 0);
    if (!wSumZero) {
        for (let pj of currentGrid.nearbyParticles) {
            let distance = dist(currentGrid.x, currentGrid.y, pj.position.x, pj.position.y);
            pj.wi = k(distance / R) / currentGrid.wSum;
            currentGrid.avg.x += pj.position.x * pj.wi;
            currentGrid.avg.y += pj.position.y * pj.wi;
        }
    } else {
        currentGrid.avg.x = currentGrid.x;
        currentGrid.avg.y = currentGrid.y;
    }
}

// 보간 함수 / Interpolation
function itrp(p0, p1, v0, v1) {
    if (v0 === 0) return p0;
    if (v1 === 0) return p1;
    if (abs(v1 - v0) < 0.00001) return p1;
    let mu = (0 - v0) / (v1 - v0);
    return createVector(p0.x + mu * (p1.x - p0.x), p0.y + mu * (p1.y - p0.y));
}

// 선 그리기 / Draw line
function drawLine(v1, v2) {
    line(v1.x, v1.y, v2.x, v2.y);
}