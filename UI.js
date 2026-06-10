const UI = {
    /**
     * UI 컴포넌트들을 생성하고 위치 및 이벤트를 설정합니다.
     * 점진적 리팩토링을 위해 State.ui 객체와 기존 전역 UI 변수들에 동시 할당합니다.
     * @param {Object} state - State.js의 State 객체
     */
    init(state) {
        // 1. 기본 컨트롤 (재생, 속도, 이전/다음 프레임 등)
        speedSlider = createSlider(1, 60, state.config.defaultFrameRate, 1);
        speedSlider.position(50, height + 20);
        state.ui.speedSlider = speedSlider;

        pauseButton = createButton('Pause');
        pauseButton.position(200, height + 20);
        pauseButton.mousePressed(togglePlay);
        state.ui.pauseButton = pauseButton;

        prevFrameButton = createButton('Prev Frame');
        prevFrameButton.position(550, height + 20);
        prevFrameButton.mousePressed(prevFrame);
        state.ui.prevFrameButton = prevFrameButton;

        nextFrameButton = createButton('Next Frame');
        nextFrameButton.position(650, height + 20);
        nextFrameButton.mousePressed(nextFrame);
        state.ui.nextFrameButton = nextFrameButton;

        saveButton = createButton('Save Result');
        saveButton.position(800, height + 20);
        saveButton.mousePressed(() => saveResult('result.txt', currentFrame));
        state.ui.saveButton = saveButton;
        
        greedyMeshingCheckbox = createCheckbox('Greedy Meshing', true);
        greedyMeshingCheckbox.position(width + 20, 80);
        state.ui.greedyMeshingCheckbox = greedyMeshingCheckbox;

        mcCheckbox = createCheckbox('Run MC', true);
        mcCheckbox.position(width + 20, 100);
        state.ui.mcCheckbox = mcCheckbox;

        emcCheckbox = createCheckbox('Run EMC', false);
        emcCheckbox.position(width + 20, 120);
        state.ui.emcCheckbox = emcCheckbox;

        // 2. SDF UI 요소 생성
        sdfCheckbox = createCheckbox('SDF mode', false);
        sdfCheckbox.position(width + 20, 180);
        state.ui.sdfCheckbox = sdfCheckbox;

        squareCheckbox = createCheckbox('Square shape', false);
        squareCheckbox.position(width + 20, 200);
        state.ui.squareCheckbox = squareCheckbox;

        text("Radius: ", width + 20, 215);
        radiusSlider = createSlider(10, 200, radius, 10);
        radiusSlider.position(width + 20, 220);
        radiusSlider.input(updateRadius);
        state.ui.radiusSlider = radiusSlider;

        // 3. 디스플레이/시각화 설정 체크박스들
        showGridCheckbox = createCheckbox('Show Grid', true);
        showGridCheckbox.position(width + 20, 240);
        state.ui.showGridCheckbox = showGridCheckbox;

        showFieldCheckbox = createCheckbox('Show Field', false);
        showFieldCheckbox.position(width + 20, 260);
        state.ui.showFieldCheckbox = showFieldCheckbox;

        showNormalCheckbox = createCheckbox('Show Normal', false);
        showNormalCheckbox.position(width + 20, 280);
        state.ui.showNormalCheckbox = showNormalCheckbox;
        
        // 4. SPH UI 요소 생성
        SPHCheckbox = createCheckbox('SPH mode', false);
        SPHCheckbox.position(width + 20, 320);
        SPHCheckbox.changed(onSPHModeChange);
        state.ui.SPHCheckbox = SPHCheckbox;

        showParticlesCheckbox = createCheckbox('Show Particles', false);
        showParticlesCheckbox.position(width + 20, 340);
        state.ui.showParticlesCheckbox = showParticlesCheckbox;

        numParticlesSlider = createSlider(100, 3000, numParticles, 10);
        numParticlesSlider.position(width + 20, 360);
        numParticlesSlider.input(updateParticleCount);
        state.ui.numParticlesSlider = numParticlesSlider;

        showAvgPosCheckbox = createCheckbox('Show Avg Position', false);
        showAvgPosCheckbox.position(width + 20, 380);
        state.ui.showAvgPosCheckbox = showAvgPosCheckbox;

        showParticleNormalCheckbox = createCheckbox('Show Particle Normal', false);
        showParticleNormalCheckbox.position(width + 20, 400);
        state.ui.showParticleNormalCheckbox = showParticleNormalCheckbox;

        smoothingRadiusSlider = createSlider(8, R*4, R, 4);
        smoothingRadiusSlider.position(width + 20, 500);
        state.ui.smoothingRadiusSlider = smoothingRadiusSlider;

        levelsetRadiusSlider = createSlider(8, r*2, r, 4);
        levelsetRadiusSlider.position(width + 20, 520);
        state.ui.levelsetRadiusSlider = levelsetRadiusSlider;

        densityfieldCheckbox = createCheckbox('Density Field', false);
        densityfieldCheckbox.position(width + 20, 540);
        state.ui.densityfieldCheckbox = densityfieldCheckbox;

        densityDebugCheckbox = createCheckbox('Density Debug', false);
        densityDebugCheckbox.position(width + 20, 560);
        state.ui.densityDebugCheckbox = densityDebugCheckbox;
    }
};
