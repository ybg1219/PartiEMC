// 브라우저 창 크기 변경 시 캔버스 크기 조정 / Resize canvas when browser window changes
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
// =======================================================
// Global Variables
// =======================================================
let gridSize = 16;      // 격자 크기 / Grid size
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

// Data and Object Storage
let particles;          // Particle 객체 배열 / Particle array
let grid;               // 그리드 객체 배열 / Grid array
let particleData = [];

// Class Instances
let mc;
let emc;

// Lookup Tables
let CornerTable;
let CornerofEdgeTable;

// UI 관련 변수 / UI related variables
let isPlaying = true; // 애니메이션 재생 상태 / Animation play state
let speedSlider;      // 프레임 속도 슬라이더 / Frame rate slider
let pauseButton;      // 일시정지/재생 버튼 / Pause/Play button
let showGridCheckbox; // 그리드 표시 체크박스 / Show grid checkbox
let showParticlesCheckbox; // 파티클 표시 체크박스 / Show particles checkbox
let prevFrameButton;  // 이전 프레임 버튼 / Previous frame button
let nextFrameButton;  // 다음 프레임 버튼 / Next frame button
let saveButton;       // 결과 저장 버튼 / Save result button
let currentFrame = 0; // 현재 프레임 / Current frame

let showFieldCheckbox;           // 필드값 시각화 / Show field visualization
let showAvgPosCheckbox;          // 평균 위치 시각화 / Show average position visualization
let showNormalCheckbox;          // 노말 시각화 / Show normal visualization
let showParticleNormalCheckbox;  // 입자 노말 시각화 / Show particle normal visualization

let mcCheckbox;    // MC 실행 체크박스 / MC excute checkbox
let emcCheckbox;   // EMC 실행 체크박스 / EMC excute checkbox

let sphCheckbox;    // SPH 체크 박스 / SPH checkbox
let sdfCheckbox;    // SDF 체크 박스 / SDF checkbox
let radiusSlider;   // SDF radius 슬라이더 / SDF radius 조정 슬라이더
let radius;

let squareCheckbox; // SDF 모양 사각형 체크박스
let circleCheckbox; // SDF 모양 원형 체크박스

// =======================================================
// P5.js Main Functions (preload, setup, draw)
// =======================================================

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
    cols = width / gridSize;
    rows = height / gridSize;
    particles = new Array(numParticles);
    grid = Array.from({ length: cols + 1 }, () => new Array(rows + 1));
    initGrid();

    // UI 요소 생성 / Create UI elements
    speedSlider = createSlider(1, 60, 24, 1);
    speedSlider.position(50, height + 20);

    pauseButton = createButton('Pause');
    pauseButton.position(200, height + 20);
    pauseButton.mousePressed(togglePlay);

    prevFrameButton = createButton('Prev Frame');
    prevFrameButton.position(550, height + 20);
    prevFrameButton.mousePressed(prevFrame);

    nextFrameButton = createButton('Next Frame');
    nextFrameButton.position(650, height + 20);
    nextFrameButton.mousePressed(nextFrame);

    saveButton = createButton('Save Result');
    saveButton.position(800, height + 20);
    saveButton.mousePressed(() => saveResult('result.txt', currentFrame));

    showGridCheckbox = createCheckbox('Show Grid', true);
    showGridCheckbox.position(width + 20, 140);

    showParticlesCheckbox = createCheckbox('Show Particles', true);
    showParticlesCheckbox.position(width + 20, 160);

    showFieldCheckbox = createCheckbox('Show Field', false);
    showFieldCheckbox.position(width + 20, 200);

    showAvgPosCheckbox = createCheckbox('Show Avg Position', false);
    showAvgPosCheckbox.position(width + 20, 220);

    showNormalCheckbox = createCheckbox('Show Normal', false);
    showNormalCheckbox.position(width + 20, 240);

    showParticleNormalCheckbox = createCheckbox('Show Particle Normal', false);
    showParticleNormalCheckbox.position(width + 20, 260);

    mcCheckbox = createCheckbox('Run MC', false);
    mcCheckbox.position(width + 20, 300);

    emcCheckbox = createCheckbox('Run EMC', false);
    emcCheckbox.position(width + 20, 320);

    // sphCheckbox = createCheckbox('sph : particle mode', false);
    // sphCheckbox.position(width + 20, 360);

    sdfCheckbox = createCheckbox('sdf : SDF mode', false);
    sdfCheckbox.position(width + 20, 380);

    // circleCheckbox = createCheckbox('circle shape', false);
    // circleCheckbox.position(width + 20, 400);

    squareCheckbox = createCheckbox('square shape', false);
    squareCheckbox.position(width + 20, 420);
    
    radiusSlider = createSlider(10, 200, 100, 10);
    radiusSlider.position(width + 20, 440);
}

function draw() {
    if (!isPlaying) return;

    background(255);

    // 초기화/Reset counts
    triangleCount = 0;
    mcTriangleCount = 0;
    emcTriangleCount = 0;

    frameRate(speedSlider.value());

    // 프레임 반복 / Loop frames
    currentFrame = (frameCount - 1) % maxFiles;

    if (sdfCheckbox.checked()) {
        radius = radiusSlider.value();
        if (squareCheckbox.checked()){
            setLevelsetSDF("square");
        }else{
            setLevelsetSDF("circle");
        }        
    }else{
        // 데이터 유효성 검사 / Check data validity
        const frameData = particleData[currentFrame];
        if (!frameData || frameData.length === 0) {
            console.error(`데이터 로딩 실패: data/${currentFrame}.txt 파일을 확인하세요.`);
            return;
        }

        // 파티클 데이터 설정 / Set particle data
        setParticlesFromData(frameData);

        push();
        translate(width / 2, height / 2);

        setpDensities();
        setpNormal();
        setNearbyParticles();
        setLevelset(2 * R, 2 * r);
    }

    // 체크박스 상태에 따라 그리드/파티클 표시 / Show grid/particles according to checkbox
    displayGridsAndParticles();

    // MC, EMC excute 관리 / Manage MC, EMC excute by UI
    if (mcCheckbox.checked()) {
        mc.excute();
    }
    if (emcCheckbox.checked()) {
        if (!mcCheckbox.checked())  mc.excute();
        emc.excute();
    }

    pop();

    // UI 표시 / Draw UI
    displayStats(currentFrame);


}

// =======================================================
// UI Functions
// =======================================================

// 재생/일시정지 토글 / Toggle play/pause
function togglePlay() {
    isPlaying = !isPlaying;
    pauseButton.html(isPlaying ? 'Pause' : 'Play');
}

// 이전 프레임 / Previous frame
function prevFrame() {
    isPlaying = false;
    currentFrame = (currentFrame - 1 + maxFiles) % maxFiles;
    redraw();
}

// 다음 프레임 / Next frame
function nextFrame() {
    isPlaying = false;
    currentFrame = (currentFrame + 1) % maxFiles;
    redraw();
}

// 슬라이더 값 변경 시 프레임 속도 업데이트 / Update frame rate on slider change
function updateFrameRate() {
    frameRate(speedSlider.value());
}

// =======================================================
// Helper Functions
// =======================================================

/**
 * 화면에 통계 정보를 그립니다.
 */
function displayStats(currentFrame) {
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
            if (showGridCheckbox.checked()) {
                grid[i][j].displayGrid();
            }
            if (showAvgPosCheckbox.checked()) {
                grid[i][j].displayAveragePosition();
            }
            if (showNormalCheckbox.checked()) {
                grid[i][j].displayNormals();
            }
            if (showFieldCheckbox.checked()) {
                grid[i][j].drawField();
            }
        }
    }
    for (let i = 0; i < numParticles; i++) {
        if (showParticlesCheckbox.checked()) {
            particles[i].display();
        }
        if (showParticleNormalCheckbox.checked()) {
            particles[i].drawParticleNormal();
        }
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

function circleSDF(x, y, cx, cy, radius) {
  const distance=pow(x-cx, 2)+pow(y-cy, 2)-radius*radius; // implicit fucntion
  return distance;
}

function squareSDF(x, y, radius) {
  
  const centerX = width / 2; // 캔버스의 중심 x 좌표
  const centerY = height / 2; // 캔버스의 중심 y 좌표

  const dx = abs(x - centerX) - radius; // 중심으로부터의 x 거리 계산
  const dy = abs(y - centerY) - radius; // 중심으로부터의 y 거리 계산
  const result = min(max(dx, dy), 0.0) + sqrt(max(dx, 0.0)*max(dx, 0.0) + max(dy, 0.0)*max(dy, 0.0));
  return result;
}

// SDF 레벨셋 계산 / Set levelset for SDF
function setLevelsetSDF(shape) {
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            fill(255);
            let currentGrid = grid[x][y];
            if (shape == "circle"){
                currentGrid.field = circleSDF(x, y);
            } else if (shape == "square"){
                currentGrid.field = squareSDF(x,y);
            } else {
                // error
            }
        }
    }
}

// SPH 레벨셋 계산 / Set levelset for SPF
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

// 화살표 그리기 / Draw arrow
function drawArrow(cx, cy, len, angle) {
    push();
    translate(cx, cy);
    rotate(radians(angle));
    line(0, 0, len, 0);
    line(len, 0, len - 8, -8);
    line(len, 0, len - 8, 8);
    pop();
}