// P5.js의 기본 구조: setup() 함수와 draw() 함수

// setup() 함수는 스케치가 시작될 때 단 한 번만 실행됩니다.
// 캔버스 크기 설정 등 초기 환경 설정을 이곳에서 합니다.
function setup() {
  // 브라우저 창 크기에 맞는 캔버스를 생성합니다.
  createCanvas(windowWidth, windowHeight);
  console.log("P5.js setup complete!");
}

// draw() 함수는 setup()이 끝난 후, 프로그램이 종료되기 전까지 계속해서 반복 실행됩니다.
// 애니메이션과 같이 움직이는 요소를 이곳에서 그립니다.
function draw() {
  // 매 프레임마다 배경을 회색(220)으로 칠합니다.
  background(220);

  // 마우스 위치에 원 그리기 (테스트용)
  fill(255, 0, 0); // 원의 채우기 색 (빨강)
  noStroke(); // 원의 테두리 없음
  ellipse(mouseX, mouseY, 50, 50); // 마우스 X, Y 위치에 50x50 크기의 원을 그립니다.
}

// 브라우저 창 크기가 변경될 때마다 캔버스 크기를 다시 조절하는 함수
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}