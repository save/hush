import * as React from 'react';

/*
 * The backdrop: a slow, flowing gradient, ordered-dithered (8×8 Bayer)
 * with moving grain, rendered at half resolution and scaled up pixelated,
 * so it reads as a noisy dither print rather than a smooth gradient.
 *
 * It loads loud (faster, hotter, more colour) and settles in ~3s.
 * Slow ambient motion keeps running under prefers-reduced-motion (that
 * setting is often on system-wide); only the loud intro and the speed drop.
 */

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 r;        // canvas size in dither cells
uniform float t;
uniform float calm;
uniform vec2 m;        // pointer, in p space
uniform float mOn;
uniform float glowY;   // where the light pools (p space, y)

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(.5, a.y * .75))); }
float bayer4(vec2 a){ return bayer2(.5 * a) * .25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(.5 * a) * .25 + bayer2(a); }

void main(){
  vec2 p = (gl_FragCoord.xy - .5 * r) / r.y;
  float c = smoothstep(0., 1., calm);
  float tt = t * mix(.5, .11, c);

  // flowing field: a couple of warped sines, cheap and smooth
  vec2 q = p * 1.35;
  q += .32 * vec2(sin(q.y * 2.1 + tt * 1.3), cos(q.x * 1.8 - tt * 1.1));
  q += .18 * vec2(sin(q.y * 3.7 - tt * .9), cos(q.x * 3.1 + tt * .7));
  float field = .5 + .5 * sin(q.x * 1.7 + tt) * cos(q.y * 2.2 - tt * .8);

  // the light: a wide pool that drifts along the bottom, plus the pointer
  vec2 g = vec2(.38 * sin(tt * .6), glowY + .06 * cos(tt * .8));
  float pool = exp(-dot((p - g) * vec2(.75, 1.5), (p - g) * vec2(.75, 1.5)) * 1.7);
  float cursor = exp(-dot(p - m, p - m) * 7.) * mOn * .35;

  float v = (pool * (.5 + .55 * field) + field * .06 + cursor) * .82;
  v *= mix(1.25, 1., c);

  // palette: ink → graphite → hush red → warm white, sparingly
  vec3 ink = vec3(.004, .004, .006);
  vec3 graphite = vec3(.075, .03, .032);   // a deep oxblood, not grey
  vec3 red = vec3(.86, .27, .21);
  vec3 cream = vec3(1., .88, .78);
  vec3 col = mix(ink, graphite, smoothstep(.05, .45, v));
  col = mix(col, red * .85, smoothstep(.45, .95, v) * mix(.9, .72, c));
  col = mix(col, cream, smoothstep(1., 1.35, v) * .6);

  // loud: a shifting rainbow under everything while it settles
  vec3 loud = .5 + .5 * cos(6.2831 * (field + vec3(0., .33, .67) + tt * .3));
  col = mix(col, loud * (.25 + v), (1. - c) * .75);

  // keep the headline area quiet
  float hush = smoothstep(.0, .55, length((p - vec2(0., .14)) * vec2(.7, 1.6)));
  col *= mix(.35, 1., hush);

  // ordered dither + moving grain, quantised to a few levels per channel
  float L = 7.;
  float d = bayer8(gl_FragCoord.xy) - .5;
  float n = h(gl_FragCoord.xy + floor(t * 24.)) - .5;
  // dither only where there's light; true black stays black, no grey snow
  float lum = max(col.r, max(col.g, col.b));
  float amt = smoothstep(.015, .09, lum);
  col = floor(col * L + (d + n * .22) * amt + .5) / L;

  gl_FragColor = vec4(col, 1.);
}`;

export function Shader({ className, startCalm = false, glowY = -0.5, cell = 2 }: { className?: string; startCalm?: boolean; glowY?: number; cell?: number }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) { canvas.style.background = '#0a0a0c'; return; }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.background = '#0a0a0c'; return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (k: string) => gl.getUniformLocation(prog, k);
    const uR = u('r'), uT = u('t'), uC = u('calm'), uM = u('m'), uMOn = u('mOn'), uG = u('glowY');
    gl.uniform1f(uG, glowY);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // one canvas pixel per dither cell; the browser scales it up crisp
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth / cell));
      const hh = Math.max(1, Math.round(canvas.clientHeight / cell));
      if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
      gl.viewport(0, 0, w, hh);
      gl.uniform2f(uR, w, hh);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const mouse = { x: 0, y: -0.3, tx: 0, ty: -0.3, on: 0, ton: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - rect.left - rect.width / 2) / rect.height;
      mouse.ty = -(e.clientY - rect.top - rect.height / 2) / rect.height;
      mouse.ton = e.clientY < rect.bottom && e.clientY > rect.top ? 1 : 0;
    };
    addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); });
    io.observe(canvas);

    const start = performance.now();
    const seed = Math.random() * 100;
    let raf = 0;
      const draw = (now: number) => {
      const s = (now - start) / 1000;
      const k = startCalm || reduced ? 1 : Math.min(1, Math.max(0, (s - 0.8) / 3));
      const calm = 1 - Math.pow(1 - k, 3);
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      mouse.on += (mouse.ton - mouse.on) * 0.04;
      gl.uniform1f(uT, seed + s * (reduced ? 0.5 : 1));
      gl.uniform1f(uC, calm);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.uniform1f(uMOn, mouse.on);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = () => {
      cancelAnimationFrame(raf);
      const tick = (now: number) => {
        if (!visible || document.hidden) return;
        draw(now);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => { if (!document.hidden) loop(); };
    document.addEventListener('visibilitychange', onVis);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      // no loseContext(): StrictMode's re-run of this effect would get a dead context back
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [startCalm, glowY, cell]);

  return <canvas ref={ref} className={className} style={{ imageRendering: 'pixelated' }} aria-hidden="true" />;
}
