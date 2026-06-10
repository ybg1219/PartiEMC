const State = {
    // 고정적인 시스템 설정 정보 (읽기 전용 상수)
    config: {
        canvasWidth: 1024,
        canvasHeight: 1024,
        gridSize: 16,            // 격자 크기 / Grid size
        maxFiles: 1026,          // 최대 파일 개수 / Max file count
        dataScaler: 800,         // 데이터 스케일러 / Data scaler
        defaultFrameRate: 24,
        defaultRadius: 200
    },
    // 실행 중 동적으로 바뀌는 상태 값 관리 (런타임 데이터)
    runtime: {
        currentFrame: 0, // 현재 프레임 / Current frame
        isPlaying: true, // 애니메이션 재생 상태 / Animation play state
        triangleCount: 0, // 총 삼각형 개수 / Total triangle count
        mcTriangleCount: 0, // MC 삼각형 개수 / MC triangle count
        emcTriangleCount: 0, // EMC 삼각형 개수 / EMC triangle count
        fileIndex: 0             // 파일 인덱스 / File index
    },
    // 입자, 격자, 커널 반경 등의 시뮬레이션 핵심 데이터 관리
    simulation: {
        particles: [], // Particle 객체 배열 / Particle array
        grid: [],      // 그리드 객체 배열 / Grid array
        cols: 0,       // 그리드 열 / Grid columns
        rows: 0,       // 그리드 행 / Grid rows
        R: 16,          // 스무딩 커널 반경 (Smoothing kernel radius)
        r: 8,           // 레벨셋 반경 (Levelset radius)
        shape: "circle", // 모양 정보 저장/ Shape info storage
        radius: 200,     // 현재 SDF 반경 / Current SDF radius
        numParticles: 1160,      // 입자 수 / Number of particles
        maxDensity: 0           // 최대 밀도 / Max density
    },
    // UI 관련 변수 / UI related variables
    ui: {
        lowDensityColor: null,  // 낮은 밀도일 때의 색상
        highDensityColor: null, // 높은 밀도일 때의 색상

        speedSlider: null,      // 프레임 속도 슬라이더 / Frame rate slider
        pauseButton: null,      // 일시정지/재생 버튼 / Pause/Play button
        showGridCheckbox: null, // 그리드 표시 체크박스 / Show grid checkbox
        showParticlesCheckbox: null, // 파티클 표시 체크박스 / Show particles checkbox
        prevFrameButton: null,  // 이전 프레임 버튼 / Previous frame button
        nextFrameButton: null,  // 다음 프레임 버튼 / Next frame button
        saveButton: null,       // 결과 저장 버튼 / Save result button

        showFieldCheckbox: null,           // 필드값 시각화 / Show field visualization
        showAvgPosCheckbox: null,          // 평균 위치 시각화 / Show average position visualization
        showNormalCheckbox: null,          // 노말 시각화 / Show normal visualization
        showParticleNormalCheckbox: null,  // 입자 노말 시각화 / Show particle normal visualization

        mcCheckbox: null,    // MC 실행 체크박스 / MC excute checkbox
        emcCheckbox: null,   // EMC 실행 체크박스 / EMC excute checkbox
        greedyMeshingCheckbox: null, // 그리디 메시징 체크박스 / Greedy meshing checkbox

        // SDF 관련 UI 변수 / SDF UI variables
        sdfCheckbox: null,      // SDF 모드 체크박스 / SDF mode checkbox
        squareCheckbox: null,   // 사각형 SDF 체크박스 / Square SDF checkbox
        radiusSlider: null,     // SDF 반경 슬라이더 / SDF radius slider

        // SPH 관련 UI 변수 / SPH UI variables
        SPHCheckbox: null,      // SPH mode checkbox
        numParticlesSlider: null, // 입자 수 슬라이더 / Number of particles slider
        smoothingRadiusSlider: null, // 스무딩 반경 슬라이더 / Smoothing radius slider
        levelsetRadiusSlider: null, // 레벨셋 반경 슬라이더 / Levelset radius slider

        densityfieldCheckbox: null, // 밀도 기반 필드 체크박스 / Density-based field checkbox
        densityDebugCheckbox: null // 밀도 디버그 체크박스 / Density debug checkbox
    }
};

// State.config를 동결하여 임의의 쓰기 동작을 차단하고 캡슐화합니다.
Object.freeze(State.config);
