import { BackSide, MeshStandardMaterial } from 'three'

/**
 * 종이 한 면의 재질.
 *
 * ShaderMaterial로 조명을 직접 계산하지 않고 MeshStandardMaterial에 정점 셰이더만
 * 주입한다. 그래야 three의 조명·톤매핑·색공간 처리를 그대로 쓸 수 있다.
 * (직접 계산하면 앰비언트/디퓨즈 상수를 손으로 맞춰야 하고 sRGB 변환도 어긋난다.)
 */

/** @returns 굽힘 정도를 프레임마다 바꿀 uniform 묶음 */
export function createBendUniforms(width) {
  return {
    // 0 = 평평, 1 = 최대로 휘어짐
    uBend: { value: 0 },
    // 종이 끝단이 중력으로 처지는 정도
    uDroop: { value: 0 },
    // 경첩에서 바깥쪽까지의 페이지 폭
    uWidth: { value: width },
  }
}

const UNIFORM_DECL = /* glsl */ `
uniform float uBend;
uniform float uDroop;
uniform float uWidth;
`

// 경첩(x=0)을 축으로 하는 원통형 굽힘.
// 법선을 같은 각도로 회전시켜야 휘어진 면의 음영이 맞는다.
const NORMAL_BEND = /* glsl */ `
  float mcmSpan = 1.9 * uBend;
  float mcmT = clamp(position.x / uWidth, 0.0, 1.0);
  float mcmPhi = mcmT * mcmSpan;
  if (mcmSpan > 0.0005) {
    float mcmCos = cos(mcmPhi);
    float mcmSin = sin(mcmPhi);
    objectNormal = vec3(
      mcmCos * objectNormal.x + mcmSin * objectNormal.z,
      objectNormal.y,
      -mcmSin * objectNormal.x + mcmCos * objectNormal.z
    );
  }
`

// 정점 x를 호(arc) 위로 재배치해 실제 종이가 말리는 형태를 만든다.
const POSITION_BEND = /* glsl */ `
  if (mcmSpan > 0.0005) {
    float mcmRadius = uWidth / mcmSpan;
    transformed.x = mcmRadius * sin(mcmPhi);
    transformed.z += mcmRadius * (1.0 - cos(mcmPhi));
  }
  transformed.z += uDroop * 0.20 * sin(mcmT * 3.14159265);
  transformed.y -= uDroop * 0.18 * mcmT * mcmT;
`

export function createPaperMaterial(map, side, uniforms) {
  if (side === BackSide) {
    // 뒤에서 보는 면이라 텍스처를 좌우로 뒤집는다.
    map.repeat.x = -1
    map.offset.x = 1
  }

  const material = new MeshStandardMaterial({
    map,
    side,
    roughness: 0.88,
    metalness: 0.05,
  })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBend = uniforms.uBend
    shader.uniforms.uDroop = uniforms.uDroop
    shader.uniforms.uWidth = uniforms.uWidth

    shader.vertexShader = UNIFORM_DECL + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>\n${NORMAL_BEND}`,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n${POSITION_BEND}`,
    )
  }

  return material
}
