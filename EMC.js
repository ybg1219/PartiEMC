class EMC extends MC {
    // MC 클래스를 상속받습니다.

    constructor() {
        super(); // 부모 클래스(MC)의 생성자를 호출합니다.
    }

    // EMC 실행 함수
    excute() {
        // this.i, this.j는 부모 클래스 MC에서 상속받아 사용합니다.
        for (this.i = 0; this.i < cols; this.i++) {
            for (this.j = 0; this.j < rows; this.j++) {

                let currentGrid = grid[this.i][this.j];
                if (currentGrid.intersectionBit === 0) continue;

                this.gridPos.set(this.i, this.j);
                this.setNormals(); // 법선 벡터 계산

                // emcTable을 기반으로 삼각형을 그립니다.
                let intersectionBit = currentGrid.intersectionBit;
                for (let k = 0; k < 6; k += 3) {
                    let index0 = emcTable[intersectionBit][k];
                    let index1 = emcTable[intersectionBit][k + 1];
                    let index2 = emcTable[intersectionBit][k + 2];

                    if (index0 === -1) break;

                    // 가장 먼 입자를 찾아 새로운 정점(finalPoints[8])으로 설정
                    currentGrid.finalPoints[8] = this.calculateIntersection(currentGrid, index1, index2);

                    fill(0, 50, 150, 150); // 파란색
                    this.drawTri(currentGrid.finalPoints[index0], currentGrid.finalPoints[index1], currentGrid.finalPoints[index2]);
                    emcTriangleCount++;
                }
            }
        }
    }

    // 주변 파티클들의 법선 벡터 평균 계산
    calcNBNormal(nbParticles, pos) {
        let d = gridSize * 0.5;
        let n = createVector(0, 0);
        for (let pj of nbParticles) {
            if (dist(pos.x, pos.y, pj.position.x, pj.position.y) <= d) {
                n.add(pj.normal);
            }
        }
        n.normalize();
        return n;
    }

    // 교차점(itrp)에서의 법선 벡터 계산
    setNormals() {
        let currentGrid = grid[this.i][this.j];
        for (let k = 0; k < 4; k++) {
            currentGrid.normals[k] = createVector(0, 0);
            if ((currentGrid.edgeBits & (1 << (3 - k))) !== 0) {
                let d = gridSize;
                let n = createVector(0, 0);
                for (let pj of currentGrid.nearbyParticles) {
                    if (dist(currentGrid.itrps[k].x, currentGrid.itrps[k].y, pj.position.x, pj.position.y) <= d) {
                        n.add(pj.normal);
                    }
                }
                currentGrid.normals[k] = n.normalize();
            }
        }
    }

    // EMC의 핵심: 가상 평면 투영으로 새로운 교점 계산
    calculateIntersection(current, index1, index2) {
        let maxDist = 0;

        // 두 법선의 평균으로 가상 평면의 법선 벡터 계산
        let n = p5.Vector.div(p5.Vector.add(current.normals[index1 - 4], current.normals[index2 - 4]), 2);
        // 두 교점의 평균으로 가상 평면의 중심점 계산
        let itrpCenter = p5.Vector.div(p5.Vector.add(current.finalPoints[index1], current.finalPoints[index2]), 2);

        // 가장 멀리 있는 파티클을 찾기 위한 초기화
        let far = new Particle(itrpCenter.x, itrpCenter.y);

        for (let pj of current.nearbyParticles) {
            let projDist = this.projection(n, itrpCenter, pj.position);

            // 유효성 검사 (원본 코드의 논리 오류 수정: && -> ||)
            if (projDist < 0 || projDist > gridSize) continue;
            if (p5.Vector.dist(pj.position, itrpCenter) > gridSize) continue;

            if (maxDist < projDist) {
                maxDist = projDist;
                far = pj;
            }
        }
        return far.position;
    }

    // 투영 거리 계산
    projection(n, p, q) {
        n.normalize();
        let pToq = p5.Vector.sub(q, p);
        return n.dot(pToq);
    }
}