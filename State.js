const State = {
    config: {
        canvasWidth: 1024,
        canvasHeight: 1024,
        gridSize: 16,
        initialParticles: 1160,
        maxFiles: 1026,
        dataScaler: 800,
        defaultFrameRate: 24,
        defaultRadius: 200
    },
    // 실행 중 동적으로 바뀌는 상태 값 관리
    runtime: {
        currentFrame: 0,
        isPlaying: true,
        triangleCount: 0,
        mcTriangleCount: 0,
        emcTriangleCount: 0
    },
    // 입자, 격자, 커널 반경 등의 시뮬레이션 핵심 데이터 관리
    simulation: {
        particles: [],
        grid: [],
        cols: 0,
        rows: 0,
        R: 16,          // 스무딩 커널 반경 (Smoothing kernel radius)
        r: 8,           // 레벨셋 반경 (Levelset radius)
        shape: "circle" // SDF/SPH 기본 도형 모양
    },
    // p5.js DOM UI 엘리먼트 저장소
    ui: {
        speedSlider: null,
        pauseButton: null,
        prevFrameButton: null,
        nextFrameButton: null,
        saveButton: null,
        greedyMeshingCheckbox: null,
        mcCheckbox: null,
        emcCheckbox: null,
        sdfCheckbox: null,
        squareCheckbox: null,
        radiusSlider: null,
        showGridCheckbox: null,
        showFieldCheckbox: null,
        showNormalCheckbox: null,
        SPHCheckbox: null,
        showParticlesCheckbox: null,
        numParticlesSlider: null,
        showAvgPosCheckbox: null,
        showParticleNormalCheckbox: null,
        smoothingRadiusSlider: null,
        levelsetRadiusSlider: null,
        densityfieldCheckbox: null,
        densityDebugCheckbox: null
    }
};

