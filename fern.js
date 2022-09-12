"use strict";

window.addEventListener("load", function () {
    let canv, ctx; // canvas and context
    let fgCanv, fgCtx;
    let maxx, maxy; // canvas dimensions
    let fern;
    let controls = true;

    const captureRadius = 10;

    // for animation
    let events;

    // shortcuts for Math.
    const mrandom = Math.random;
    const mfloor = Math.floor;
    const mround = Math.round;
    const mceil = Math.ceil;
    const mabs = Math.abs;
    const mmin = Math.min;
    const mmax = Math.max;

    const mPI = Math.PI;
    const mPIS2 = Math.PI / 2;
    const mPIS3 = Math.PI / 3;
    const m2PI = Math.PI * 2;
    const m2PIS3 = (Math.PI * 2) / 3;
    const msin = Math.sin;
    const mcos = Math.cos;
    const matan2 = Math.atan2;

    const mhypot = Math.hypot;
    const msqrt = Math.sqrt;

    const rac3 = msqrt(3);
    const rac3s2 = rac3 / 2;

    //------------------------------------------------------------------------

    function alea(mini, maxi) {
        // random number in given range

        if (typeof maxi == "undefined") return mini * mrandom(); // range 0..mini

        return mini + mrandom() * (maxi - mini); // range mini..maxi
    }
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    function randomSign() {
        // -1 or +1
        return mrandom > 0.5 ? -1 : 1;
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function intAlea(mini, maxi) {
        // random integer in given range (mini..maxi - 1 or 0..mini - 1)
        //
        if (typeof maxi == "undefined") return mfloor(mini * mrandom()); // range 0..mini - 1
        return mini + mfloor(mrandom() * (maxi - mini)); // range mini .. maxi - 1
    }

    //------------------------------------------------------------------------
    function drawFigure(point, figureIndex, color, lineWidth) {
        fgCtx.beginPath();
        fgCtx.strokeStyle = color;
        fgCtx.lineWidth = lineWidth;
        switch (figureIndex) {
            case 0: // cross
                fgCtx.moveTo(point.x - 3, point.y);
                fgCtx.lineTo(point.x + 3, point.y);
                fgCtx.moveTo(point.x, point.y - 3);
                fgCtx.lineTo(point.x, point.y + 3);
                break;
            case 1: // x
                fgCtx.moveTo(point.x - 2, point.y - 2);
                fgCtx.lineTo(point.x + 2, point.y + 2);
                fgCtx.moveTo(point.x - 2, point.y + 2);
                fgCtx.lineTo(point.x + 2, point.y - 2);
                break;
            case 2: // o
                fgCtx.arc(point.x, point.y, 2, 0, m2PI);
                break;
        }
        fgCtx.stroke();
    } // drawFigure

    //------------------------------------------------------------------------
    // POINT
    //------------------------------------------------------------------------
    // class Point
    function Point(x, y) {
        this.x = x;
        this.y = y;
    } // function Point

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    Point.prototype.draw = function (color) {
        // hope this.index has been defined!
        // black background (thick line)
        drawFigure(this, this.index, "rgba(0, 0, 0, 0.0)", 4);
        // colored drawing (thin line)
        drawFigure(this, this.index, color, 2);
    }; // Point.prototype.draw

    //------------------------------------------------------------------------
    // TRIANGLE
    //------------------------------------------------------------------------

    // class Triangle

    // given array of 3 points
    // /!\ : vertices order MATTERS

    function Triangle(vertices, color) {
        this.vertices = vertices;
        // since here a point cannot belong to more than one triangle, we can create a backlink :
        vertices.forEach((vertex, k) => {
            vertex.triangle = this;
            vertex.index = k;
        }); // vertices.forEach
        this.color = color; // will be used for drawing
    } // Triangle

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Triangle.prototype.surface = function () {
        const [v0, v1, v2] = this.vertices;

        return (
            0.5 *
            mabs(
                v1.x * v0.y -
                    v0.x * v1.y +
                    v2.x * v1.y -
                    v1.x * v2.y +
                    v0.x * v2.y -
                    v2.x * v0.y
            )
        );
    }; // surface
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    Triangle.prototype.draw = function () {
        fgCtx.beginPath();
        fgCtx.strokeStyle = this.color;
        fgCtx.lineWidth = 1; // thin line;
        fgCtx.moveTo(this.vertices[0].x, this.vertices[0].y);
        fgCtx.lineTo(this.vertices[1].x, this.vertices[1].y);
        fgCtx.lineTo(this.vertices[2].x, this.vertices[2].y);
        fgCtx.closePath();
        fgCtx.stroke();
        this.vertices.forEach((vertex) => vertex.draw(this.color));
    }; // Triangle.prototype.draw

    //------------------------------------------------------------------------
    //------------------------------------------------------------------------
    function transform(a, b, c, d, e, f) {
        return function (x, y) {
            return [a * x + b * y + c, d * x + e * y + f];
        };
    }

    //------------------------------------------------------------------------
    // FERN
    //------------------------------------------------------------------------
    function Fern() {
        // created with default triangles, based on current screen size
        let ywRatio = alea(1.5, 2.0); // overall proportions height / width
        let height, width;
        if (ywRatio > maxy / maxx) {
            height = 0.95 * maxy;
            width = height / ywRatio;
        } else {
            width = 0.95 * maxx;
            height = width * ywRatio;
        }

        let offsx = (maxx - width) / 2;
        let offsy = (maxy - height) / 2;

        // colors for triangles

        this.colors = ["#0f0", "#f80", "#0ff", "#ff0", "#80f"];
        // "global" triangle
        let p0 = new Point(offsx, offsy + height); // bottom left
        let p1 = new Point(offsx + width, offsy + height); // bottom right
        let p2 = new Point(offsx + width * alea(0.5 - 0.1, 0.5 + 0.1), offsy); // top
        this.primary = new Triangle([p0, p1, p2], this.colors[0]);
        //  this.primary.draw();
        // vertices of other triangles will be defined using p0p1 and p0p2 as a base
        let base = [
            new Point(p1.x - p0.x, p1.y - p0.y),
            new Point(p2.x - p0.x, p2.y - p0.y),
        ]; // vertors rather than points, but who cares ?

        // lower left leaflet
        this.tri1 = new Triangle(
            [
                basedPoint((1 - 0.01) / 2, 0.01),
                basedPoint((1 - 0.11) / 2, 0.11),
                basedPoint(0, 0.08),
            ],
            this.colors[1]
        );

        // lower rightleaflet
        this.tri2 = new Triangle(
            [
                basedPoint((1 - 0.02) / 2 - 0.005, 0.02),
                basedPoint((1 - 0.12) / 2 - 0.005, 0.12),
                basedPoint(1 - 0.09, 0.09),
            ],
            this.colors[2]
        );

        // stem
        this.tri3 = new Triangle(
            [
                basedPoint(0.495, 0),
                basedPoint(0.505, 0),
                basedPoint((1 - 0.14) / 2, 0.14),
            ],
            this.colors[3]
        );

        // reduced copy
        this.tri4 = new Triangle(
            [
                basedPoint(0.01, 0.09),
                basedPoint(1 - 0.09 - 0.01, 0.08),
                basedPoint(1 - 0.998 + 0.05, 0.998),
            ],
            this.colors[4]
        );

        this.triangles = [this.tri1, this.tri2, this.tri3, this.tri4];
        this.allTriangles = [this.primary, ...this.triangles];

        function basedPoint(c1, c2) {
            // returns point at p0 + c1 * base[0] + c2 * base[1]
            // point is inside base triangle if c1 >= 0, c2 >= 0 AND c1 + c2 <= 1

            return new Point(
                p0.x + c1 * base[0].x + c2 * base[1].x,
                p0.y + c1 * base[0].y + c2 * base[1].y
            );
        } // basedPoint
    } // Fern

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Fern.prototype.draw = function () {
        fgCtx.clearRect(0, 0, maxx, maxy);
        this.allTriangles.forEach((tri) => tri.draw());
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Fern.prototype.closestPoint = function (event) {
        /* mouse position given in event
  returns a distance and a point
*/

        let minDist = 1e9; // distance of closest point
        let p; // closest point
        let dist;

        this.allTriangles.forEach((triangle) => {
            triangle.vertices.forEach((v) => {
                dist = mhypot(event.clientX - v.x, event.clientY - v.y);
                if (dist < minDist) {
                    minDist = dist;
                    p = v;
                }
            });
        });
        return { p, minDist };
    }; // closestPoint

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Fern.prototype.coeffsTransfo = function (tri1, tri2) {
        // returns coefficients for affine transformation which changes triangle tri1 into triangle tri2
        /* a,b,c,d,e, f satisfying :
  tri1.vertices[0].x * a + tri1.vertices[0].y * b + c = tri2.vertices [0].x
  tri1.vertices[0].x * d + tri1.vertices[0].y * d + f = tri2.vertices [0].y
  (plus same for vertices[1] and vertices[2]
*/

        const [s0, s1, s2] = tri1.vertices;

        let det = det3(s0.x, s0.y, 1, s1.x, s1.y, 1, s2.x, s2.y, 1);
        let deta = det3(
            tri2.vertices[0].x,
            s0.y,
            1,
            tri2.vertices[1].x,
            s1.y,
            1,
            tri2.vertices[2].x,
            s2.y,
            1
        );
        let detb = det3(
            s0.x,
            tri2.vertices[0].x,
            1,
            s1.x,
            tri2.vertices[1].x,
            1,
            s2.x,
            tri2.vertices[2].x,
            1
        );
        let detc = det3(
            s0.x,
            s0.y,
            tri2.vertices[0].x,
            s1.x,
            s1.y,
            tri2.vertices[1].x,
            s2.x,
            s2.y,
            tri2.vertices[2].x
        );

        const a = deta / det;
        const b = detb / det;
        const c = detc / det;

        let detd = det3(
            tri2.vertices[0].y,
            s0.y,
            1,
            tri2.vertices[1].y,
            s1.y,
            1,
            tri2.vertices[2].y,
            s2.y,
            1
        );
        let dete = det3(
            s0.x,
            tri2.vertices[0].y,
            1,
            s1.x,
            tri2.vertices[1].y,
            1,
            s2.x,
            tri2.vertices[2].y,
            1
        );
        let detf = det3(
            s0.x,
            s0.y,
            tri2.vertices[0].y,
            s1.x,
            s1.y,
            tri2.vertices[1].y,
            s2.x,
            s2.y,
            tri2.vertices[2].y
        );

        return [
            deta / det,
            detb / det,
            detc / det,
            detd / det,
            dete / det,
            detf / det,
        ];
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Fern.prototype.transfos = function () {
        // calculates the 4 transformations to change this.primary into one of the 4 inner triangles
        // calculates propabilities associated

        this.t1 = transform(...this.coeffsTransfo(this.primary, this.tri1));
        this.t2 = transform(...this.coeffsTransfo(this.primary, this.tri2));
        this.t3 = transform(...this.coeffsTransfo(this.primary, this.tri3));
        this.t4 = transform(...this.coeffsTransfo(this.primary, this.tri4));
        /*
  const s0 = msqrt(this.tri1.surface());
  const s1 = msqrt(this.tri2.surface());
  const s2 = msqrt(this.tri3.surface());
  const s3 = msqrt(this.tri4.surface());
*/

        let s0 = this.tri1.surface();
        let s1 = this.tri2.surface();
        let s2 = this.tri3.surface();
        let s3 = this.tri4.surface();
        let sTot = s0 + s1 + s2 + s3;

        // avoid too little probabilities
        s0 = mmax(s0, sTot * 0.01);
        s1 = mmax(s1, sTot * 0.01);
        s2 = mmax(s2, sTot * 0.01);
        s3 = mmin(mmax(s3, sTot * 0.01), sTot * 0.5);
        sTot = s0 + s1 + s2 + s3;

        this.tbProbas = [s0 / sTot, s1 / sTot, s2 / sTot, s3 / sTot];
    }; // transfos
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    Fern.prototype.nextPt = function ([x, y]) {
        // picks random transformation with given probability table

        let rnd = Math.random();
        let f; // transformation
        if (rnd < this.tbProbas[0]) {
            f = this.t1;
        } else {
            rnd -= this.tbProbas[0];
            if (rnd < this.tbProbas[1]) {
                f = this.t2;
            } else {
                rnd -= this.tbProbas[1];
                if (rnd < this.tbProbas[2]) {
                    f = this.t3;
                } else {
                    f = this.t4;
                }
            }
        }
        return f(x, y);
    }; // Fern.prototype.nextPt

    //------------------------------------------------------------------------
    /* determinant of matrix, given by line
  a b c
  d e f
  g h i
*/

    function det3(a, b, c, d, e, f, g, h, i) {
        return i * (a * e - b * d) - f * (a * h - g * b) + c * (d * h - g * e);
    }

    //------------------------------------------------------------------------
    //------------------------------------------------------------------------

    let animate;

    {
        // scope for animate

        let animState = 0;
        let nbPts;
        let x, y; // current point
        let tEnd;
        let selectedPt;

        let animFernState = 0;

        animate = function (tStamp) {
            let event;
            let refresh;

            event = events.shift();
            if (event && event.nature == "reset") animState = 0;
            window.requestAnimationFrame(animate);

            switch (animState) {
                case 0:
                    if (startOver()) {
                        animState = 10;
                        fgCanv.style.cursor = "default";
                        animFernState = 1;
                        selectedPt = undefined;
                    }
                    break;

                case 10:
                    if (!event) break;
                    if (
                        event.nature == "mousedown" &&
                        event.event.buttons == 1 &&
                        selectedPt
                    ) {
                        fgCanv.style.cursor = "move";
                        animState = 15;
                        break;
                    }
                    if (event.nature !== "mousemove") break; // don't care
                    refresh = false;
                    let npt = fern.closestPoint(event.event);
                    if (npt.minDist < captureRadius) {
                        // close to one point
                        if (!selectedPt || selectedPt != npt.p) {
                            selectedPt = npt.p;
                            refresh = true;
                            fgCanv.style.cursor = "pointer";
                        }
                    } else {
                        // no close point
                        if (selectedPt) {
                            selectedPt = undefined;
                            refresh = true;
                            fgCanv.style.cursor = "default";
                        }
                    }
                    if (refresh) {
                        fern.draw();
                        if (selectedPt) selectedPt.draw("#f00");
                    }
                    break;

                case 15: // begin moving selectedPoint
                    if (!event) break;
                    if (
                        (event.event &&
                            typeof event.event.buttons != "undefined" &&
                            event.event.buttons != 1) ||
                        event.nature == "mouseleave"
                    ) {
                        animState = 10; // back to waiting state
                        selectedPt = undefined;
                        refresh = true;
                        fgCanv.style.cursor = "default";
                        break;
                    }
                    if (event.nature !== "mousemove") break;
                    selectedPt.x = event.event.clientX;
                    selectedPt.y = event.event.clientY;
                    fern.draw();
                    selectedPt.draw("#f00");
                    fern.transfos();
                    animFernState = 1; // restart fern drawing
            } // switch animState

            switch (animFernState) {
                case 0:
                    break; // waiting

                case 1: // (re-)starting
                    ctx.fillStyle = "rgba(0,0,0,0.0)";
                    ctx.fillRect(0, 0, maxx, maxy);
                    nbPts = 0;
                    // initial point : middle of base
                    x =
                        (fern.primary.vertices[0].x +
                            fern.primary.vertices[1].x) /
                        2;
                    y =
                        (fern.primary.vertices[0].y +
                            fern.primary.vertices[1].y) /
                        2;
                    ++animFernState;

                case 2: // drawing
                    tEnd = performance.now() + 10;
                    while (performance.now() < tEnd) {
                        ctx.fillStyle = `hsl(${alea(90, 150)},${intAlea(
                            70,
                            100
                        )}%,${intAlea(20, 80)}%)`;
                        ctx.fillRect(x, y, 0.5, 0.5);
                        [x, y] = fern.nextPt([x, y]);

                        if (++nbPts > 1000000) {
                            ++animFernState; // stop drawing fern
                            break;
                        }
                    } // while
            } // switch animFernState
        }; // animate
    } // scope for animate

    //------------------------------------------------------------------------
    //------------------------------------------------------------------------

    function startOver() {
        let offsx, offsy;

        // canvas dimensions

        maxx = window.innerWidth;
        maxy = window.innerHeight;

        fgCanv.width = canv.width = maxx;
        fgCanv.height = canv.height = maxy;
        fgCtx.lineJoin = ctx.lineJoin = "bevel";
        fgCtx.lineCap = ctx.lineCap = "round";

        ctx.clearRect(0, 0, maxx, maxy);
        fgCtx.clearRect(0, 0, maxx, maxy);

        fern = new Fern();
        fern.draw();
        fern.transfos();

        return true;
    } // startOver

    //------------------------------------------------------------------------
    //------------------------------------------------------------------------

    function mouseDown(event) {
        events.push({ nature: "mousedown", event: event });
    } // mouseDown

    //------------------------------------------------------------------------

    function mouseMove(event) {
        // remove most recent event if it is already a "move"
        if (events.length && events[events.length - 1].nature == "mousemove")
            events.pop();

        events.push({ nature: "mousemove", event: event });
    } // mouseMove

    //------------------------------------------------------------------------

    function mouseUp(event) {
        events.push({ nature: "mouseup", event: event });
    } // mouseUp

    //------------------------------------------------------------------------

    function mouseLeave(event) {
        events.push({ nature: "leave" });
    } // mouseLeave

    //------------------------------------------------------------------------

    function toggleControls() {
        controls = !controls;
        fgCanv.style.zIndex = controls ? "1" : "-1";
    }
    //------------------------------------------------------------------------

    function windowResize(event) {
        //events.push({nature:'reset'});
    } // mouseClick

    //------------------------------------------------------------------------
    // beginning of execution

    {
        canv = document.createElement("canvas");
        canv.style.position = "absolute";
        canv.style.top = "0px";
        canv.style.left = "0px";
        document.body.appendChild(canv);
        ctx = canv.getContext("2d");
        canv.style.zIndex = 0;
    } // création CANVAS
    {
        fgCanv = document.createElement("canvas");
        fgCanv.style.position = "absolute";
        fgCanv.style.top = "0px";
        fgCanv.style.left = "0px";
        document.body.appendChild(fgCanv);
        fgCtx = fgCanv.getContext("2d");
    } // création CANVAS

    fgCanv.addEventListener("mousedown", mouseDown);
    fgCanv.addEventListener("mousemove", mouseMove);
    fgCanv.addEventListener("mouseup", mouseUp);
    fgCanv.addEventListener("mouseleave", mouseLeave);
    window.addEventListener("resize", windowResize);
    document
        .getElementById("controls")
        .addEventListener("click", toggleControls);
    events = [{ nature: "reset" }];
    requestAnimationFrame(animate);
}); // window load listener
