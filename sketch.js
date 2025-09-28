// 브라우저 창 크기가 변경될 때마다 캔버스 크기를 다시 조절하는 함수
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

let gridSize = 32;  // 격자 크기
let numParticles = 1160;  // 입자 수
let cols, rows;  // 그리드의 열과 행 수
let R = gridSize;  // 스무딩 커널 반경
let r = R / 2;  // 레벨셋 반경
let particleRadius = 300;  // 파티클 생성 반경
let maxDensity = 0;

let fileIndex = 0; // 파일 인덱스 (1부터 시작)
let maxFiles = 1026; // 최대 파일 개수

let triangleCount = 0;
let mcTriangleCount = 0;
let emcTriangleCount = 0;

let scale = 800;

let particles;  // Particle 객체 배열
let grid;  // 그리드 객체 배열

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
    noLoop();  // draw() 함수를 한 번만 실행
    cols = width / gridSize;
    rows = height / gridSize;
    particles = new Array(numParticles);
    grid = Array.from({ length: cols + 1 }, () => new Array(rows + 1));
    //initParticles(numParticles);  // 입자 초기화
    initGrid();  // 그리드 초기화
}

function draw() {
    let currentFrame = frameCount - 1;

    if (currentFrame >= maxFiles) {
        noLoop(); // 애니메이션이 끝나면 멈춤
        console.log("Animation Finished");
        return;
    }

    // 데이터 유효성 검사
    const frameData = particleData[currentFrame];
    if (!frameData || frameData.length === 0) {
        console.error(`데이터 로딩 실패: data/${currentFrame}.txt 파일을 확인하세요.`);
        return;
    }

    background(255);

    triangleCount = 0;
    mcTriangleCount = 0; // mcTriangleCount도 초기화가 필요할 수 있습니다.
    emcTriangleCount = 0;

    // 2. 미리 로드된 데이터로 파티클을 설정하는 새 함수를 호출합니다.
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

    // UI 그리기
    fill(0);
    textSize(30);
    text("Frame: " + (currentFrame + 1) + " / " + maxFiles, 50, 50);
    text("Triangle Count: " + triangleCount, 50, 90);
    text("EMC Triangle Count: " + emcTriangleCount, 50, 130);
}


function saveResult(resultFile, fileIndex) {
    // 파일 읽기
    let previousData = loadStrings(resultFile);

    // 새로운 데이터 생성
    let newData = fileIndex + " " + triangleCount + " " + emcTriangleCount;

    // 기존 데이터와 새로운 데이터 합침
    let allData = new Array(previousData.length + 1);
    for (let i = 0; i < previousData.length; i++) {
        allData[i] = previousData[i];
    }
    allData[previousData.length] = newData;

    // 새로운 데이터를 기존 파일에 저장
    saveStrings(resultFile, allData);
}

// 그리드와 입자 시각화
function displayGridsAndParticles() {
    for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
            grid[i][j].displayGrid();  // 그리드 시각화
            //grid[i][j].displayAveragePosition();
            //grid[i][j].displayNormals();
            //grid[i][j].drawField();
        }
    }
    for (let i = 0; i < numParticles; i++) {
        particles[i].display();  // 입자 시각화
        //particles[i].drawParticleNormal();
    }
}

function setParticlesFromData(lines) {
  numParticles = lines.length;
  particles = new Array(numParticles);
  for (let i = 0; i < numParticles; i++) {
    if (lines[i]) { // 빈 줄이 아닌지 확인
      let pos = lines[i].split(" ").map(Number);
      let x = (-0.5 + pos[0]) * scale;
      let y = -(-0.5 + pos[1]) * scale;
      particles[i] = new Particle(x, y);
    }
  }
  // 유효하지 않은 파티클(빈 줄로 인해 생성된)을 제거
  particles = particles.filter(p => p !== undefined);
  numParticles = particles.length;
}

function setParticlesFromTxt() {
    let filename = fileIndex + ".txt";
    let filePath = filename; // dataPath(filename) 대신
    if (fileIndex < maxFiles) {
        loadTxt(filePath);
        fileIndex++; // 다음 파일로 이동
    } else {
        isReturn = true;
        fileIndex = 0;
    }
}

function preload() {
    for (let i = 0; i < maxFiles; i++) {
        // 파일 이름이 0.txt, 1.txt... 라고 가정
        let filename = i + ".txt";
        // 'data' 폴더 안의 파일을 로드하도록 경로 지정
        particleData[i] = loadStrings("data/" + filename);
    }
}
//function scaling(input, scale) {
//  input.x = (-0.5 + input.x) * scale;
//  input.y = -(-0.5 + input.y) * scale;
//  return input;
//}

function loadTxt(link) {
    let lines = loadStrings(link);
    let pos = new Array(lines.length);
    numParticles = lines.length;
    for (let i = 0; i < lines.length; i++) {
        pos[i] = lines[i].split(" ").map(Number);
        pos[i][0] = (-0.5 + pos[i][0]) * scale;
        pos[i][1] = -(-0.5 + pos[i][1]) * scale;

        particles[i] = new Particle(pos[i][0], pos[i][1]);
    }
}

// 스무딩 함수 k(s)
function k(s) {
    return max(0, pow((1 - s * s), 3));  // 스무딩 커널 함수
}

// 밀도 계산 -----------------------------
function calculateDensity(v) { // particle 밀도 계산.
    let density = 0;
    for (let pj of particles) {
        let d = p5.Vector.dist(v, pj.position);
        if (d <= R && d >= 0.01) { // && 자기 자신 제외
            density += densityFunc(d, r); //서치 거리안에 들어오면 밀도 커널 계산
        }
    }
    return density;
}

function densityFunc(distance, h) {//로우 커널
    let density = 1 - (pow(distance, 2) / pow(h, 2));
    return max(density, 0);
}
//노말 계산 --------------------------------
function calculateNormal(v) {
    let normal = createVector(0, 0);

    for (let pj of particles) {
        let d = p5.Vector.dist(v, pj.position);

        if (d <= gridSize * 1.5) {
            // 현재 파티클 위치와 계산하려는 위치(v) 사이의 상대적인 벡터
            let relativePos = p5.Vector.sub(pj.position, v);
            let val = kGrad(d, relativePos); // 상대 위치 사용
            normal.add(val);
        }
    }

    normal.normalize(); // 정규화

    return normal;
}

function kGrad(dist, relativePos) {
    let coeff = 3.0 / (4.0 * PI * pow(R / 2, 4));
    let q = dist / (R / 2); // 반지름의 절반으로 나눔

    // 상대 위치로 그라디언트 설정
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

// 레벨셋 계산 -----------------------------------
function setLevelset(R, r) {
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            fill(255);

            let currentGrid = grid[x][y];
            // 분모 계산
            let wiDenominator = 0;
            for (let pj of currentGrid.nearbyParticles) {
                let distVal = dist(currentGrid.x, currentGrid.y, pj.position.x, pj.position.y);
                wiDenominator += k(distVal / R);  // wi 분모 계산
            }
            currentGrid.wSum = wiDenominator;
            let wSumZero = (wiDenominator === 0);
            // 평균 위치 계산
            calculateAveragePosition(currentGrid, R, wSumZero);
            // 현재 그리드에서 필드값 계산.
            currentGrid.field = 0;
            let d = dist(currentGrid.avg.x, currentGrid.avg.y, currentGrid.x, currentGrid.y);
            if (d <= 0.00001) {
                currentGrid.field = r / 2;  // 작은 양수 값으로 처리
            } else {
                currentGrid.field = d - r / 2;
            }
        }
    }
}

// 인접 입자 가중치 분모 계산
function calculateWeightDenominator(currentGrid, R) {
    let wiDenominator = 0;
    for (let pj of currentGrid.nearbyParticles) {
        let distVal = dist(currentGrid.x, currentGrid.y, pj.position.x, pj.position.y);
        wiDenominator += k(distVal / R);  // wi 분모 계산
    }
    return wiDenominator;
}

// 평균 위치 계산
function calculateAveragePosition(currentGrid, R, wSumZero) {
    currentGrid.avg = createVector(0, 0);
    if (!wSumZero) {
        for (let pj of currentGrid.nearbyParticles) {
            let distance = dist(currentGrid.x, currentGrid.y, pj.position.x, pj.position.y);
            pj.wi = k(distance / R) / currentGrid.wSum;  // 가중치 계산
            currentGrid.avg.x += pj.position.x * pj.wi;
            currentGrid.avg.y += pj.position.y * pj.wi;
        }
    } else {
        currentGrid.avg.x = currentGrid.x;
        currentGrid.avg.y = currentGrid.y;
    }
}

// Interpolation 계산 -----------------------
function itrp(p0, p1, v0, v1) { // 보간
    //println(v1,v0);

    if (v0 === 0) {
        return p0;
    }
    if (v1 === 0) {
        return p1;
    }
    if (abs(v1 - v0) < 0.00001) { // abs꼭 씌워줘야함 아니면 음수값 잘못 나옴!
        return p1;
    } else {
        let mu = (0 - v0) / (v1 - v0);
        return createVector(p0.x + mu * (p1.x - p0.x), p0.y + mu * (p1.y - p0.y));
    }
}
function drawLine(v1, v2) {
    line(v1.x, v1.y, v2.x, v2.y);
}