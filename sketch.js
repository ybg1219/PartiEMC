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
let maxDensity = 0;

let fileIndex = 0;      // 파일 인덱스 / File index
let maxFiles = 1026;    // 최대 파일 개수 / Max file count

let triangleCount = 0;
let mcTriangleCount = 0;
let emcTriangleCount = 0;

let dataScaler = 800;

// Data and Object Storage
let particles = [];          // Particle 객체 배열 / Particle array
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
let greedyMeshingCheckbox; // 그리디 메시징 체크박스 / Greedy meshing checkbox

// SDF 관련 UI 변수 / SDF UI variables
let sdfCheckbox;      // SDF 모드 체크박스 / SDF mode checkbox
let squareCheckbox;   // 사각형 SDF 체크박스 / Square SDF checkbox
let shape;            // 모양 정보 저장/ Shape info storage
let radiusSlider;     // SDF 반경 슬라이더 / SDF radius slider
let radius;           // 현재 SDF 반경 / Current SDF radius

// SPH 관련 UI 변수 / SPH UI variables
let SPHCheckbox;      // SPH 모드 체크박스 / SPH mode checkbox
let numParticlesSlider; // 입자 수 슬라이더 / Number of particles slider
let smoothingRadiusSlider; // 스무딩 반경 슬라이더 / Smoothing radius slider
let levelsetRadiusSlider; // 레벨셋 반경 슬라이더 / Levelset radius slider


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

    // 기본 변수 설정 / Default variables setup
    shape = "circle";
    radius = 200;

    if (!particles || particles.length !== numParticles) {
        createParticles(numParticles, radius, shape);

        console.log(`${numParticles} particles created.`);
    }


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

    showParticlesCheckbox = createCheckbox('Show Particles', false);
    showParticlesCheckbox.position(width + 20, 160);

    showFieldCheckbox = createCheckbox('Show Field', false);
    showFieldCheckbox.position(width + 20, 200);

    showAvgPosCheckbox = createCheckbox('Show Avg Position', false);
    showAvgPosCheckbox.position(width + 20, 220);

    showNormalCheckbox = createCheckbox('Show Normal', false);
    showNormalCheckbox.position(width + 20, 240);

    showParticleNormalCheckbox = createCheckbox('Show Particle Normal', false);
    showParticleNormalCheckbox.position(width + 20, 260);

    mcCheckbox = createCheckbox('Run MC', true);
    mcCheckbox.position(width + 20, 300);

    emcCheckbox = createCheckbox('Run EMC', false);
    emcCheckbox.position(width + 20, 320);

    greedyMeshingCheckbox = createCheckbox('Greedy Meshing', true);
    greedyMeshingCheckbox.position(width + 20, 340);

    // SDF UI 요소 생성 / Create SDF UI elements
    sdfCheckbox = createCheckbox('SDF mode', false);
    sdfCheckbox.position(width + 20, 380);

    squareCheckbox = createCheckbox('Square shape', false);
    squareCheckbox.position(width + 20, 400);

    radiusSlider = createSlider(10, 200, radius, 10);
    radiusSlider.position(width + 20, 420);
    radiusSlider.input(updateRadius);

    // SPH UI 요소 생성 / Create SPH UI elements
    SPHCheckbox = createCheckbox('SPH mode', false);
    SPHCheckbox.position(width + 20, 460);
    // 체크박스 상태가 변경될 때마다 onSPHModeChange 함수를 호출/ Call onSPHModeChange function whenever checkbox state changes
    SPHCheckbox.changed(onSPHModeChange);

    numParticlesSlider = createSlider(100, 1500, numParticles, 10);
    numParticlesSlider.position(width + 20, 480);
    // 슬라이더를 조작하는 동안 실시간으로 updateParticleCount 함수를 호출합니다.
    numParticlesSlider.input(updateParticleCount);


    smoothingRadiusSlider = createSlider(5, 100, R, 1);
    smoothingRadiusSlider.position(width + 20, 500);

    levelsetRadiusSlider = createSlider(1, 100, r, 1);
    levelsetRadiusSlider.position(width + 20, 520);
}

function draw() {
    if (!isPlaying) return;

    background(255);

    // 초기화/Reset counts
    triangleCount = 0;
    mcTriangleCount = 0;
    emcTriangleCount = 0;

    frameRate(speedSlider.value());

    push();
    translate(width / 2, height / 2);

    // 반경 업데이트 / Update radius
    radius = radiusSlider.value();
    // 모양 설정 / Set shape
    if (squareCheckbox.checked()) {
        shape = "square";
    } else { // default
        shape = "circle";
    }

    // SDF 모드가 켜진 경우 / If SDF mode is enabled
    if (sdfCheckbox.checked()) {

        showParticlesCheckbox.checked(false);
        showParticleNormalCheckbox.checked(false);

        setLevelsetSDF(shape);

    } else {

        if (SPHCheckbox.checked()) {
            // SPH 모드가 켜진 경우 / If SPH mode is enabled
            numParticles = numParticlesSlider.value();
            R = smoothingRadiusSlider.value();
            r = levelsetRadiusSlider.value();

        } else {
            // 유체 시뮬레이션 데이터 모드/ If fluid simulation data mode
            // 시뮬레이션 프레임 반복 / Loop all frames
            currentFrame = (frameCount - 1) % maxFiles;

            // 모든 프레임 데이터를 미리 로드해서 particleData 배열에 저장함 
            // / All frame data is preloaded and stored in the particleData array
            const frameData = particleData[currentFrame];
            if (!frameData || frameData.length === 0) {
                console.error(`데이터 로딩 실패: data/${currentFrame}.txt 파일을 확인하세요.`);
                return;
            }
            setParticlesFromData(frameData);
        }

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
        if (!mcCheckbox.checked()) mc.excute();
        emc.excute();
    }

    pop();

    // UI 표시 / Draw UI
    displayStats(currentFrame);


}

// =======================================================
// Event listeners
// =======================================================

/**
 * SPHCheckbox의 상태가 변경될 때 호출되는 함수.
 */
function onSPHModeChange() {
    if (SPHCheckbox.checked()) {
        // SPH 모드가 켜지는 순간 SDF 모드 false (동시 실행 방지) / When SPH mode is enabled SDF mode false (prevent simultaneous execution)
        sdfCheckbox.checked(false);
        // 현재 슬라이더 값으로 파티클을 생성. / Create particles with current slider value
        numParticles = numParticlesSlider.value();
        createParticles(numParticles, radius, shape);
        console.log(`SPH mode ON. ${numParticles} particles created.`);
    } else {
        // SPH 모드가 꺼지는 순간:
        console.log("SPH mode OFF.");
        // 필요하다면, 유체 시뮬레이션의 첫 프레임으로
        // currentFrame = 0; 
    }
}

/**
 * numParticlesSlider 값이 변경될 때마다 호출되어
 * SPH 모드일 경우 파티클 개수를 실시간으로 조절.
 */
function updateParticleCount() {
    // SPH 모드가 활성화된 상태일 때만 실행.
    if (SPHCheckbox.checked()) {
        numParticles = numParticlesSlider.value();

        // 슬라이더 값에 맞춰 파티클 배열을 새로 생성. / Recreate particle array to match slider value
        createParticles(numParticles, radius, shape);
    }
}

function updateRadius() {
    // SPH 모드가 활성화된 상태일 때만 실행하면 됨. / Only need to run when SPH mode is enabled.
    if (SPHCheckbox.checked()) {
        radius = radiusSlider.value();

        // 슬라이더 값에 맞춰 파티클 배열을 새로 생성. / Recreate particle array to match slider value
        createParticles(numParticles, radius, shape);
    }
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

    // 기존 파티클 배열을 재사용하거나 새로 생성 / Reuse or recreate particle array
    if (!particles || particles.length !== lines.length) {
        particles = new Array(lines.length);
    }
    numParticles = lines.length;
    particles.length = numParticles;

    for (let i = 0; i < numParticles; i++) {
        if (lines[i]) {
            let pos = lines[i].split(" ").map(Number);
            let x = (-0.5 + pos[0]) * dataScaler;
            let y = -(-0.5 + pos[1]) * dataScaler;
            if (particles[i]) {
                // 기존 파티클 위치만 갱신 / Update position of existing particle
                particles[i].position.set(x, y);
            } else {
                // 새 파티클 생성 / Create new particle
                particles[i] = new Particle(x, y);
            }
        }
    }
    // 남는 파티클 제거 / Remove extra particles
    if (particles.length > numParticles-1) {
        particles.length = numParticles-1;
        numParticles = particles.length;
    }
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
        // ▼▼▼▼▼ 디버깅 코드 추가 ▼▼▼▼▼
        if (!pj) {
            console.error("💥 calculateDensity 오류: particles 배열의 요소가 undefined입니다!");
            continue; // 이 요소는 건너뛰고 다음 루프를 실행합니다.
        }
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
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

// 노말 계산 (SDF용) / Calculate normal (for SDF)
function calculateNormalSDF(v, shape) {
    const dt = 0.1;
    let nv = createVector(0, 0);

    if (shape === "square") {
        nv.x = squareSDF(v.x + dt, v.y) - squareSDF(v.x - dt, v.y);
        nv.y = squareSDF(v.x, v.y + dt) - squareSDF(v.x, v.y - dt);
    } else if (shape === "circle") {
        nv.x = circleSDF(v.x + dt, v.y) - circleSDF(v.x - dt, v.y);
        nv.y = circleSDF(v.x, v.y + dt) - circleSDF(v.x, v.y - dt);
    } else {
        console.error("Unknown shape for SDF normal calculation:", shape);
        return createVector(0, 0);
    }
    nv.normalize();

    return nv;
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

// 원형 SDF 함수 / Circle SDF function
// function circleSDF(x, y, cx, cy, radius) {
//     const centerX = width / 2;
//     const centerY = height / 2;
//     // 원의 암시적 함수 / Implicit function of circle
//     return pow(x - cx, 2) + pow(y - cy, 2) - pow(radius, 2);
// }
function circleSDF(x, y) {
    const centerX = 0;
    const centerY = 0;
    // 원의 암시적 함수 / Implicit function of circle
    return pow(x - centerX, 2) + pow(y - centerY, 2) - pow(radius, 2);
}

// 사각형 SDF 함수 / Square SDF function
function squareSDF(x, y) {
    // 캔버스 중심 기준 / Based on canvas center
    const centerX = 0;
    const centerY = 0;
    const dx = abs(x - centerX) - radius;
    const dy = abs(y - centerY) - radius;
    // 사각형의 암시적 함수 / Implicit function of square
    return min(max(dx, dy), 0.0) + sqrt(max(dx, 0.0) ** 2 + max(dy, 0.0) ** 2);
}

// SDF 레벨셋 계산 / Set levelset for SDF
function setLevelsetSDF(shape) {
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            let currentGrid = grid[x][y];
            currentGrid.field = 0;
            if (shape === "circle") {
                // 원형 SDF / Circle SDF
                currentGrid.field = circleSDF(currentGrid.x, currentGrid.y, width / 2, height / 2, radius);
            } else if (shape === "square") {
                // 사각형 SDF / Square SDF
                currentGrid.field = squareSDF(currentGrid.x, currentGrid.y, radius);
            } else {
                // 에러 처리 / Error handling
                console.error("Unknown shape for SDF:", shape);
            }
        }
    }
}

// SPH 레벨셋 계산 / Set levelset for SPH
function setLevelset(R, r) {
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            fill(255);
            let currentGrid = grid[x][y];
            currentGrid.field = 0;
            let wiDenominator = 0;
            for (let pj of currentGrid.nearbyParticles) {
                let distVal = dist(currentGrid.x, currentGrid.y, pj.position.x, pj.position.y);
                wiDenominator += k(distVal / R);
            }
            currentGrid.wSum = wiDenominator;
            let wSumZero = (wiDenominator === 0);
            calculateAveragePosition(currentGrid, R, wSumZero);
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