import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  DirectionalLight,
  FrontSide,
  Group,
  LinearMipmapLinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from 'three'

import { createBendUniforms, createPaperMaterial } from './paperMaterial.js'

/** 원근의 세기를 정하는 기준 화각. 지면 높이를 이 각으로 담는 거리에 카메라를 둔다. */
const REFERENCE_FOV = 20
/** 장 사이 z 간격. 장 폭에 대한 비율이라 화면 크기가 바뀌어도 두께감이 유지된다. */
const LAYER_RATIO = 0.008
/** 넘어가는 장이 아래 장을 스치지 않도록 들어 올리는 높이. */
const LIFT_RATIO = 0.043

function makeTexture(canvas, maxAnisotropy) {
  const texture = new Texture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearMipmapLinearFilter
  texture.anisotropy = maxAnisotropy
  texture.needsUpdate = true
  return texture
}

/**
 * 여권을 한 장씩 넘기는 장면.
 *
 * 종이 여러 장이 왼쪽 모서리(책등)에 함께 묶여 z축으로 쌓여 있다. 넘기면 맨 위
 * 장이 그 모서리를 축으로 돌아 왼쪽으로 넘어가고 아래 장이 드러난다. 책등을
 * 화면 왼쪽에 두어 지금 보는 장이 정중앙에 오게 한다.
 *
 * 장이 겹쳐 있으므로 넘기는 도중에도 아래 장이 비쳐 보이고, 넘긴 장은 왼쪽에
 * 쌓인다. 한 장만 띄우고 갈아 끼우는 방식과 달리 넘김이 끊기지 않는다.
 */
export function createPassportSheets() {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy?.() ?? 1

  const scene = new Scene()
  // 원근을 얕게 둬야 정면 가독성이 유지되면서 넘어갈 때만 입체가 드러난다.
  const camera = new PerspectiveCamera(REFERENCE_FOV, 1, 0.1, 5000)

  const key = new DirectionalLight(0xfff2e2, 2.1)
  key.position.set(-0.4, 1.0, 1.3)
  const rim = new DirectionalLight(0xffd9b0, 0.5)
  rim.position.set(0.8, 0.2, -0.6)
  const fill = new AmbientLight(0xffffff, 1.35)
  scene.add(key, rim, fill)

  // 책등이 x=0에 오도록 평면을 오른쪽으로 옮긴다. 장은 x 0~1 구간을 쓴다.
  const geometry = new PlaneGeometry(1, 1, 60, 2)
  geometry.translate(0.5, 0, 0)

  const stack = new Group()
  scene.add(stack)

  /** @type {{group: Group, front: Mesh, back: Mesh, bend: ReturnType<typeof createBendUniforms>}[]} */
  let leaves = []
  let owned = []
  let layout = { leafW: 1, leafH: 1 }
  let turned = 0

  function clearLeaves() {
    for (const leaf of leaves) {
      stack.remove(leaf.group)
      leaf.front.material.dispose()
      leaf.back.material.dispose()
    }
    leaves = []
  }

  function place() {
    const { leafW, leafH } = layout
    const layerZ = leafW * LAYER_RATIO
    const count = leaves.length

    for (const [index, leaf] of leaves.entries()) {
      // 이 장이 얼마나 넘어갔는지. 0이면 아직 오른쪽, 1이면 왼쪽으로 넘어갔다.
      const progress = Math.max(0, Math.min(1, turned - index))
      const angle = progress * Math.PI
      const curve = Math.sin(angle)

      leaf.group.rotation.y = -angle
      // 넘기기 전에는 아래일수록 뒤에, 넘긴 뒤에는 순서가 뒤집혀 위로 쌓인다.
      const restZ = (count - index) * layerZ
      const turnedZ = (index + 1) * layerZ
      leaf.group.position.set(
        0,
        0,
        restZ + (turnedZ - restZ) * progress + curve * leafW * LIFT_RATIO,
      )

      // 크기는 group에서 세 축을 한 번에 준다. 메시만 x로 늘리면 셰이더가 보는
      // position.x는 0~1인데 uWidth에는 253.5가 들어가, 굽힘각이 108도가 아니라
      // 0.43도에 그쳐 종이가 아니라 딱딱한 판이 돈다.
      leaf.group.scale.set(leafW, leafH, leafW)
      leaf.bend.uWidth.value = 1
      leaf.bend.uBend.value = curve
      leaf.bend.uDroop.value = curve * 0.09
    }

    // 오른쪽 지면만 보여주므로 책등을 왼쪽에 두고 지면을 화면 가운데 세운다.
    // 넘김은 오른쪽에서 왼쪽으로 흐른다.
    stack.position.x = -leafW / 2
  }

  return {
    canvas: renderer.domElement,

    setSize(width, height, { leafW, leafH }) {
      const w = Math.max(Math.round(width), 1)
      const h = Math.max(Math.round(height), 1)
      renderer.setPixelRatio(Math.min(Math.max(globalThis.devicePixelRatio ?? 1, 2), 3))
      renderer.setSize(w, h, false)

      layout = { leafW, leafH }

      camera.aspect = w / h
      // 카메라 거리는 지면 높이로 정한다. 캔버스에 준 여유(넘어가는 종이가
      // 나갈 공간)까지 거리에 반영하면 카메라가 멀어져 원근이 납작해진다.
      const distance = leafH / (2 * Math.tan((REFERENCE_FOV * Math.PI) / 360))
      // 화각은 캔버스 전체가 담기도록 넓힌다. 이러면 보이는 세계 높이가 캔버스
      // 픽셀 높이와 같아져, leafH가 곧 그려지는 픽셀 높이가 된다.
      camera.fov = (2 * Math.atan(h / (2 * distance)) * 180) / Math.PI
      camera.position.set(0, 0, distance)
      camera.updateProjectionMatrix()
      place()
    },

    /**
     * 장마다 앞면과 뒷면을 canvas로 준다. 순서가 곧 넘기는 순서다.
     * @param {{front: HTMLCanvasElement|null, back: HTMLCanvasElement|null}[]} pages
     */
    setSheets(pages) {
      for (const texture of owned) texture.dispose()
      owned = []
      clearLeaves()

      for (const { front, back } of pages) {
        const bend = createBendUniforms(1)
        const frontTexture = makeTexture(front ?? document.createElement('canvas'), maxAnisotropy)
        const backTexture = makeTexture(back ?? document.createElement('canvas'), maxAnisotropy)
        // 뒤에서 보는 면이라 좌우를 뒤집는다.
        backTexture.repeat.x = -1
        backTexture.offset.x = 1
        owned.push(frontTexture, backTexture)

        const frontMesh = new Mesh(geometry, createPaperMaterial(frontTexture, FrontSide, bend))
        const backMesh = new Mesh(geometry, createPaperMaterial(backTexture, BackSide, bend))
        const group = new Group()
        group.add(frontMesh, backMesh)
        stack.add(group)
        leaves.push({ group, front: frontMesh, back: backMesh, bend })
      }
      place()
    },

    /**
     * 넘어간 장 수. 1.4면 첫 장은 다 넘어갔고 둘째 장이 40% 넘어가는 중이다.
     */
    setTurn(amount) {
      turned = amount
      place()
    },

    render() {
      renderer.render(scene, camera)
    },

    dispose() {
      for (const texture of owned) texture.dispose()
      owned = []
      clearLeaves()
      geometry.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
