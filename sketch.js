// 브라우저 창 크기 변경 시 캔버스 크기 조정 / Resize canvas when browser window changes
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
// Data and Object Storage
let particleData = [];

// Class Instances
let mc;
let emc;

// Lookup Tables
let CornerTable;
let CornerofEdgeTable;


// =======================================================
// P5.js Main Functions (preload, setup, draw)
// =======================================================

function setup() {
    createCanvas(State.config.canvasWidth, State.config.canvasHeight);

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

    frameRate(State.config.defaultFrameRate);
    cols = width / State.config.gridSize;
    rows = height / State.config.gridSize;

    // State.simulation에 격자 수 동기화
    State.simulation.cols = cols;
    State.simulation.rows = rows;

    particles = new Array(State.simulation.numParticles);
    State.simulation.particles = particles; // 배열 참조 공유

    grid = Array.from({ length: cols + 1 }, () => new Array(rows + 1));
    State.simulation.grid = grid; // 배열 참조 공유

    initGrid();

    // 기본 변수 설정 / Default variables setup
    shape = "circle";
    radius = State.config.defaultRadius;

    // State.simulation 파라미터 초기화 및 전역 호환 바인딩
    State.simulation.shape = shape;
    R = State.config.gridSize;
    r = State.config.gridSize / 2;
    State.simulation.R = R;
    State.simulation.r = r;

    State.ui.lowDensityColor = color(0, 100, 255);   // 파란색
    State.ui.highDensityColor = color(255, 50, 0);    // 붉은색

    if (!particles || particles.length !== State.simulation.numParticles) {
        createParticles(State.simulation.numParticles, radius, shape);

        console.log(`${State.simulation.numParticles} particles created.`);
    }


    // UI 요소 생성 / Create UI elements
    UI.init(State);
}

function draw() {
    // State.runtime과 전역 변수 동기화
    isPlaying = State.runtime.isPlaying;
    if (!isPlaying) return;

    background(255);

    // 초기화/Reset counts
    triangleCount = 0;
    mcTriangleCount = 0;
    emcTriangleCount = 0;

    // State.runtime 통계 카운터 초기화
    State.runtime.triangleCount = 0;
    State.runtime.mcTriangleCount = 0;
    State.runtime.emcTriangleCount = 0;

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
    State.simulation.shape = shape;

    // SDF 모드가 켜진 경우 / If SDF mode is enabled
    if (sdfCheckbox.checked()) {

        showParticlesCheckbox.checked(false);
        showParticleNormalCheckbox.checked(false);

        setLevelsetSDF(shape);

    } else {

        if (SPHCheckbox.checked()) {
            // SPH 모드가 켜진 경우 / If SPH mode is enabled
            State.simulation.numParticles = numParticlesSlider.value();
            R = smoothingRadiusSlider.value();
            r = levelsetRadiusSlider.value();

            // State.simulation 파라미터 갱신
            State.simulation.R = R;
            State.simulation.r = r;

        } else {
            // 유체 시뮬레이션 데이터 모드/ If fluid simulation data mode
            // 시뮬레이션 프레임 반복 / Loop all frames
            currentFrame = (frameCount - 1) % State.config.maxFiles;
            State.runtime.currentFrame = currentFrame;

            // 모든 프레임 데이터를 미리 로드해서 particleData 배열에 저장함 
            // / All frame data is preloaded and stored in the particleData array
            const frameData = particleData[currentFrame];
            if (!frameData || frameData.length === 0) {
                console.error(`데이터 로딩 실패: data/${currentFrame}.txt 파일을 확인하세요.`);
                return;
            }
            setParticlesFromData(frameData);
        }

        setNearbyParticles(); // 1. 격자 기반 공간 분할 맵을 최신 파티클 위치로 선행 업데이트
        setpDensities();      // 2. 격자 정보를 참조하여 밀도 연산 진행 (O(N))
        setpNormal();         // 3. 격자 정보를 참조하여 법선 연산 진행 (O(N))
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

    // draw() 루프 종료 후 State.runtime에 최종 집계 동기화
    State.runtime.triangleCount = triangleCount;
    State.runtime.mcTriangleCount = mcTriangleCount;
    State.runtime.emcTriangleCount = emcTriangleCount;

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
        State.simulation.numParticles = numParticlesSlider.value();
        createParticles(State.simulation.numParticles, radius, shape);
        console.log(`SPH mode ON. ${State.simulation.numParticles} particles created.`);
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
        State.simulation.numParticles = numParticlesSlider.value();

        // 슬라이더 값에 맞춰 파티클 배열을 새로 생성. / Recreate particle array to match slider value
        createParticles(State.simulation.numParticles, radius, shape);
    }
}

function updateRadius() {
    // SPH 모드가 활성화된 상태일 때만 실행하면 됨. / Only need to run when SPH mode is enabled.
    if (SPHCheckbox.checked()) {
        radius = radiusSlider.value();

        // 슬라이더 값에 맞춰 파티클 배열을 새로 생성. / Recreate particle array to match slider value
        createParticles(State.simulation.numParticles, radius, shape);
    }
}


// =======================================================
// UI Functions
// =======================================================

// 재생/일시정지 토글 / Toggle play/pause
function togglePlay() {
    State.runtime.isPlaying = !State.runtime.isPlaying;
    isPlaying = State.runtime.isPlaying;
    pauseButton.html(isPlaying ? 'Pause' : 'Play');
}

// 이전 프레임 / Previous frame
function prevFrame() {
    State.runtime.isPlaying = false;
    isPlaying = false;
    State.runtime.currentFrame = (State.runtime.currentFrame - 1 + State.config.maxFiles) % State.config.maxFiles;
    currentFrame = State.runtime.currentFrame;
    redraw();
}

// 다음 프레임 / Next frame
function nextFrame() {
    State.runtime.isPlaying = false;
    isPlaying = false;
    State.runtime.currentFrame = (State.runtime.currentFrame + 1) % State.config.maxFiles;
    currentFrame = State.runtime.currentFrame;
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
    text("Frame: " + (currentFrame + 1) + " / " + State.config.maxFiles, 50, 50);
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
    for (let i = 0; i < State.simulation.numParticles; i++) {
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
    State.simulation.numParticles = lines.length;
    particles.length = State.simulation.numParticles;

    for (let i = 0; i < State.simulation.numParticles; i++) {
        if (lines[i]) {
            let pos = lines[i].split(" ").map(Number);
            let x = (-0.5 + pos[0]) * State.config.dataScaler;
            let y = -(-0.5 + pos[1]) * State.config.dataScaler;
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
    if (particles.length > State.simulation.numParticles - 1) {
        particles.length = State.simulation.numParticles - 1;
        State.simulation.numParticles = particles.length;
    }
}

// 프레임별 데이터 미리 로드 / Preload frame data
// p5.js 내장 함수입니다. setup() 전에 자동 실행됩니다.
// This is a p5.js built-in function. It runs automatically before setup().
function preload() {
    for (let i = 0; i < State.config.maxFiles; i++) {
        let filename = i + ".txt";
        particleData[i] = loadStrings("data/" + filename);
    }
}

// 밀도 계산 / Calculate density
function calculateDensity(v) {
    let density = 0;
    const gridSize = State.config.gridSize;

    // v 좌표가 위치한 격자 상의 정수 셀 인덱스 역산
    let centerX = Math.round((v.x - grid[0][0].x) / gridSize);
    let centerY = Math.round((v.y - grid[0][0].y) / gridSize);

    // 반경 R * 2에 따라 주변 몇 칸(그리드)까지 탐색할지 결정
    let range = Math.ceil((R * 2) / gridSize);
    let startX = Math.max(0, centerX - range);
    let endX = Math.min(cols, centerX + range);
    let startY = Math.max(0, centerY - range);
    let endY = Math.min(rows, centerY + range);

    // 전체 파티클 순회가 아닌 주변 3x3 ~ 5x5 인접 셀 내 입자만 대조
    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            for (let pj of grid[x][y].nearbyParticles) {
                let d = p5.Vector.dist(v, pj.position);
                if (d <= R * 2 && d >= 0.01) {
                    density += densitykernel(d, R * 2);
                }
            }
        }
    }
    return density;
}



// 노말 계산 / Calculate normal
function calculateNormal(v) {
    let normal = createVector(0, 0);
    const gridSize = State.config.gridSize;

    // v 좌표가 위치한 격자 상의 정수 셀 인덱스 역산
    let centerX = Math.round((v.x - grid[0][0].x) / gridSize);
    let centerY = Math.round((v.y - grid[0][0].y) / gridSize);

    // 반경 gridSize * 2에 대응하여 주변 2칸 영역 탐색 (5x5 범위)
    let range = 2;
    let startX = Math.max(0, centerX - range);
    let endX = Math.min(cols, centerX + range);
    let startY = Math.max(0, centerY - range);
    let endY = Math.min(rows, centerY + range);

    // 주변 격자 내 입자들만 수집하여 계산
    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            for (let pj of grid[x][y].nearbyParticles) {
                let d = p5.Vector.dist(v, pj.position);
                if (d <= gridSize * 2) {
                    let relativePos = p5.Vector.sub(pj.position, v);
                    let val = kGrad(d, relativePos, R); // R 인수 추가
                    normal.add(val);
                }
            }
        }
    }
    normal.normalize();
    return normal;
}



// SDF 레벨셋 계산 / Set levelset for SDF
function setLevelsetSDF(shape) {
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            let currentGrid = grid[x][y];
            currentGrid.field = 0;
            if (shape === "circle") {
                // 원형 SDF / Circle SDF
                currentGrid.field = circleSDF(currentGrid.x, currentGrid.y, width / 2, height / 2, State.simulation.radius);
            } else if (shape === "square") {
                // 사각형 SDF / Square SDF
                currentGrid.field = squareSDF(currentGrid.x, currentGrid.y, State.simulation.radius);
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


