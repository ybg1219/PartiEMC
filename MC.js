// =======================================================
// MC Class
// =======================================================
class MC {
    constructor() {
        this.quadMap = [];
        this.gridPos = createVector(0, 0);
        this.quadSize = createVector(1, 0);
        this.i = 0;
        this.j = 0;
    }

    excute() {
        this.quadMap = Array.from({ length: cols + 1 }, () => new Array(rows + 1).fill(false));

        for (this.i = 0; this.i < cols; this.i++) {
            for (this.j = 0; this.j < rows; this.j++) {
                this.setInsBits();
                if (grid[this.i][this.j].intersectionBit === 15) {
                    this.quadMap[this.i][this.j] = true;
                }
            }
        }

        for (this.i = 0; this.i < cols; this.i++) {
            for (this.j = 0; this.j < rows; this.j++) {
                if (grid[this.i][this.j].intersectionBit === 0) continue;

                grid[this.i][this.j].edgeBits = EdgeTable[grid[this.i][this.j].intersectionBit];
                this.gridPos.set(this.i, this.j);

                if (this.greedyMeshing()) continue;

                this.setItrps();

                for (let k = 0; k < 4; k++) {
                    let cornerVec = CornerTable[k];
                    grid[this.i][this.j].finalPoints[k] = createVector(
                        grid[this.i][this.j].x + cornerVec.x * gridSize,
                        grid[this.i][this.j].y + cornerVec.y * gridSize
                    );
                }

                for (let k = 4; k < 8; k++) {
                    grid[this.i][this.j].finalPoints[k] = grid[this.i][this.j].itrps[k - 4];
                }

                this.drawMC(grid[this.i][this.j].finalPoints);
            }
        }
    }

    drawMC(finalPoints) {
        fill(0, 50, 150, 150);
        let intersectionBit = grid[this.i][this.j].intersectionBit;
        for (let k = 0; k < 9; k += 3) {
            let index0 = TriangleTable[intersectionBit][k];
            let index1 = TriangleTable[intersectionBit][k + 1];
            let index2 = TriangleTable[intersectionBit][k + 2];

            if (index0 === -1) break;

            this.drawTri(finalPoints[index0], finalPoints[index1], finalPoints[index2]);
            triangleCount++;
            mcTriangleCount++;
        }
    }

    setInsBits() {
        let currentGrid = grid[this.i][this.j];
        currentGrid.intersectionBit = 0;

        for (let d = 0; d < 4; d++) {
            let cornerVec = CornerTable[d];
            currentGrid.densities[d] = grid[this.i + cornerVec.x][this.j + cornerVec.y].field;
        }

        for (let d = 0; d < 4; d++) {
            if (currentGrid.densities[d] < 0) {
                currentGrid.intersectionBit |= 1 << (3 - d);
            }
        }
    }

    setItrps() {
        let currentGrid = grid[this.i][this.j];
        for (let k = 0; k < 4; k++) {
            currentGrid.itrps[k] = createVector(0, 0);
            if ((currentGrid.edgeBits & (1 << (3 - k))) !== 0) {
                let edgeCorner1 = CornerTable[CornerofEdgeTable[k][0]];
                let edgeCorner2 = CornerTable[CornerofEdgeTable[k][1]];

                let edge0 = createVector(currentGrid.x, currentGrid.y);
                edge0.add(p5.Vector.mult(edgeCorner1, gridSize));

                let edge1 = createVector(currentGrid.x, currentGrid.y);
                edge1.add(p5.Vector.mult(edgeCorner2, gridSize));

                let v0 = currentGrid.densities[CornerofEdgeTable[k][0]];
                let v1 = currentGrid.densities[CornerofEdgeTable[k][1]];

                currentGrid.itrps[k] = itrp(edge0, edge1, v0, v1);
            }
        }
    }

    greedyMeshing() {
        if (grid[this.i][this.j].intersectionBit === 15) {
            if (!this.quadMap[this.i][this.j]) return true;
            this.quadSize.set(1, 0);
            this.calculateQuadSize();
            this.drawQuad();
            return true;
        }
        return false;
    }

    calculateQuadSize() {
        fill(0, 50, 150, 150);
        // 높이 계산
        for (let dy = this.j; dy < rows; dy++) {
            if (!this.quadMap[this.i][dy]) {
                break;
            }
            this.quadSize.y++;
        }

        // 넓이 계산
        let done = false;
        for (let dx = this.i + 1; dx < cols; dx++) {
            for (let dy = this.j; dy < this.j + this.quadSize.y && dy < rows; dy++) {
                if (!this.quadMap[dx][dy]) {
                    done = true;
                    break;
                }
            }
            if (done) break;
            this.quadSize.x++;
        }

        // 사용한 quadMap 삭제
        for (let dx = this.i; dx < this.i + this.quadSize.x; dx++) {
            for (let dy = this.j; dy < this.j + this.quadSize.y; dy++) {
                this.quadMap[dx][dy] = false;
            }
        }
    }

    drawQuad() {
        let quad = new Array(4);
        for (let n = 0; n < 4; n++) {
            let cornerVec = CornerTable[n];
            quad[n] = createVector(
                grid[this.i][this.j].x + cornerVec.x * gridSize * this.quadSize.x,
                grid[this.i][this.j].y + cornerVec.y * gridSize * this.quadSize.y
            );
        }

        let intersectionBit = 15;
        for (let k = 0; k < 6; k += 3) {
            let index0 = TriangleTable[intersectionBit][k];
            let index1 = TriangleTable[intersectionBit][k + 1];
            let index2 = TriangleTable[intersectionBit][k + 2];

            this.drawTri(quad[index0], quad[index1], quad[index2]);
            triangleCount += this.quadSize.x * this.quadSize.y;
            mcTriangleCount++;
        }
    }

    drawTri(v0, v1, v2) {
        stroke(0);
        triangle(v0.x, v0.y, v1.x, v1.y, v2.x, v2.y);
    }
}
// =======================================================
// Marching Cubes Lookup Tables
// =======================================================

const EdgeTable = [
    0, 3, 6, 5, 12, 15, 10, 9, 9, 10, 15, 12, 5, 6, 3, 0
];

const TriangleTable = [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 7, 6, -1, -1, -1, -1, -1, -1],
    [2, 6, 5, -1, -1, -1, -1, -1, -1],
    [3, 7, 5, 3, 5, 2, -1, -1, -1],
    [4, 1, 5, -1, -1, -1, -1, -1, -1],
    [4, 1, 5, 3, 7, 6, -1, -1, -1],
    [6, 4, 1, 6, 1, 2, -1, -1, -1],
    [2, 3, 7, 2, 7, 4, 2, 4, 1],
    [7, 0, 4, -1, -1, -1, -1, -1, -1],
    [3, 0, 4, 3, 4, 6, -1, -1, -1],
    [7, 0, 4, 2, 6, 5, -1, -1, -1],
    [3, 0, 4, 3, 4, 5, 3, 5, 2],
    [7, 0, 1, 7, 1, 5, -1, -1, -1],
    [0, 1, 5, 0, 5, 6, 0, 6, 3],
    [1, 2, 6, 1, 6, 7, 1, 7, 0],
    [3, 0, 2, 2, 0, 1, -1, -1, -1]
];

const emcTable = [
    [-1, -1, -1, -1, -1, -1],
    [8, 7, 6, -1, -1, -1],
    [8, 6, 5, -1, -1, -1],
    [8, 7, 5, -1, -1, -1],
    [8, 4, 5, -1, -1, -1],
    [8, 7, 6, 8, 4, 5],
    [8, 4, 6, -1, -1, -1],
    [8, 7, 4, -1, -1, -1],
    [8, 7, 4, -1, -1, -1],
    [8, 4, 6, -1, -1, -1],
    [8, 7, 4, 8, 5, 6],
    [8, 4, 5, -1, -1, -1],
    [8, 7, 5, -1, -1, -1],
    [8, 5, 6, -1, -1, -1],
    [8, 7, 6, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1]
];
